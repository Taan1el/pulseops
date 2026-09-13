import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createTestDatabase, Database } from '../src/db/database.js'
import { seedDatabase } from '../src/db/seed.js'

describe('PulseOps API Integration Tests', () => {
  let db: Database
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    db = createTestDatabase()
    seedDatabase(db)
    app = createApp(db)
  })

  afterEach(() => {
    db.close()
  })

  it('GET /api/health returns 200 and healthy database status', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('healthy')
    expect(res.body.database).toBe('connected')
  })

  it('GET /api/services returns seeded service list', async () => {
    const res = await request(app).get('/api/services')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThanOrEqual(6)
    expect(res.body.data[0]).toHaveProperty('name')
    expect(res.body.data[0]).toHaveProperty('status')
    expect(res.body.data[0]).toHaveProperty('uptimePercentage')
  })

  it('POST /api/services creates a new service with auto-generated slug', async () => {
    const newService = {
      name: 'Realtime WebSocket Cluster',
      description: 'Socket.io and WebSub broker for high-throughput live events.',
      tier: 'standard',
    }

    const res = await request(app).post('/api/services').send(newService)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe(newService.name)
    expect(res.body.data.slug).toBe('realtime-websocket-cluster')
    expect(res.body.data.status).toBe('operational')
    expect(res.body.data.uptimePercentage).toBe(100.0)
  })

  it('POST /api/incidents with P1 severity automatically updates service to outage', async () => {
    // Pick first service
    const servicesRes = await request(app).get('/api/services')
    const targetService = servicesRes.body.data[0]
    expect(targetService.status).toBe('operational')

    // Create P1 incident
    const incidentPayload = {
      title: 'Global Database Connection Pool Exhaustion',
      severity: 'p1',
      serviceId: targetService.id,
      summary: 'All connection pools saturated due to unindexed query spike.',
    }

    const incidentRes = await request(app).post('/api/incidents').send(incidentPayload)
    expect(incidentRes.status).toBe(201)
    expect(incidentRes.body.success).toBe(true)
    expect(incidentRes.body.data.title).toBe(incidentPayload.title)
    expect(incidentRes.body.data.status).toBe('investigating')

    // Verify service status transitioned to outage
    const updatedServiceRes = await request(app).get(`/api/services/${targetService.id}`)
    expect(updatedServiceRes.body.data.status).toBe('outage')
  })

  it('resolving an incident restores the service to operational when no other active incidents remain', async () => {
    const servicesRes = await request(app).get('/api/services')
    const targetService = servicesRes.body.data[0]

    // Create P1 incident
    const incidentRes = await request(app).post('/api/incidents').send({
      title: 'Transient Gateway Failure',
      severity: 'p1',
      serviceId: targetService.id,
      summary: 'Bad deploy causing edge 502 errors.',
    })
    const incidentId = incidentRes.body.data.id

    // Check service is outage
    const outageCheck = await request(app).get(`/api/services/${targetService.id}`)
    expect(outageCheck.body.data.status).toBe('outage')

    // Post update resolving the incident
    const updateRes = await request(app)
      .post(`/api/incidents/${incidentId}/updates`)
      .send({
        status: 'resolved',
        message: 'Rolled back previous deployment. All edge nodes healthy.',
      })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.incident.status).toBe('resolved')
    expect(updateRes.body.data.incident.resolvedAt).not.toBeNull()

    // Service should now be back to operational
    const restoredCheck = await request(app).get(`/api/services/${targetService.id}`)
    expect(restoredCheck.body.data.status).toBe('operational')
  })

  it('GET /api/metrics computes correct live system statistics', async () => {
    const res = await request(app).get('/api/metrics')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('overallUptime')
    expect(res.body.data).toHaveProperty('totalServices')
    expect(res.body.data).toHaveProperty('operationalCount')
    expect(res.body.data).toHaveProperty('activeIncidentCount')
  })

  it('POST /api/incidents returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/incidents').send({
      title: 'Incomplete',
    })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toContain('required')
  })

  it('returns 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown-endpoint')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('POST /api/services returns 409 for a duplicate name without leaking SQL details', async () => {
    const res = await request(app).post('/api/services').send({
      name: 'Core REST API',
      description: 'Another service that collides with an existing slug.',
    })
    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('A service named "Core REST API" already exists')
    expect(res.body.error.toLowerCase()).not.toContain('sql')
    expect(res.body.error.toLowerCase()).not.toContain('constraint')
  })

  it('POST /api/services returns 400 for an invalid tier without leaking SQL details', async () => {
    const res = await request(app).post('/api/services').send({
      name: 'Bogus Tier Service',
      description: 'Should be rejected before it reaches the database.',
      tier: 'bogus',
    })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toContain('Invalid tier')
    expect(res.body.error.toLowerCase()).not.toContain('constraint')
  })

  it('PATCH /api/services/:id returns 400 for an invalid status without leaking SQL details', async () => {
    const servicesRes = await request(app).get('/api/services')
    const targetService = servicesRes.body.data[0]

    const res = await request(app)
      .patch(`/api/services/${targetService.id}`)
      .send({ status: 'bogus' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toContain('Invalid status')
    expect(res.body.error.toLowerCase()).not.toContain('constraint')
  })

  it('POST /api/incidents returns 404 with a clean message when the service does not exist', async () => {
    const res = await request(app).post('/api/incidents').send({
      title: 'Orphan incident',
      severity: 'p1',
      serviceId: 999999,
      summary: 'References a service that was never created.',
    })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Service with ID 999999 not found')
  })

  it('returns 400 for a malformed JSON body instead of a generic server error', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Content-Type', 'application/json')
      .send('{"name": "Broken JSON"')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('Invalid JSON in request body')
  })
})

describe('Static client serving', () => {
  let db: Database
  let clientDistPath: string

  beforeEach(() => {
    db = createTestDatabase()
    seedDatabase(db)
    clientDistPath = mkdtempSync(path.join(tmpdir(), 'pulseops-client-dist-'))
    writeFileSync(path.join(clientDistPath, 'index.html'), '<!doctype html><title>PulseOps</title>')
  })

  afterEach(() => {
    db.close()
    rmSync(clientDistPath, { recursive: true, force: true })
  })

  it('serves the built client at the root when a build is present', async () => {
    const app = createApp(db, clientDistPath)
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('PulseOps')
  })

  it('falls back to index.html for client-side routes instead of 404ing', async () => {
    const app = createApp(db, clientDistPath)
    const res = await request(app).get('/some/client/route')
    expect(res.status).toBe(200)
    expect(res.text).toContain('PulseOps')
  })

  it('still returns a JSON 404 for an unknown API route when a client build is present', async () => {
    const app = createApp(db, clientDistPath)
    const res = await request(app).get('/api/unknown-endpoint')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('still serves the API normally alongside the static client', async () => {
    const app = createApp(db, clientDistPath)
    const res = await request(app).get('/api/services')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('returns a JSON 404 instead of a file when no client build exists', async () => {
    const app = createApp(db, path.join(clientDistPath, 'does-not-exist'))
    const res = await request(app).get('/')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
