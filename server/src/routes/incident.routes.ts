import { Router } from 'express'
import { IncidentController } from '../controllers/incident.controller.js'
import { IncidentService } from '../services/incident.service.js'
import { IncidentRepository } from '../repositories/incident.repository.js'
import { ServiceRepository } from '../repositories/service.repository.js'
import { Database } from '../db/database.js'

export function createIncidentRouter(db: Database): Router {
  const router = Router()
  const incidentRepo = new IncidentRepository(db)
  const serviceRepo = new ServiceRepository(db)
  const service = new IncidentService(incidentRepo, serviceRepo)
  const controller = new IncidentController(service)

  router.get('/', controller.getAll)
  router.get('/:id', controller.getById)
  router.post('/', controller.create)
  router.post('/:id/updates', controller.addUpdate)

  return router
}
