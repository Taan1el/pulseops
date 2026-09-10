import type {
  ApiResponse,
  CreateIncidentDto,
  CreateServiceDto,
  AddIncidentUpdateDto,
  Incident,
  IncidentUpdate,
  Service,
  SystemMetrics,
} from '../../../shared/types'

const BASE_URL = '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(errorBody.error || `HTTP ${res.status}: ${res.statusText}`)
  }
  const json: ApiResponse<T> = await res.json()
  if (!json.success && json.error) {
    throw new Error(json.error)
  }
  return json.data as T
}

export const api = {
  async getHealth(): Promise<{ status: string; database: string }> {
    const res = await fetch(`${BASE_URL}/health`)
    return res.json()
  },

  async getServices(): Promise<Service[]> {
    const res = await fetch(`${BASE_URL}/services`)
    return handleResponse<Service[]>(res)
  },

  async createService(dto: CreateServiceDto): Promise<Service> {
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    return handleResponse<Service>(res)
  },

  async getIncidents(status?: string): Promise<Incident[]> {
    const url = status ? `${BASE_URL}/incidents?status=${status}` : `${BASE_URL}/incidents`
    const res = await fetch(url)
    return handleResponse<Incident[]>(res)
  },

  async getIncident(id: number): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/incidents/${id}`)
    return handleResponse<Incident>(res)
  },

  async createIncident(dto: CreateIncidentDto): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    return handleResponse<Incident>(res)
  },

  async addIncidentUpdate(
    incidentId: number,
    dto: AddIncidentUpdateDto,
  ): Promise<{ incident: Incident; update: IncidentUpdate }> {
    const res = await fetch(`${BASE_URL}/incidents/${incidentId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    return handleResponse<{ incident: Incident; update: IncidentUpdate }>(res)
  },

  async getMetrics(): Promise<SystemMetrics> {
    const res = await fetch(`${BASE_URL}/metrics`)
    return handleResponse<SystemMetrics>(res)
  },
}
