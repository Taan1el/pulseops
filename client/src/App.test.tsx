import { act, render, screen, waitFor, within } from '@testing-library/react'
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

    expect(screen.getAllByText('PulseOps').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Loading system health')

    await waitFor(() => {
      expect(screen.getByText('99.91%')).toBeInTheDocument()
      expect(screen.getByText('1 / 2')).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('1 active incident')
  })

  it('lists services with their statuses in the sidebar', async () => {
    render(<App />)

    await waitFor(() => {
      const list = screen.getByRole('list', { name: 'Services' })
      expect(within(list).getByText('Auth API')).toBeInTheDocument()
      expect(within(list).getByText('Payment Gateway')).toBeInTheDocument()
      expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    })

    await userEvent.setup().selectOptions(screen.getByLabelText('Tier'), 'internal')
    await waitFor(() => {
      expect(screen.getByText('No services match this tier.')).toBeInTheDocument()
    })
  })

  it('renders incident feed and severity badges', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('High Gateway Latency')).toBeInTheDocument()
      expect(screen.getByText('P2 Major impairment')).toBeInTheDocument()
    })
  })

  it('opens and closes the Declare incident modal', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Auth API')).toBeInTheDocument()
    })

    const reportButton = screen.getByRole('button', { name: 'Declare incident' })
    await user.click(reportButton)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Declare incident' })).toBeInTheDocument()
    expect(screen.getByLabelText('Incident title *')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Close modal' })
    await user.click(closeBtn)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens and closes the Register service modal', async () => {
    const user = userEvent.setup()
    render(<App />)

    const registerBtn = screen.getByRole('button', { name: 'Register service' })
    await user.click(registerBtn)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Register service' })).toBeInTheDocument()
    expect(screen.getByLabelText('Service name *')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Close modal' })
    await user.click(closeBtn)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes an open modal when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Declare incident' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('focuses the first field when the Register service modal opens', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Register service' }))

    expect(screen.getByLabelText('Service name *')).toHaveFocus()
  })

  it('hides the demo mode banner by default', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Auth API')).toBeInTheDocument())

    expect(screen.queryByText(/Demo: everything runs in your browser/)).not.toBeInTheDocument()
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

      const demoBar = screen.getByRole('status')
      expect(within(demoBar).getByText(/Demo: everything runs in your browser/)).toBeInTheDocument()
      expect(within(demoBar).getByRole('link', { name: 'Source on GitHub' })).toHaveAttribute(
        'href',
        'https://github.com/Taan1el/pulseops',
      )

      await user.click(screen.getByRole('button', { name: 'Reset sample data' }))
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
      expect(screen.queryByText('All systems operational')).not.toBeInTheDocument()
      expect(screen.queryByText('No services match this tier.')).not.toBeInTheDocument()
      expect(screen.queryByText('No incidents match these filters.')).not.toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'System metrics' })).not.toBeInTheDocument()

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
    expect(screen.queryByText('All systems operational')).not.toBeInTheDocument()

    await act(async () => completeMetrics(mockMetrics))
    expect(screen.getByText('1 active incident')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: 'Register service' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Service name *'), 'Search API')
    await user.type(within(dialog).getByLabelText('Description *'), 'Search service')
    await user.click(within(dialog).getByRole('button', { name: 'Register service' }))

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
    await user.click(screen.getByRole('button', { name: 'Register service' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Service name *'), 'Search API')
    await user.type(within(dialog).getByLabelText('Description *'), 'Search service')
    await user.click(within(dialog).getByRole('button', { name: 'Register service' }))

    expect(api.getMetrics).toHaveBeenCalledTimes(2)
    expect(screen.getByText('1 active incident')).toBeInTheDocument()
    expect(screen.queryByText('Loading system health')).not.toBeInTheDocument()

    await act(async () => completeMetrics(mockMetrics))
    expect(screen.getByText('1 active incident')).toBeInTheDocument()
  })

  it('ignores a slow earlier load that fails after a newer load succeeded', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'createService').mockResolvedValue({ ...mockServices[0], id: 3, name: 'Search API' })
    let failFirstLoad!: (reason: Error) => void
    vi.mocked(api.getServices).mockReturnValueOnce(new Promise((_resolve, reject) => {
      failFirstLoad = reject
    }))
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Register service' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Service name *'), 'Search API')
    await user.type(within(dialog).getByLabelText('Description *'), 'Search service')
    await user.click(within(dialog).getByRole('button', { name: 'Register service' }))
    expect(await screen.findByText('Auth API')).toBeInTheDocument()

    await act(async () => failFirstLoad(new Error('Timed out')))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('1 active incident')).toBeInTheDocument()
    expect(screen.getByText('High Gateway Latency')).toBeInTheDocument()
  })

  it('opens the update modal from the incident timeline and posts an update', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'addIncidentUpdate').mockResolvedValue({
      incident: { ...mockIncidents[0], status: 'identified' },
      update: {
        id: 2,
        incidentId: 101,
        status: 'identified',
        message: 'Root cause found.',
        createdAt: new Date().toISOString(),
      },
    })
    render(<App />)
    await screen.findByText('High Gateway Latency')

    await user.click(screen.getByRole('button', { name: 'Update status' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Post update' })).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Update *'), 'Root cause found.')
    await user.click(within(dialog).getByRole('button', { name: 'Post update' }))

    expect(api.addIncidentUpdate).toHaveBeenCalledWith(101, {
      status: 'identified',
      message: 'Root cause found.',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
