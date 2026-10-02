import { useState } from 'react'
import { formatCount } from '../utils/pluralize'
import type { Incident, IncidentSeverity, IncidentStatus, IncidentUpdate } from '../../../shared/types'

interface IncidentFeedProps {
  incidents: Incident[]
  loading: boolean
  onOpenAddUpdate: (incident: Incident) => void
}

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  p1: 'P1 Critical outage',
  p2: 'P2 Major impairment',
  p3: 'P3 Minor disruption',
  p4: 'P4 Low impact',
}

const STATUS_STEPS: IncidentStatus[] = ['investigating', 'identified', 'monitoring', 'resolved']
const STATUS_LABEL: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
}

const STATUS_TABS = ['all', 'active', 'resolved'] as const
type StatusTab = (typeof STATUS_TABS)[number]

const SEVERITY_FILTERS = ['all', 'p1', 'p2', 'p3', 'p4'] as const
type SeverityFilter = (typeof SEVERITY_FILTERS)[number]

export function IncidentFeed({ incidents, loading, onOpenAddUpdate }: IncidentFeedProps) {
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')

  const filteredIncidents = incidents.filter((incident) => {
    if (statusTab === 'active' && incident.status === 'resolved') return false
    if (statusTab === 'resolved' && incident.status !== 'resolved') return false
    if (severityFilter !== 'all' && incident.severity !== severityFilter) return false
    return true
  })

  return (
    <section aria-labelledby="incidents-heading" className="timeline-region">
      <div className="timeline-head">
        <div>
          <h2 className="timeline-heading" id="incidents-heading">
            Incident timeline
          </h2>
          <p className="timeline-sub">{formatCount(filteredIncidents.length, 'incident')}, newest first.</p>
        </div>

        <div className="filter-row">
          <div className="segmented" role="group" aria-label="Filter incidents by status">
            {STATUS_TABS.map((tab) => (
              <button
                aria-pressed={statusTab === tab}
                className={`segmented-btn ${statusTab === tab ? 'active' : ''}`}
                key={tab}
                onClick={() => setStatusTab(tab)}
                type="button"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="segmented" role="group" aria-label="Filter incidents by severity">
            {SEVERITY_FILTERS.map((severity) => (
              <button
                aria-pressed={severityFilter === severity}
                className={`segmented-btn ${severityFilter === severity ? 'active' : ''}`}
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                type="button"
              >
                {severity === 'all' ? 'All' : severity.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton skeleton-block" />
      ) : filteredIncidents.length === 0 ? (
        <div className="empty-state" role="status">
          No incidents match these filters.
        </div>
      ) : (
        <ol aria-label="Incident timeline" className="incident-timeline">
          {filteredIncidents.map((incident) => {
            const isResolved = incident.status === 'resolved'
            const currentStepIndex = STATUS_STEPS.indexOf(incident.status)

            return (
              <li
                aria-label={`Incident: ${incident.title}`}
                className={`incident-entry ${isResolved ? 'is-resolved' : 'is-active'}`}
                key={incident.id}
              >
                <time className="incident-when" dateTime={incident.createdAt}>
                  {new Date(incident.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  {' '}
                  {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>

                <div className="incident-entry-header">
                  <span className={`severity-badge severity-${incident.severity}`}>
                    {SEVERITY_LABEL[incident.severity]}
                  </span>
                  {incident.serviceName && (
                    <span className="incident-service">{incident.serviceName}</span>
                  )}
                </div>

                <h3 className="incident-title">{incident.title}</h3>
                <p className="incident-summary">{incident.summary}</p>

                <div aria-label="Incident progress" className="status-steps">
                  {STATUS_STEPS.map((step, idx) => (
                    <span
                      className={`step ${idx <= currentStepIndex ? 'is-done' : ''} ${
                        step === incident.status ? 'is-current' : ''
                      }`}
                      key={step}
                    >
                      {STATUS_LABEL[step]}
                    </span>
                  ))}
                </div>

                {incident.updates && incident.updates.length > 0 && (
                  <ul className="incident-updates">
                    {incident.updates.map((update: IncidentUpdate) => (
                      <li className="incident-update" key={update.id}>
                        <span className="update-time">
                          {new Date(update.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="update-status">{STATUS_LABEL[update.status]}</span>
                        <span className="update-message">{update.message}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button className="btn btn-sm btn-secondary" onClick={() => onOpenAddUpdate(incident)} type="button">
                  {isResolved ? 'Add note' : 'Update status'}
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
