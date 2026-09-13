import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { Database } from './db/database.js'
import { createServiceRouter } from './routes/service.routes.js'
import { createIncidentRouter } from './routes/incident.routes.js'
import { createMetricsRouter } from './routes/metrics.routes.js'
import { createHealthRouter } from './routes/health.routes.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

// Where the built client lives relative to this compiled file. tsc mirrors
// the workspace layout under server/dist (server/tsconfig.json's "include"
// covers both src/ and the sibling shared/ folder), so this file compiles
// to server/dist/server/src/app.js, not server/dist/app.js. From there it
// is four levels up to the repo root, matching the layout both locally and
// in the Docker image (see Dockerfile and server/package.json's "start").
const DEFAULT_CLIENT_DIST_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../client/dist',
)

export function createApp(db: Database, clientDistPath: string = DEFAULT_CLIENT_DIST_PATH) {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Mount API endpoints
  app.use('/api/health', createHealthRouter(db))
  app.use('/api/services', createServiceRouter(db))
  app.use('/api/incidents', createIncidentRouter(db))
  app.use('/api/metrics', createMetricsRouter(db))

  // Serve the built client when it is present, so the production Docker
  // image can run the API and the dashboard from one container. Local
  // development instead runs the Vite dev server separately and proxies
  // /api requests here, so client/dist usually will not exist yet.
  if (existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath))
    // SPA fallback: any other GET request gets index.html so client-side
    // navigation and page refreshes both work. Routes under /api never
    // reach here, so an unknown API endpoint still gets a JSON 404 below.
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'))
    })
  }

  // 404 & Error handlers
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
