import type { SystemMetrics } from '../../../shared/types'
import { pluralize } from '../utils/pluralize'

interface StatsStripProps {
  metrics: SystemMetrics | null
  loading: boolean
}

export function StatsStrip({ metrics, loading }: StatsStripProps) {
  if (loading || !metrics) {
    return (
      <section aria-label="System metrics" className="stats-strip skeleton skeleton-stats" />
    )
  }

  return (
    <section aria-label="System metrics" className="stats-strip">
      <div className="stat-cell">
        <span className="stat-label">SLA (30d)</span>
        <span className="stat-value">{metrics.overallUptime}%</span>
        <div
          aria-label="SLA over 30 days"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={metrics.overallUptime}
          className="stat-meter"
          role="meter"
        >
          <div className="stat-meter-fill" style={{ width: `${metrics.overallUptime}%` }} />
        </div>
      </div>

      <div className="stat-cell">
        <span className="stat-label">Services healthy</span>
        <span className="stat-value">
          {metrics.operationalCount} / {metrics.totalServices}
        </span>
        <span className="stat-note">
          {metrics.degradedCount} degraded, {metrics.outageCount} {pluralize(metrics.outageCount, 'outage')}
        </span>
      </div>

      <div className="stat-cell">
        <span className="stat-label">Open incidents</span>
        <span className="stat-value">{metrics.activeIncidentCount}</span>
        <span className="stat-note">P1 to P4, currently under investigation</span>
      </div>

      <div className="stat-cell">
        <span className="stat-label">Resolved (30d)</span>
        <span className="stat-value">{metrics.resolvedIncidentCount}</span>
        <span className="stat-note">Closed with a timeline note</span>
      </div>
    </section>
  )
}
