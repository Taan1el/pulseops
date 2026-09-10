import express from 'express'
import cors from 'cors'
import { Database } from './db/database.js'
import { createServiceRouter } from './routes/service.routes.js'
import { createIncidentRouter } from './routes/incident.routes.js'
import { createMetricsRouter } from './routes/metrics.routes.js'
import { createHealthRouter } from './routes/health.routes.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

export function createApp(db: Database) {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Mount API endpoints
  app.use('/api/health', createHealthRouter(db))
  app.use('/api/services', createServiceRouter(db))
  app.use('/api/incidents', createIncidentRouter(db))
  app.use('/api/metrics', createMetricsRouter(db))

  // 404 & Error handlers
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
