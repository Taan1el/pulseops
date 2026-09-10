import { Router } from 'express'
import { MetricsController } from '../controllers/metrics.controller.js'
import { MetricsService } from '../services/metrics.service.js'
import { ServiceRepository } from '../repositories/service.repository.js'
import { IncidentRepository } from '../repositories/incident.repository.js'
import { Database } from '../db/database.js'

export function createMetricsRouter(db: Database): Router {
  const router = Router()
  const serviceRepo = new ServiceRepository(db)
  const incidentRepo = new IncidentRepository(db)
  const service = new MetricsService(serviceRepo, incidentRepo)
  const controller = new MetricsController(service)

  router.get('/', controller.getMetrics)

  return router
}
