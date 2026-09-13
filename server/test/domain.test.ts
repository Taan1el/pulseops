import { describe, it, expect } from 'vitest'
import { computeSystemMetrics, generateSlug, nextServiceStatusForSeverity } from '../../shared/domain.js'
import type { Service } from '../../shared/types.js'

describe('generateSlug', () => {
  it('lowercases and hyphenates a normal name', () => {
    expect(generateSlug('Core REST API')).toBe('core-rest-api')
  })

  it('collapses punctuation and symbols into single hyphens', () => {
    expect(generateSlug('Auth & Identity API!!')).toBe('auth-identity-api')
  })

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('--Edge Cache--')).toBe('edge-cache')
  })

  it('collapses repeated whitespace into one hyphen', () => {
    expect(generateSlug('Search   And   Indexing')).toBe('search-and-indexing')
  })
})

describe('nextServiceStatusForSeverity', () => {
  it('always forces an outage for p1, regardless of current status', () => {
    expect(nextServiceStatusForSeverity('operational', 'p1')).toBe('outage')
    expect(nextServiceStatusForSeverity('degraded', 'p1')).toBe('outage')
    expect(nextServiceStatusForSeverity('outage', 'p1')).toBe('outage')
  })

  it('degrades a service for p2 unless it is already down', () => {
    expect(nextServiceStatusForSeverity('operational', 'p2')).toBe('degraded')
    expect(nextServiceStatusForSeverity('degraded', 'p2')).toBe('degraded')
    expect(nextServiceStatusForSeverity('outage', 'p2')).toBeNull()
  })

  it('only degrades a fully operational service for p3', () => {
    expect(nextServiceStatusForSeverity('operational', 'p3')).toBe('degraded')
    expect(nextServiceStatusForSeverity('degraded', 'p3')).toBeNull()
    expect(nextServiceStatusForSeverity('outage', 'p3')).toBeNull()
  })

  it('never changes status for p4', () => {
    expect(nextServiceStatusForSeverity('operational', 'p4')).toBeNull()
    expect(nextServiceStatusForSeverity('outage', 'p4')).toBeNull()
  })
})

describe('computeSystemMetrics', () => {
  const baseService: Omit<Service, 'id' | 'status' | 'uptimePercentage'> = {
    name: 'Test Service',
    slug: 'test-service',
    description: 'A service used only in tests.',
    tier: 'standard',
    updatedAt: new Date().toISOString(),
  }

  function service(id: number, status: Service['status'], uptimePercentage: number): Service {
    return { ...baseService, id, status, uptimePercentage }
  }

  it('reports 100% uptime and zero counts when there are no services', () => {
    expect(computeSystemMetrics([], 0, 0)).toEqual({
      overallUptime: 100,
      totalServices: 0,
      operationalCount: 0,
      degradedCount: 0,
      outageCount: 0,
      activeIncidentCount: 0,
      resolvedIncidentCount: 0,
    })
  })

  it('counts services by status and averages uptime, rounded to 2 decimals', () => {
    const services = [
      service(1, 'operational', 99.999),
      service(2, 'degraded', 98.0),
      service(3, 'outage', 90.0),
    ]

    const metrics = computeSystemMetrics(services, 2, 5)

    expect(metrics.totalServices).toBe(3)
    expect(metrics.operationalCount).toBe(1)
    expect(metrics.degradedCount).toBe(1)
    expect(metrics.outageCount).toBe(1)
    expect(metrics.activeIncidentCount).toBe(2)
    expect(metrics.resolvedIncidentCount).toBe(5)
    // (99.999 + 98 + 90) / 3 = 95.999666... -> rounds to 96.00
    expect(metrics.overallUptime).toBe(96)
  })
})
