import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_STORAGE_KEY, demoApi, resetDemoData } from './demoApi'

describe('demoApi', () => {
  beforeEach(() => {
    localStorage.clear()
    resetDemoData()
  })

  it('seeds a non-empty, realistic service and incident list', async () => {
    const services = await demoApi.getServices()
    const incidents = await demoApi.getIncidents()

    expect(services.length).toBeGreaterThanOrEqual(6)
    expect(services.every((s) => s.status === 'operational')).toBe(true)
    expect(incidents.length).toBeGreaterThanOrEqual(1)
    expect(incidents[0].status).toBe('resolved')
  })

  it('lists critical-tier services before other tiers, alphabetically within each group', async () => {
    const services = await demoApi.getServices()
    const firstNonCriticalIndex = services.findIndex((s) => s.tier !== 'critical')
    const criticalServices = services.slice(0, firstNonCriticalIndex)

    expect(criticalServices.every((s) => s.tier === 'critical')).toBe(true)
    const names = criticalServices.map((s) => s.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('creates a service with a generated slug and full uptime', async () => {
    const service = await demoApi.createService({
      name: 'Realtime WebSocket Cluster',
      description: 'Socket broker for live events.',
      tier: 'standard',
    })

    expect(service.slug).toBe('realtime-websocket-cluster')
    expect(service.status).toBe('operational')
    expect(service.uptimePercentage).toBe(100)

    const services = await demoApi.getServices()
    expect(services.some((s) => s.id === service.id)).toBe(true)
  })

  it('rejects a duplicate service name with the same message the API returns', async () => {
    await expect(
      demoApi.createService({ name: 'Core REST API', description: 'A duplicate.' }),
    ).rejects.toThrow('A service named "Core REST API" already exists')
  })

  it('rejects an invalid tier without touching stored state', async () => {
    const before = await demoApi.getServices()
    await expect(
      demoApi.createService({ name: 'Bogus', description: 'x', tier: 'bogus' as never }),
    ).rejects.toThrow('Invalid tier')
    const after = await demoApi.getServices()
    expect(after.length).toBe(before.length)
  })

  it('declaring a P1 incident forces the affected service to outage', async () => {
    const services = await demoApi.getServices()
    const target = services.find((s) => s.status === 'operational')!

    const incident = await demoApi.createIncident({
      title: 'Global outage',
      severity: 'p1',
      serviceId: target.id,
      summary: 'Everything is on fire.',
    })

    expect(incident.status).toBe('investigating')
    expect(incident.updates).toHaveLength(1)

    const updated = (await demoApi.getServices()).find((s) => s.id === target.id)
    expect(updated?.status).toBe('outage')
  })

  it('rejects an incident for a service that does not exist', async () => {
    await expect(
      demoApi.createIncident({
        title: 'Orphan',
        severity: 'p1',
        serviceId: 999999,
        summary: 'No such service.',
      }),
    ).rejects.toThrow('Service with ID 999999 not found')
  })

  it('rejects an incomplete incident payload', async () => {
    await expect(
      demoApi.createIncident({ title: 'Missing fields' } as never),
    ).rejects.toThrow('required')
  })

  it('resolving the last active incident restores the service to operational', async () => {
    const services = await demoApi.getServices()
    const target = services.find((s) => s.status === 'operational')!

    const incident = await demoApi.createIncident({
      title: 'Brief blip',
      severity: 'p1',
      serviceId: target.id,
      summary: 'Short-lived issue.',
    })
    expect((await demoApi.getServices()).find((s) => s.id === target.id)?.status).toBe('outage')

    const { incident: resolved } = await demoApi.addIncidentUpdate(incident.id, {
      status: 'resolved',
      message: 'Fixed.',
    })

    expect(resolved.status).toBe('resolved')
    expect(resolved.resolvedAt).not.toBeNull()
    expect(resolved.updates?.[0].message).toBe('Fixed.')
    expect((await demoApi.getServices()).find((s) => s.id === target.id)?.status).toBe('operational')
  })

  it('keeps a service down while another active incident remains', async () => {
    const services = await demoApi.getServices()
    const target = services.find((s) => s.status === 'operational')!

    const first = await demoApi.createIncident({
      title: 'First issue',
      severity: 'p1',
      serviceId: target.id,
      summary: 'One.',
    })
    await demoApi.createIncident({
      title: 'Second issue',
      severity: 'p2',
      serviceId: target.id,
      summary: 'Two.',
    })

    await demoApi.addIncidentUpdate(first.id, { status: 'resolved', message: 'First one fixed.' })

    const updated = (await demoApi.getServices()).find((s) => s.id === target.id)
    expect(updated?.status).not.toBe('operational')
  })

  it('rejects an update for an incident that does not exist', async () => {
    await expect(
      demoApi.addIncidentUpdate(999999, { status: 'resolved', message: 'x' }),
    ).rejects.toThrow('Incident with ID 999999 not found')
  })

  it('computes metrics consistent with the current services and incidents', async () => {
    const services = await demoApi.getServices()
    const target = services.find((s) => s.status === 'operational')!
    await demoApi.createIncident({
      title: 'Metrics check',
      severity: 'p1',
      serviceId: target.id,
      summary: 'Forces one outage.',
    })

    const metrics = await demoApi.getMetrics()
    const allServices = await demoApi.getServices()

    expect(metrics.totalServices).toBe(allServices.length)
    expect(metrics.outageCount).toBe(allServices.filter((s) => s.status === 'outage').length)
    expect(metrics.activeIncidentCount).toBe(1)
  })

  it('persists writes to localStorage under the namespaced demo key', async () => {
    await demoApi.createService({ name: 'Persisted Service', description: 'Should be saved.' })

    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const stored = JSON.parse(raw!)
    expect(stored.services.some((s: { name: string }) => s.name === 'Persisted Service')).toBe(true)
  })

  it('resetDemoData clears mutations back to the seed state', async () => {
    await demoApi.createService({ name: 'Temporary Service', description: 'Will be reset away.' })
    expect((await demoApi.getServices()).some((s) => s.name === 'Temporary Service')).toBe(true)

    resetDemoData()

    expect((await demoApi.getServices()).some((s) => s.name === 'Temporary Service')).toBe(false)
  })
})
