import { ServiceRepository } from '../repositories/service.repository.js'
import { IncidentRepository } from '../repositories/incident.repository.js'
import type { SystemMetrics } from '../../../shared/types.js'

export class MetricsService {
  constructor(
    private serviceRepo: ServiceRepository,
    private incidentRepo: IncidentRepository,
  ) {}

  getSystemMetrics(): SystemMetrics {
    const services = this.serviceRepo.findAll()
    const totalServices = services.length

    const operationalCount = services.filter((s) => s.status === 'operational').length
    const degradedCount = services.filter((s) => s.status === 'degraded').length
    const outageCount = services.filter((s) => s.status === 'outage').length

    const activeIncidentCount = this.incidentRepo.countActive()
    const resolvedIncidentCount = this.incidentRepo.countResolved()

    const overallUptime =
      totalServices > 0
        ? Number(
            (
              services.reduce((acc, s) => acc + s.uptimePercentage, 0) /
              totalServices
            ).toFixed(2),
          )
        : 100.0

    return {
      overallUptime,
      totalServices,
      operationalCount,
      degradedCount,
      outageCount,
      activeIncidentCount,
      resolvedIncidentCount,
    }
  }
}
