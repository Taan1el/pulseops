export type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance'

export type ServiceTier = 'critical' | 'standard' | 'internal'

export interface Service {
  id: number
  name: string
  slug: string
  description: string
  status: ServiceStatus
  tier: ServiceTier
  uptimePercentage: number
  updatedAt: string
}

export type IncidentSeverity = 'p1' | 'p2' | 'p3' | 'p4'

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

export interface IncidentUpdate {
  id: number
  incidentId: number
  status: IncidentStatus
  message: string
  createdAt: string
}

export interface Incident {
  id: number
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  serviceId: number
  serviceName?: string
  summary: string
  createdAt: string
  resolvedAt: string | null
  updates?: IncidentUpdate[]
}

export interface SystemMetrics {
  overallUptime: number
  totalServices: number
  operationalCount: number
  degradedCount: number
  outageCount: number
  activeIncidentCount: number
  resolvedIncidentCount: number
}

export interface CreateServiceDto {
  name: string
  slug?: string
  description: string
  tier?: ServiceTier
  status?: ServiceStatus
}

export interface UpdateServiceDto {
  name?: string
  description?: string
  status?: ServiceStatus
  tier?: ServiceTier
}

export interface CreateIncidentDto {
  title: string
  severity: IncidentSeverity
  serviceId: number
  summary: string
  initialStatus?: IncidentStatus
}

export interface AddIncidentUpdateDto {
  status: IncidentStatus
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: Record<string, unknown>
}
