import { createApp } from './app.js'
import { getDatabase } from './db/database.js'
import { seedDatabase } from './db/seed.js'

const PORT = Number(process.env.PORT) || 4000
const DB_PATH = process.env.DATABASE_PATH || './data/pulseops.db'

const db = getDatabase(DB_PATH)
seedDatabase(db)

const app = createApp(db)

const server = app.listen(PORT, () => {
  console.log(`[PulseOps API] Server listening on http://localhost:${PORT}`)
  console.log(`[PulseOps API] Database initialized at: ${DB_PATH}`)
})

process.on('SIGTERM', () => {
  console.log('[PulseOps API] Shutting down gracefully...')
  server.close(() => {
    db.close()
    process.exit(0)
  })
})
