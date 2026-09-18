interface HeaderProps {
  onOpenReportModal: () => void
  onOpenNewServiceModal: () => void
  activeIncidentsCount: number
  dataStatus: 'loading' | 'unavailable' | 'stale' | 'ready'
}

export function Header({
  onOpenReportModal,
  onOpenNewServiceModal,
  activeIncidentsCount,
  dataStatus,
}: HeaderProps) {
  const isHealthy = activeIncidentsCount === 0
  const statusDotClass = dataStatus !== 'ready' ? 'unknown' : isHealthy ? 'ok' : 'bad'
  const statusLabel =
    dataStatus === 'loading'
      ? 'Loading system health'
      : dataStatus === 'unavailable'
        ? 'System health unavailable'
        : dataStatus === 'stale'
          ? 'System health may be outdated'
          : isHealthy
            ? 'All systems operational'
            : `${activeIncidentsCount} active ${activeIncidentsCount === 1 ? 'incident' : 'incidents'}`

  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div>
          <h1 className="brand-name">PulseOps</h1>
          <p className="brand-subtitle">
            Track service health, declare incidents, and follow their timelines from one dashboard.
          </p>
          <div className="header-meta">
            <span aria-live="polite" className="badge">
              <span aria-hidden="true" className={`status-dot ${statusDotClass}`} />
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onOpenNewServiceModal} type="button">
            Register service
          </button>

          <button className="btn btn-primary" onClick={onOpenReportModal} type="button">
            Declare incident
          </button>
        </div>
      </div>
    </header>
  )
}
