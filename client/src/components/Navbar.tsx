interface NavbarProps {
  onOpenReportModal: () => void
  onOpenNewServiceModal: () => void
  activeIncidentsCount: number
}

export function Navbar({
  onOpenReportModal,
  onOpenNewServiceModal,
  activeIncidentsCount,
}: NavbarProps) {
  const isHealthy = activeIncidentsCount === 0

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
            className={`system-status-indicator ${isHealthy ? 'healthy' : 'impaired'}`}
          >
            <span className="pulse-dot" aria-hidden="true" />
            <span>
              {isHealthy
                ? 'All Systems Operational'
                : `${activeIncidentsCount} Active ${activeIncidentsCount === 1 ? 'Incident' : 'Incidents'}`}
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
