import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from './App'
import { api } from './services/api'
import { readFileSync } from 'node:fs'
import type { Incident, Service, SystemMetrics } from '../../shared/types'

const now = new Date().toISOString()
const services: Service[] = [
  { id: 1, name: 'Auth API', slug: 'auth-api', description: 'Sign-in', status: 'operational', tier: 'critical', uptimePercentage: 99.9, updatedAt: now },
]
const incidents: Incident[] = [
  {
    id: 101, title: 'High Gateway Latency', status: 'investigating', severity: 'p2', serviceId: 1,
    serviceName: 'Auth API', summary: 'Slow checkout.', createdAt: now, resolvedAt: null, updates: [],
  },
]
const metrics: SystemMetrics = {
  overallUptime: 99.9, totalServices: 1, operationalCount: 1, degradedCount: 0,
  outageCount: 0, activeIncidentCount: 1, resolvedIncidentCount: 0,
}

const appCss = readFileSync('src/App.css', 'utf8')

// Selectors in the stylesheet that declare scrolling (auto or scroll) on any axis.
const scrollSelectors = [...appCss.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .filter(([, , body]) => /overflow(-x|-y)?\s*:\s*(auto|scroll)/.test(body))
  .map(([, selector]) => selector.trim())
  .filter((s) => /^[.#\w][\w\s.#>-]*$/.test(s))

function scrollContainers(root: HTMLElement) {
  return scrollSelectors.flatMap((s) => Array.from(root.querySelectorAll<HTMLElement>(s)))
}

function expectReachable(el: HTMLElement) {
  if (el.getAttribute('role') === 'dialog') {
    // A scrolling dialog is reached through its own focusable controls; it must be named.
    expect(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')).toBeTruthy()
    return
  }
  expect(el).toHaveAttribute('role', 'region')
  expect(el).toHaveAttribute('tabindex', '0')
  expect(el.getAttribute('aria-label')?.trim()).toBeTruthy()
}

describe('Scrollable regions', () => {
  beforeEach(() => {
    vi.spyOn(api, 'getServices').mockResolvedValue(services)
    vi.spyOn(api, 'getIncidents').mockResolvedValue(incidents)
    vi.spyOn(api, 'getMetrics').mockResolvedValue(metrics)
  })
  afterEach(() => vi.restoreAllMocks())

  it('finds the scrolling selectors in the stylesheet', () => {
    expect(scrollSelectors.length).toBeGreaterThan(0)
  })

  it('status page scroll containers are keyboard reachable and named', async () => {
    const { container } = render(<App />)
    await waitFor(() => expect(screen.getByText('High Gateway Latency')).toBeInTheDocument())
    scrollContainers(container).forEach(expectReachable)
  })

  it.each(['Declare incident', 'Register service'])('%s dialog scroll containers are named', async (name) => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => expect(screen.getByText('High Gateway Latency')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name }))
    const found = scrollContainers(document.body)
    expect(found.length).toBeGreaterThan(0)
    found.forEach(expectReachable)
  })
})
