import { ServiceRepository } from '../repositories/service.repository.js'
import { IncidentRepository } from '../repositories/incident.repository.js'
import { computeSystemMetrics } from '../../../shared/domain.js'
import type { SystemMetrics } from '../../../shared/types.js'

export class MetricsService {
  constructor(
    private serviceRepo: ServiceRepository,
    private incidentRepo: IncidentRepository,
  ) {}

  getSystemMetrics(): SystemMetrics {
    const services = this.serviceRepo.findAll()
    const activeIncidentCount = this.incidentRepo.countActive()
    const resolvedIncidentCount = this.incidentRepo.countResolved()

    return computeSystemMetrics(services, activeIncidentCount, resolvedIncidentCount)
  }
}
