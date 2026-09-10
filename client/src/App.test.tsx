import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
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

describe('PulseOps Frontend App', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getServices').mockResolvedValue(mockServices)
    vi.spyOn(api, 'getIncidents').mockResolvedValue(mockIncidents)
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics)
  })

  it('renders application brand, overview banner, and metrics', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'PulseOps' })).toBeInTheDocument()
    expect(
      screen.getByText(/Incident & Service Health Platform/),
    ).toBeInTheDocument()
    expect(screen.getByText('FULL-STACK EVALUATION')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('99.91%')).toBeInTheDocument()
      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })
  })

  it('renders service cards and operational statuses', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Auth API')).toBeInTheDocument()
      expect(screen.getByText('Payment Gateway')).toBeInTheDocument()
    })
  })

  it('renders incident feed and severity badges', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('High Gateway Latency')).toBeInTheDocument()
      expect(screen.getByText('P2 - Major Impairment')).toBeInTheDocument()
    })
  })

  it('opens and closes the Declare Incident modal', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Auth API')).toBeInTheDocument()
    })

    const reportButton = screen.getByRole('button', { name: 'Report Incident' })
    await user.click(reportButton)

    expect(screen.getByRole('heading', { name: 'Declare Incident' })).toBeInTheDocument()
    expect(screen.getByLabelText('Incident Title *')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Close modal' })
    await user.click(closeBtn)

    expect(screen.queryByRole('heading', { name: 'Declare Incident' })).not.toBeInTheDocument()
  })

  it('opens and closes the Register Service modal', async () => {
    const user = userEvent.setup()
    render(<App />)

    const registerBtn = screen.getByRole('button', { name: '+ Register Service' })
    await user.click(registerBtn)

    expect(screen.getByRole('heading', { name: 'Register Service' })).toBeInTheDocument()
    expect(screen.getByLabelText('Service Name *')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Close modal' })
    await user.click(closeBtn)

    expect(screen.queryByRole('heading', { name: 'Register Service' })).not.toBeInTheDocument()
  })
})
