import type { SystemMetrics } from '../../../shared/types'

interface MetricsCardsProps {
  metrics: SystemMetrics | null
  loading: boolean
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  if (loading || !metrics) {
    return (
      <section aria-label="System Metrics" className="metrics-grid skeleton-container">
        {[1, 2, 3, 4].map((i) => (
          <div className="metric-card skeleton-card" key={i} />
        ))}
      </section>
    )
  }

  return (
    <section aria-label="System Metrics" className="metrics-grid">
      <article className="metric-card">
        <span className="metric-label">System SLA (30d)</span>
        <div className="metric-value-row">
          <span className="metric-value">{metrics.overallUptime}%</span>
          <span className="metric-pill success">High SLA</span>
        </div>
        <p className="metric-sub">Average across {metrics.totalServices} registered services</p>
      </article>

      <article className="metric-card">
        <span className="metric-label">Service Health</span>
        <div className="metric-value-row">
          <span className="metric-value">
            {metrics.operationalCount} / {metrics.totalServices}
          </span>
          <span
            className={`metric-pill ${
              metrics.operationalCount === metrics.totalServices ? 'success' : 'warning'
            }`}
          >
            {metrics.operationalCount === metrics.totalServices ? '100% Online' : 'Degraded'}
          </span>
        </div>
        <p className="metric-sub">
          {metrics.degradedCount} degraded, {metrics.outageCount} outage
        </p>
      </article>

      <article className="metric-card">
        <span className="metric-label">Active Incidents</span>
        <div className="metric-value-row">
          <span className="metric-value">{metrics.activeIncidentCount}</span>
          <span
            className={`metric-pill ${
              metrics.activeIncidentCount === 0 ? 'success' : 'danger'
            }`}
          >
            {metrics.activeIncidentCount === 0 ? 'Clear' : 'Action Required'}
          </span>
        </div>
        <p className="metric-sub">P1-P4 incidents currently in investigation</p>
      </article>

      <article className="metric-card">
        <span className="metric-label">Resolved (30d)</span>
        <div className="metric-value-row">
          <span className="metric-value">{metrics.resolvedIncidentCount}</span>
          <span className="metric-pill neutral">Historical</span>
        </div>
        <p className="metric-sub">Successfully remediated with post-mortems</p>
      </article>
    </section>
  )
}
