import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    vi.spyOn(api, 'getServices').mockResolvedValue(mockServices)
    vi.spyOn(api, 'getIncidents').mockResolvedValue(mockIncidents)
    vi.spyOn(api, 'getMetrics').mockResolvedValue(mockMetrics)
  })

  it('renders application brand and metrics', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'PulseOps' })).toBeInTheDocument()
    expect(
      screen.getByText(/Incident & Service Health Platform/),
    ).toBeInTheDocument()

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

  it('closes an open modal when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Report Incident' }))
    expect(screen.getByRole('heading', { name: 'Declare Incident' })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('heading', { name: 'Declare Incident' })).not.toBeInTheDocument()
  })

  it('focuses the first field when the Register Service modal opens', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '+ Register Service' }))

    expect(screen.getByLabelText('Service Name *')).toHaveFocus()
  })

  it('hides the demo mode banner by default', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Auth API')).toBeInTheDocument())

    expect(screen.queryByText(/Demo mode\./)).not.toBeInTheDocument()
  })

  it('shows the demo mode banner and resets data when VITE_DEMO_MODE is enabled', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    const user = userEvent.setup()
    const originalLocation = window.location
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    })

    try {
      render(<App />)
      await waitFor(() => expect(screen.getByText('Auth API')).toBeInTheDocument())

      expect(screen.getByText(/Demo mode\./)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View the source on GitHub' })).toHaveAttribute(
        'href',
        'https://github.com/Taan1el/pulseops',
      )

      await user.click(screen.getByRole('button', { name: 'Reset demo data' }))
      expect(reloadSpy).toHaveBeenCalledTimes(1)
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    }
  })

  it.each(['getServices', 'getIncidents', 'getMetrics'] as const)(
    'shows a persistent error instead of empty data when %s fails',
    async (method) => {
      vi.mocked(api[method]).mockRejectedValueOnce(new Error('Connection lost'))
      render(<App />)

      expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load dashboard data.')
      expect(screen.getByText('System health unavailable')).toBeInTheDocument()
      expect(screen.queryByText('All Systems Operational')).not.toBeInTheDocument()
      expect(screen.queryByText('No services match the selected tier filter.')).not.toBeInTheDocument()
      expect(screen.queryByText('No incidents found matching the active criteria.')).not.toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'System Metrics' })).not.toBeInTheDocument()

      vi.useFakeTimers()
      act(() => vi.advanceTimersByTime(5000))
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
    },
  )

  it('does not report healthy systems while the first snapshot is loading', async () => {
    let completeMetrics!: (metrics: SystemMetrics) => void
    vi.mocked(api.getMetrics).mockReturnValueOnce(new Promise((resolve) => {
      completeMetrics = resolve
    }))
    render(<App />)
    expect(screen.getByText('Loading system health')).toBeInTheDocument()
    expect(screen.queryByText('All Systems Operational')).not.toBeInTheDocument()

    await act(async () => completeMetrics(mockMetrics))
    expect(screen.getByText('1 Active Incident')).toBeInTheDocument()
  })

  it('retries all dashboard reads and disables retry until they settle', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getServices).mockRejectedValueOnce(new Error('Offline'))
    render(<App />)
    const retry = await screen.findByRole('button', { name: 'Retry' })
    let completeMetrics!: (metrics: SystemMetrics) => void
    vi.mocked(api.getMetrics).mockReturnValueOnce(new Promise((resolve) => {
      completeMetrics = resolve
    }))

    await user.click(retry)
    expect(screen.getByRole('button', { name: 'Retrying...' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Retrying...' }))
    expect(api.getServices).toHaveBeenCalledTimes(2)
    expect(api.getIncidents).toHaveBeenCalledTimes(2)
    expect(api.getMetrics).toHaveBeenCalledTimes(2)

    await act(async () => completeMetrics(mockMetrics))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Auth API')).toBeInTheDocument()
    expect(screen.getByText('High Gateway Latency')).toBeInTheDocument()
    expect(screen.getByText('99.91%')).toBeInTheDocument()
  })

  it('allows another retry after repeated failures with non-Error rejections', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getServices).mockRejectedValueOnce(null).mockRejectedValueOnce('Offline')
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load dashboard data.')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Auth API')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps the last complete snapshot after a failed refresh and retries reads only', async () => {
    const user = userEvent.setup()
    const createdService = { ...mockServices[0], id: 3, name: 'Search API', slug: 'search-api' }
    vi.spyOn(api, 'createService').mockResolvedValue(createdService)
    render(<App />)
    await screen.findByText('Auth API')

    vi.mocked(api.getServices).mockResolvedValue([...mockServices, createdService])
    vi.mocked(api.getMetrics).mockRejectedValueOnce(new Error('Metrics unavailable'))
    await user.click(screen.getByRole('button', { name: '+ Register Service' }))
    await user.type(screen.getByLabelText('Service Name *'), 'Search API')
    await user.type(screen.getByLabelText('Service Responsibility & Overview *'), 'Search service')
    await user.click(screen.getByRole('button', { name: 'Register Service' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Showing the last successfully loaded data. It may be outdated.')
    expect(screen.getByText('System health may be outdated')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Auth API')).toBeInTheDocument()
    expect(screen.getByText('High Gateway Latency')).toBeInTheDocument()
    expect(screen.getByText('99.91%')).toBeInTheDocument()
    expect(screen.queryByText('Search API')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Search API')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(api.createService).toHaveBeenCalledTimes(1)
  })

  it('keeps the last known system status while a refresh is in flight', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'createService').mockResolvedValue({ ...mockServices[0], id: 3, name: 'Search API' })
    render(<App />)
    await screen.findByText('Auth API')

    let completeMetrics!: (metrics: SystemMetrics) => void
    vi.mocked(api.getMetrics).mockReturnValueOnce(new Promise((resolve) => {
      completeMetrics = resolve
    }))
    await user.click(screen.getByRole('button', { name: '+ Register Service' }))
    await user.type(screen.getByLabelText('Service Name *'), 'Search API')
    await user.type(screen.getByLabelText('Service Responsibility & Overview *'), 'Search service')
    await user.click(screen.getByRole('button', { name: 'Register Service' }))

    expect(api.getMetrics).toHaveBeenCalledTimes(2)
    expect(screen.getByText('1 Active Incident')).toBeInTheDocument()
    expect(screen.queryByText('Loading system health')).not.toBeInTheDocument()

    await act(async () => completeMetrics(mockMetrics))
    expect(screen.getByText('1 Active Incident')).toBeInTheDocument()
  })

  it('ignores a slow earlier load that fails after a newer load succeeded', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'createService').mockResolvedValue({ ...mockServices[0], id: 3, name: 'Search API' })
    let failFirstLoad!: (reason: Error) => void
    vi.mocked(api.getServices).mockReturnValueOnce(new Promise((_resolve, reject) => {
      failFirstLoad = reject
    }))
    render(<App />)

    await user.click(screen.getByRole('button', { name: '+ Register Service' }))
    await user.type(screen.getByLabelText('Service Name *'), 'Search API')
    await user.type(screen.getByLabelText('Service Responsibility & Overview *'), 'Search service')
    await user.click(screen.getByRole('button', { name: 'Register Service' }))
    expect(await screen.findByText('Auth API')).toBeInTheDocument()

    await act(async () => failFirstLoad(new Error('Timed out')))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('1 Active Incident')).toBeInTheDocument()
    expect(screen.getByText('High Gateway Latency')).toBeInTheDocument()
  })
})
