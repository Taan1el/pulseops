import { IncidentRepository } from '../repositories/incident.repository.js'
import { ServiceRepository } from '../repositories/service.repository.js'
import type {
  AddIncidentUpdateDto,
  CreateIncidentDto,
  Incident,
  IncidentUpdate,
  ServiceStatus,
} from '../../../shared/types.js'

export class IncidentService {
  constructor(
    private incidentRepo: IncidentRepository,
    private serviceRepo: ServiceRepository,
  ) {}

  getAllIncidents(filter?: { status?: any; serviceId?: number }): Incident[] {
    return this.incidentRepo.findAll(filter)
  }

  getIncidentById(id: number): Incident | undefined {
    return this.incidentRepo.findById(id)
  }

  createIncident(dto: CreateIncidentDto): Incident {
    const service = this.serviceRepo.findById(dto.serviceId)
    if (!service) {
      throw new Error(`Service with ID ${dto.serviceId} not found`)
    }

    const incident = this.incidentRepo.create(dto)

    // State machine: auto-update service status based on incident severity
    let nextStatus: ServiceStatus | null = null
    if (dto.severity === 'p1') {
      nextStatus = 'outage'
    } else if (dto.severity === 'p2') {
      if (service.status !== 'outage') {
        nextStatus = 'degraded'
      }
    } else if (dto.severity === 'p3') {
      if (service.status === 'operational') {
        nextStatus = 'degraded'
      }
    }

    if (nextStatus) {
      this.serviceRepo.updateStatus(service.id, nextStatus)
    }

    return incident
  }

  addUpdate(
    incidentId: number,
    dto: AddIncidentUpdateDto,
  ): { incident: Incident; update: IncidentUpdate } {
    const existing = this.incidentRepo.findById(incidentId)
    if (!existing) {
      throw new Error(`Incident with ID ${incidentId} not found`)
    }

    const update = this.incidentRepo.addUpdate({ incidentId, ...dto })

    // If resolving, check if service has remaining active incidents
    if (dto.status === 'resolved') {
      const remainingActive = this.incidentRepo.countActiveByService(existing.serviceId)
      if (remainingActive === 0) {
        this.serviceRepo.updateStatus(existing.serviceId, 'operational')
      }
    }

    const updatedIncident = this.incidentRepo.findById(incidentId)!
    return { incident: updatedIncident, update }
  }
}
