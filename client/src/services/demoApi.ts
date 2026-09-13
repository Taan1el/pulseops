// Browser-only stand-in for services/api.ts, used by the GitHub Pages demo
// build (see main.tsx for how the two are switched). It keeps state in
// memory and in localStorage instead of talking to the Express API, but
// exposes the exact same function signatures and response shapes, and
// reuses the same domain rules from shared/domain.ts so the two behave the
// same way (a P1 incident forces an outage, metrics are computed the same
// way, and so on).
import type {
  AddIncidentUpdateDto,
  CreateIncidentDto,
  CreateServiceDto,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdate,
  Service,
  ServiceStatus,
  ServiceTier,
  SystemMetrics,
} from '../../../shared/types'
import { computeSystemMetrics, generateSlug, nextServiceStatusForSeverity } from '../../../shared/domain'

export const DEMO_STORAGE_KEY = 'pulseops:demo:v1'

const VALID_TIERS: ServiceTier[] = ['critical', 'standard', 'internal']
const VALID_SERVICE_STATUSES: ServiceStatus[] = ['operational', 'degraded', 'outage', 'maintenance']
const VALID_SEVERITIES: IncidentSeverity[] = ['p1', 'p2', 'p3', 'p4']
const VALID_INCIDENT_STATUSES: IncidentStatus[] = ['investigating', 'identified', 'monitoring', 'resolved']

// A little latency so loading skeletons are visible, like the real network
// request they stand in for.
const DEMO_LATENCY_MS = 200

interface DemoState {
  services: Service[]
  incidents: Incident[]
  nextServiceId: number
  nextIncidentId: number
  nextUpdateId: number
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function seedServices(now: string): Service[] {
  const seeds: Array<[string, string, ServiceTier, number]> = [
    ['Auth & Identity API', 'User authentication, token verification, and RBAC authorization service.', 'critical', 99.98],
    ['Payment Processing Gateway', 'Stripe, SEPA, and regional payment webhook ingestion and reconciliation.', 'critical', 99.95],
    ['Core REST API', 'Main product domain REST endpoints serving client dashboards and mobile clients.', 'critical', 99.99],
    ['Search & Indexing Engine', 'Elasticsearch cluster indexing user resources and fast query resolution.', 'standard', 99.85],
    ['Notification & Webhook Dispatcher', 'Reliable message queue for outgoing client webhooks, email, and SMS notifications.', 'standard', 99.91],
    ['Analytics & Audit Pipeline', 'Background stream recording user activity logs and compliance audit trails.', 'internal', 99.70],
  ]

  return seeds.map(([name, description, tier, uptimePercentage], index) => ({
    id: index + 1,
    name,
    slug: generateSlug(name),
    description,
    status: 'operational',
    tier,
    uptimePercentage,
    updatedAt: now,
  }))
}

function seedIncidents(authServiceId: number): Incident[] {
  const openedAt = new Date(Date.now() - 3600 * 1000 * 3).toISOString()
  const identifiedAt = new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  const resolvedAt = new Date(Date.now() - 3600 * 1000 * 1).toISOString()

  const updates: IncidentUpdate[] = [
    {
      id: 3,
      incidentId: 1,
      status: 'resolved',
      message: 'Cache replica synchronization complete and error rate returned to 0.00%. Incident resolved.',
      createdAt: resolvedAt,
    },
    {
      id: 2,
      incidentId: 1,
      status: 'identified',
      message: 'Redis replica synchronizing caused cache lookup timeouts. Traffic redirected to primary cache.',
      createdAt: identifiedAt,
    },
    {
      id: 1,
      incidentId: 1,
      status: 'investigating',
      message: 'We are investigating reports of slow authentication requests affecting login endpoints.',
      createdAt: openedAt,
    },
  ]

  return [
    {
      id: 1,
      title: 'Elevated JWT Token Validation Latency',
      status: 'resolved',
      severity: 'p2',
      serviceId: authServiceId,
      serviceName: 'Auth & Identity API',
      summary:
        'Downstream Redis replica lag caused transient 504 gateway timeouts on token validation endpoints.',
      createdAt: openedAt,
      resolvedAt,
      updates,
    },
  ]
}

function createSeedState(): DemoState {
  const now = new Date().toISOString()
  const services = seedServices(now)
  const authService = services.find((s) => s.slug === 'auth-identity-api')
  const incidents = seedIncidents(authService?.id ?? services[0].id)

  return {
    services,
    incidents,
    nextServiceId: services.length + 1,
    nextIncidentId: incidents.length + 1,
    nextUpdateId: incidents.reduce((max, i) => Math.max(max, ...(i.updates ?? []).map((u) => u.id)), 0) + 1,
  }
}

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const maybeState = value as Partial<DemoState>
  return Array.isArray(maybeState.services) && Array.isArray(maybeState.incidents)
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isDemoState(parsed)) return parsed
    }
  } catch {
    // Corrupted or inaccessible storage: fall through and reseed.
  }
  const seeded = createSeedState()
  persist(seeded)
  return seeded
}

function persist(state: DemoState): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage may be unavailable (private browsing, full quota). The
    // demo still works for the current page load, it just will not persist.
  }
}

// Lazily initialized so importing this module never touches localStorage
// unless demo mode is actually in use.
let cachedState: DemoState | null = null

function getState(): DemoState {
  if (!cachedState) {
    cachedState = loadState()
  }
  return cachedState
}

function save(): void {
  if (cachedState) persist(cachedState)
}

/** Clears all demo data and reseeds it. Used by the "Reset demo data" control. */
export function resetDemoData(): void {
  cachedState = createSeedState()
  persist(cachedState)
}

function compareServices(a: Service, b: Service): number {
  const aCritical = a.tier === 'critical' ? 0 : 1
  const bCritical = b.tier === 'critical' ? 0 : 1
  if (aCritical !== bCritical) return aCritical - bCritical
  return a.name.localeCompare(b.name)
}

function compareIncidents(a: Incident, b: Incident): number {
  const aResolved = a.status === 'resolved' ? 1 : 0
  const bResolved = b.status === 'resolved' ? 1 : 0
  if (aResolved !== bResolved) return aResolved - bResolved
  return b.createdAt.localeCompare(a.createdAt)
}

export const demoApi = {
  async getHealth(): Promise<{ status: string; database: string }> {
    await delay(DEMO_LATENCY_MS)
    return { status: 'healthy', database: 'demo (in-browser)' }
  },

  async getServices(): Promise<Service[]> {
    await delay(DEMO_LATENCY_MS)
    return [...getState().services].sort(compareServices)
  },

  async createService(dto: CreateServiceDto): Promise<Service> {
    await delay(DEMO_LATENCY_MS)
    const state = getState()

    if (!dto.name || typeof dto.name !== 'string' || !dto.description || typeof dto.description !== 'string') {
      throw new Error('Name and description are required')
    }
    if (dto.tier && !VALID_TIERS.includes(dto.tier)) {
      throw new Error(`Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`)
    }
    if (dto.status && !VALID_SERVICE_STATUSES.includes(dto.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_SERVICE_STATUSES.join(', ')}`)
    }

    const slug = dto.slug ?? generateSlug(dto.name)
    if (state.services.some((s) => s.slug === slug)) {
      throw new Error(`A service named "${dto.name}" already exists`)
    }

    const now = new Date().toISOString()
    const service: Service = {
      id: state.nextServiceId++,
      name: dto.name,
      slug,
      description: dto.description,
      status: dto.status ?? 'operational',
      tier: dto.tier ?? 'standard',
      uptimePercentage: 100,
      updatedAt: now,
    }
    state.services.push(service)
    save()
    return service
  },

  async getIncidents(status?: string): Promise<Incident[]> {
    await delay(DEMO_LATENCY_MS)
    const state = getState()
    const filtered = status ? state.incidents.filter((i) => i.status === status) : state.incidents
    return [...filtered].sort(compareIncidents)
  },

  async getIncident(id: number): Promise<Incident> {
    await delay(DEMO_LATENCY_MS)
    const incident = getState().incidents.find((i) => i.id === id)
    if (!incident) {
      throw new Error('Incident not found')
    }
    return incident
  },

  async createIncident(dto: CreateIncidentDto): Promise<Incident> {
    await delay(DEMO_LATENCY_MS)
    const state = getState()

    if (!dto.title || !dto.severity || !dto.serviceId || !dto.summary) {
      throw new Error('Title, severity, serviceId, and summary are required')
    }
    if (!VALID_SEVERITIES.includes(dto.severity)) {
      throw new Error('Invalid severity. Must be one of: p1, p2, p3, p4')
    }
    if (dto.initialStatus && !VALID_INCIDENT_STATUSES.includes(dto.initialStatus)) {
      throw new Error(
        'Invalid initialStatus. Must be one of: investigating, identified, monitoring, resolved',
      )
    }

    const service = state.services.find((s) => s.id === Number(dto.serviceId))
    if (!service) {
      throw new Error(`Service with ID ${dto.serviceId} not found`)
    }

    const now = new Date().toISOString()
    const initialStatus = dto.initialStatus ?? 'investigating'
    const initialUpdate: IncidentUpdate = {
      id: state.nextUpdateId++,
      incidentId: state.nextIncidentId,
      status: initialStatus,
      message: `Incident opened: ${dto.summary}`,
      createdAt: now,
    }

    const incident: Incident = {
      id: state.nextIncidentId++,
      title: dto.title,
      status: initialStatus,
      severity: dto.severity,
      serviceId: service.id,
      serviceName: service.name,
      summary: dto.summary,
      createdAt: now,
      resolvedAt: null,
      updates: [initialUpdate],
    }
    state.incidents.push(incident)

    const nextStatus = nextServiceStatusForSeverity(service.status, dto.severity)
    if (nextStatus) {
      service.status = nextStatus
      service.updatedAt = now
    }

    save()
    return incident
  },

  async addIncidentUpdate(
    incidentId: number,
    dto: AddIncidentUpdateDto,
  ): Promise<{ incident: Incident; update: IncidentUpdate }> {
    await delay(DEMO_LATENCY_MS)
    const state = getState()

    if (!dto.status || !dto.message) {
      throw new Error('Status and message are required')
    }
    if (!VALID_INCIDENT_STATUSES.includes(dto.status)) {
      throw new Error(
        'Invalid status. Must be one of: investigating, identified, monitoring, resolved',
      )
    }

    const incident = state.incidents.find((i) => i.id === incidentId)
    if (!incident) {
      throw new Error(`Incident with ID ${incidentId} not found`)
    }

    const now = new Date().toISOString()
    const update: IncidentUpdate = {
      id: state.nextUpdateId++,
      incidentId,
      status: dto.status,
      message: dto.message,
      createdAt: now,
    }

    incident.updates = [update, ...(incident.updates ?? [])]
    incident.status = dto.status
    incident.resolvedAt = dto.status === 'resolved' ? now : incident.resolvedAt

    if (dto.status === 'resolved') {
      const remainingActive = state.incidents.some(
        (i) => i.serviceId === incident.serviceId && i.status !== 'resolved',
      )
      if (!remainingActive) {
        const service = state.services.find((s) => s.id === incident.serviceId)
        if (service) {
          service.status = 'operational'
          service.updatedAt = now
        }
      }
    }

    save()
    return { incident, update }
  },

  async getMetrics(): Promise<SystemMetrics> {
    await delay(DEMO_LATENCY_MS)
    const state = getState()
    const activeIncidentCount = state.incidents.filter((i) => i.status !== 'resolved').length
    const resolvedIncidentCount = state.incidents.filter((i) => i.status === 'resolved').length
    return computeSystemMetrics(state.services, activeIncidentCount, resolvedIncidentCount)
  },
}
