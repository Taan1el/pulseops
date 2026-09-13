import { IncidentRepository } from '../repositories/incident.repository.js'
import { ServiceRepository } from '../repositories/service.repository.js'
import { HttpError } from '../utils/http-error.js'
import { nextServiceStatusForSeverity } from '../../../shared/domain.js'
import type {
  AddIncidentUpdateDto,
  CreateIncidentDto,
  Incident,
  IncidentUpdate,
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
      throw new HttpError(404, `Service with ID ${dto.serviceId} not found`)
    }

    const incident = this.incidentRepo.create(dto)

    // State machine: auto-update service status based on incident severity
    const nextStatus = nextServiceStatusForSeverity(service.status, dto.severity)
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
      throw new HttpError(404, `Incident with ID ${incidentId} not found`)
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
