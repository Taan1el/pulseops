import { Router } from 'express'
import { Database } from '../db/database.js'

export function createHealthRouter(db: Database): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    try {
      // Ping DB
      const result = db.queryOne<{ ok: number }>('SELECT 1 as ok')
      const isDbHealthy = result?.ok === 1

      res.status(isDbHealthy ? 200 : 503).json({
        status: isDbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: isDbHealthy ? 'connected' : 'disconnected',
        uptimeSeconds: process.uptime(),
        version: '1.0.0',
      })
    } catch (err) {
      console.error('[PulseOps Health Check]:', err)
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'error',
      })
    }
  })

  return router
}
