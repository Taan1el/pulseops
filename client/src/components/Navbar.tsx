interface NavbarProps {
  onOpenReportModal: () => void
  onOpenNewServiceModal: () => void
  activeIncidentsCount: number
  dataStatus: 'loading' | 'unavailable' | 'stale' | 'ready'
}

export function Navbar({
  onOpenReportModal,
  onOpenNewServiceModal,
  activeIncidentsCount,
  dataStatus,
}: NavbarProps) {
  const isHealthy = activeIncidentsCount === 0
  const statusLabel = dataStatus === 'loading'
    ? 'Loading system health'
    : dataStatus === 'unavailable'
      ? 'System health unavailable'
      : dataStatus === 'stale'
        ? 'System health may be outdated'
        : isHealthy
          ? 'All Systems Operational'
          : `${activeIncidentsCount} Active ${activeIncidentsCount === 1 ? 'Incident' : 'Incidents'}`

  return (
    <header className="navbar" role="banner">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-badge">PULSE</div>
          <div>
            <h1>PulseOps</h1>
            <p className="brand-tagline">Incident & Service Health Platform</p>
          </div>
        </div>

        <div className="navbar-actions">
          <div
            aria-live="polite"
            className={`system-status-indicator ${dataStatus !== 'ready' ? 'unknown' : isHealthy ? 'healthy' : 'impaired'}`}
          >
            <span className="pulse-dot" aria-hidden="true" />
            <span>
              {statusLabel}
            </span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={onOpenNewServiceModal}
            type="button"
          >
            + Register Service
          </button>

          <button
            className="btn btn-primary"
            onClick={onOpenReportModal}
            type="button"
          >
            Report Incident
          </button>
        </div>
      </div>
    </header>
  )
}
