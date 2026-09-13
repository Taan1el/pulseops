// Pure domain logic shared between the Express API and the browser-only
// demo build. Nothing here touches a database or the network, so the same
// functions produce the same results on the server and in demo mode.

import type { IncidentSeverity, Service, ServiceStatus, SystemMetrics } from './types.js'

/**
 * Turns a service name into a URL-friendly slug, for example
 * "Auth & Identity API" becomes "auth-identity-api".
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Decides how a new incident should affect its service's status.
 * Returns null when the service status should not change.
 *
 * - A P1 incident always forces an outage.
 * - A P2 incident degrades the service, unless it is already down.
 * - A P3 incident only degrades a fully operational service.
 * - A P4 incident never changes service status.
 */
export function nextServiceStatusForSeverity(
  currentStatus: ServiceStatus,
  severity: IncidentSeverity,
): ServiceStatus | null {
  if (severity === 'p1') {
    return 'outage'
  }
  if (severity === 'p2') {
    return currentStatus !== 'outage' ? 'degraded' : null
  }
  if (severity === 'p3') {
    return currentStatus === 'operational' ? 'degraded' : null
  }
  return null
}

/**
 * Aggregates the service list and incident counts into the dashboard's
 * system-wide metrics. Uptime is the mean of each service's own
 * uptimePercentage, rounded to two decimal places.
 */
export function computeSystemMetrics(
  services: Service[],
  activeIncidentCount: number,
  resolvedIncidentCount: number,
): SystemMetrics {
  const totalServices = services.length
  const operationalCount = services.filter((s) => s.status === 'operational').length
  const degradedCount = services.filter((s) => s.status === 'degraded').length
  const outageCount = services.filter((s) => s.status === 'outage').length

  const overallUptime =
    totalServices > 0
      ? Number(
          (services.reduce((acc, s) => acc + s.uptimePercentage, 0) / totalServices).toFixed(2),
        )
      : 100

  return {
    overallUptime,
    totalServices,
    operationalCount,
    degradedCount,
    outageCount,
    activeIncidentCount,
    resolvedIncidentCount,
  }
}
