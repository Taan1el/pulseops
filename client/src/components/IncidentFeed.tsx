import { useState } from 'react'
import type { Incident, IncidentSeverity, IncidentStatus, IncidentUpdate } from '../../../shared/types'

interface IncidentFeedProps {
  incidents: Incident[]
  loading: boolean
  onOpenAddUpdate: (incident: Incident) => void
}

const SEVERITY_CONFIG: Record<IncidentSeverity, { label: string; class: string }> = {
  p1: { label: 'P1 - Critical Outage', class: 'severity-p1' },
  p2: { label: 'P2 - Major Impairment', class: 'severity-p2' },
  p3: { label: 'P3 - Minor Disruption', class: 'severity-p3' },
  p4: { label: 'P4 - Low / Informational', class: 'severity-p4' },
}

const STATUS_STEPS: IncidentStatus[] = ['investigating', 'identified', 'monitoring', 'resolved']

export function IncidentFeed({ incidents, loading, onOpenAddUpdate }: IncidentFeedProps) {
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all')

  const filteredIncidents = incidents.filter((incident) => {
    if (statusTab === 'active' && incident.status === 'resolved') return false
    if (statusTab === 'resolved' && incident.status !== 'resolved') return false
    if (severityFilter !== 'all' && incident.severity !== severityFilter) return false
    return true
  })

  return (
    <section aria-labelledby="incidents-heading" className="dashboard-section">
      <div className="section-header">
        <div>
          <span className="section-eyebrow">Operations</span>
          <h2 id="incidents-heading">Incident Feed & Timeline</h2>
        </div>

        <div className="filter-controls">
          <div className="tabs" role="tablist" aria-label="Incident status view">
            {(['all', 'active', 'resolved'] as const).map((tab) => (
              <button
                aria-selected={statusTab === tab}
                className={`tab-btn ${statusTab === tab ? 'active' : ''}`}
                key={tab}
                onClick={() => setStatusTab(tab)}
                role="tab"
                type="button"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="severity-select-wrapper">
            <label htmlFor="severity-filter" className="sr-only">
              Filter by Severity
            </label>
            <select
              id="severity-filter"
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              value={severityFilter}
            >
              <option value="all">All Severities</option>
              <option value="p1">P1 - Critical</option>
              <option value="p2">P2 - Major</option>
              <option value="p3">P3 - Minor</option>
              <option value="p4">P4 - Low</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="incident-list skeleton-container">
          {[1, 2, 3].map((i) => (
            <div className="incident-card skeleton-card" key={i} />
          ))}
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="empty-state" role="status">
          <p>No incidents found matching the active criteria.</p>
        </div>
      ) : (
        <div className="incident-list" role="feed" aria-label="Incident updates feed">
          {filteredIncidents.map((incident) => {
            const severityInfo = SEVERITY_CONFIG[incident.severity]
            const isResolved = incident.status === 'resolved'

            return (
              <article
                aria-label={`Incident: ${incident.title}`}
                className={`incident-card ${isResolved ? 'resolved-card' : 'active-card'}`}
                key={incident.id}
              >
                <div className="incident-card-header">
                  <div className="incident-badges">
                    <span className={`severity-badge ${severityInfo.class}`}>
                      {severityInfo.label}
                    </span>
                    {incident.serviceName && (
                      <span className="affected-service-badge">
                        Service: {incident.serviceName}
                      </span>
                    )}
                    <span className={`incident-status-pill status-${incident.status}`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </div>

                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onOpenAddUpdate(incident)}
                    type="button"
                  >
                    {isResolved ? 'Add Note' : '+ Post Update / Resolve'}
                  </button>
                </div>

                <h3 className="incident-title">{incident.title}</h3>
                <p className="incident-summary">{incident.summary}</p>

                {/* Status Stepper */}
                <div className="status-stepper" aria-label="Incident progression steps">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = STATUS_STEPS.indexOf(incident.status)
                    const isPassed = currentIdx >= idx
                    const isCurrent = incident.status === step

                    return (
                      <div
                        className={`step-item ${isPassed ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                        key={step}
                      >
                        <span className="step-dot" />
                        <span className="step-label">
                          {step.charAt(0).toUpperCase() + step.slice(1)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Timeline Updates */}
                {incident.updates && incident.updates.length > 0 && (
                  <div className="incident-timeline">
                    <h4 className="timeline-heading">Timeline Log</h4>
                    <ul className="timeline-list">
                      {incident.updates.map((update: IncidentUpdate) => (
                        <li className="timeline-item" key={update.id}>
                          <div className="timeline-time">
                            {new Date(update.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="timeline-content">
                            <span className={`timeline-status-tag status-${update.status}`}>
                              {update.status}
                            </span>
                            <p className="timeline-message">{update.message}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
