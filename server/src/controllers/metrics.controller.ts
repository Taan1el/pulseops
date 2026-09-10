import type { Request, Response, NextFunction } from 'express'
import { MetricsService } from '../services/metrics.service.js'

export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  getMetrics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = this.metricsService.getSystemMetrics()
      res.json({ success: true, data: metrics })
    } catch (err) {
      next(err)
    }
  }
}
