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
})
