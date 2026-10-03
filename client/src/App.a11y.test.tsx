import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from './App'
import { axe } from './test/axe'
import { api } from './services/api'
import type { Incident, Service, SystemMetrics } from '../../shared/types'

const mockServices: Service[] = [
  {
    id: 1,
    name: 'Auth API',
    slug: 'auth-api',
    description: 'User authentication service',
    status: 'operational',
    tier: 'critical',
    uptimePercentage: 99.98,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Payment Gateway',
    slug: 'payment-gateway',
    description: 'Payment webhooks service',
    status: 'degraded',
    tier: 'critical',
    uptimePercentage: 99.85,
    updatedAt: new Date().toISOString(),
  },
]

const mockIncidents: Incident[] = [
  {
    id: 101,
    title: 'High Gateway Latency',
    status: 'investigating',
    severity: 'p2',
    serviceId: 2,
    serviceName: 'Payment Gateway',
    summary: 'Elevated p99 latency observed on Stripe checkout.',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    updates: [
      {
        id: 1,
        incidentId: 101,
        status: 'investigating',
        message: 'Investigating upstream provider connectivity.',
        createdAt: new Date().toISOString(),
      },
    ],
  },
]

const mockMetrics: SystemMetrics = {
  overallUptime: 99.91,
  totalServices: 2,
  operationalCount: 1,
  degradedCount: 1,
  outageCount: 0,
  activeIncidentCount: 1,
  resolvedIncidentCount: 0,
}

describe('Accessibility (axe, WCAG 2 A and AA)', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getServices').mockResolvedValue(mockServices)
    vi.spyOn(api, 'getIncidents').mockResolvedValue(mockIncidents)
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('status page has no violations', async () => {
    const { container } = render(<App />)
    await waitFor(() => expect(screen.getByText('High Gateway Latency')).toBeInTheDocument())
    expect(await axe(container)).toHaveNoViolations()
  })

  it('declare incident dialog has no violations', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await waitFor(() => expect(screen.getByText('Auth API')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Declare incident' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('register service dialog has no violations', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    await waitFor(() => expect(screen.getByText('Auth API')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Register service' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
