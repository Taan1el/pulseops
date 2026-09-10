import { Router } from 'express'
import { ServiceController } from '../controllers/service.controller.js'
import { ServiceRepository } from '../repositories/service.repository.js'
import { Database } from '../db/database.js'

export function createServiceRouter(db: Database): Router {
  const router = Router()
  const repo = new ServiceRepository(db)
  const controller = new ServiceController(repo)

  router.get('/', controller.getAll)
  router.get('/:id', controller.getById)
  router.post('/', controller.create)
  router.patch('/:id', controller.update)

  return router
}
