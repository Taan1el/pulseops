import type { SystemMetrics } from '../../../shared/types'
import { pluralize } from '../utils/pluralize'

interface MastheadProps {
  onOpenReportModal: () => void
  onOpenNewServiceModal: () => void
  activeIncidentsCount: number
  dataStatus: 'loading' | 'unavailable' | 'stale' | 'ready'
  metrics: SystemMetrics | null
}

export function Masthead({
  onOpenReportModal,
  onOpenNewServiceModal,
  activeIncidentsCount,
  dataStatus,
  metrics,
}: MastheadProps) {
  const isHealthy = activeIncidentsCount === 0
  const statusLabel =
    dataStatus === 'loading'
      ? 'Loading system health'
      : dataStatus === 'unavailable'
        ? 'System health unavailable'
        : dataStatus === 'stale'
          ? 'System health may be outdated'
          : isHealthy
            ? 'All systems operational'
            : `${activeIncidentsCount} active ${pluralize(activeIncidentsCount, 'incident')}`
  const tone = dataStatus !== 'ready' ? 'unknown' : isHealthy ? 'ok' : 'bad'

  return (
    <header className="masthead">
      <div className="masthead-bar">
        <p className="wordmark">PulseOps</p>
        <div className="masthead-actions">
          <button className="btn btn-secondary" onClick={onOpenNewServiceModal} type="button">
            Register service
          </button>
          <button className="btn btn-primary" onClick={onOpenReportModal} type="button">
            Declare incident
          </button>
        </div>
      </div>

      <h1 aria-live="polite" className={`status-sentence tone-${tone}`}>
        {statusLabel}
      </h1>

      {metrics && (
        <dl aria-label="System metrics" className="dateline">
          <div>
            <dt>SLA, 30 days</dt>
            <dd>{metrics.overallUptime}%</dd>
          </div>
          <div>
            <dt>Services healthy</dt>
            <dd>
              {metrics.operationalCount} / {metrics.totalServices}
            </dd>
          </div>
          <div>
            <dt>Degraded</dt>
            <dd>{metrics.degradedCount}</dd>
          </div>
          <div>
            <dt>{pluralize(metrics.outageCount, 'Outage')}</dt>
            <dd>{metrics.outageCount}</dd>
          </div>
          <div>
            <dt>Resolved, 30 days</dt>
            <dd>{metrics.resolvedIncidentCount}</dd>
          </div>
        </dl>
      )}
    </header>
  )
}
