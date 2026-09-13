import type { Request, Response, NextFunction } from 'express'
import { ServiceRepository } from '../repositories/service.repository.js'
import type { CreateServiceDto, UpdateServiceDto } from '../../../shared/types.js'

const VALID_TIERS = ['critical', 'standard', 'internal']
const VALID_STATUSES = ['operational', 'degraded', 'outage', 'maintenance']

export class ServiceController {
  constructor(private serviceRepo: ServiceRepository) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const services = this.serviceRepo.findAll()
      res.json({ success: true, data: services })
    } catch (err) {
      next(err)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      const service = this.serviceRepo.findById(id)
      if (!service) {
        res.status(404).json({ success: false, error: 'Service not found' })
        return
      }
      res.json({ success: true, data: service })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, tier, status } = req.body as CreateServiceDto
      if (!name || typeof name !== 'string' || !description || typeof description !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Name and description are required',
        })
        return
      }

      if (tier && !VALID_TIERS.includes(tier)) {
        res.status(400).json({
          success: false,
          error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`,
        })
        return
      }

      if (status && !VALID_STATUSES.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        })
        return
      }

      const service = this.serviceRepo.create({ name, description, tier, status })
      res.status(201).json({ success: true, data: service })
    } catch (err) {
      next(err)
    }
  }

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      const data = req.body as UpdateServiceDto

      if (data.tier && !VALID_TIERS.includes(data.tier)) {
        res.status(400).json({
          success: false,
          error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`,
        })
        return
      }

      if (data.status && !VALID_STATUSES.includes(data.status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        })
        return
      }

      const service = this.serviceRepo.update(id, data)
      if (!service) {
        res.status(404).json({ success: false, error: 'Service not found' })
        return
      }
      res.json({ success: true, data: service })
    } catch (err) {
      next(err)
    }
  }
}
