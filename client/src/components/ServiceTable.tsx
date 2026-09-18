import { useState } from 'react'
import type { Service } from '../../../shared/types'

interface ServiceGridProps {
  services: Service[]
  loading: boolean
}

export function ServiceGrid({ services, loading }: ServiceGridProps) {
  const [tierFilter, setTierFilter] = useState<'all' | 'critical' | 'standard' | 'internal'>('all')

  const filteredServices = services.filter((service) => {
    if (tierFilter !== 'all' && service.tier !== tierFilter) {
      return false
    }
    return true
  })

  return (
    <section aria-labelledby="services-heading" className="dashboard-section">
      <div className="section-header">
        <div>
          <span className="section-eyebrow">Topology</span>
          <h2 id="services-heading">Monitored Services</h2>
        </div>
        <div className="filter-group" role="group" aria-label="Filter services by tier">
          {(['all', 'critical', 'standard', 'internal'] as const).map((tier) => (
            <button
              aria-pressed={tierFilter === tier}
              className={`filter-btn ${tierFilter === tier ? 'active' : ''}`}
              key={tier}
              onClick={() => setTierFilter(tier)}
              type="button"
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="service-grid skeleton-container">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="service-card skeleton-card" key={i} />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="empty-state" role="status">
          <p>No services match the selected tier filter.</p>
        </div>
      ) : (
        <div className="service-grid">
          {filteredServices.map((service) => (
            <article
              aria-label={`${service.name}: ${service.status}`}
              className={`service-card status-border-${service.status}`}
              key={service.id}
            >
              <div className="service-header">
                <div>
                  <span className={`tier-badge tier-${service.tier}`}>
                    {service.tier.toUpperCase()}
                  </span>
                  <h3>{service.name}</h3>
                </div>
                <span className={`status-badge status-${service.status}`}>
                  <span className="status-indicator-dot" aria-hidden="true" />
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </span>
              </div>

              <p className="service-description">{service.description}</p>

              <div className="service-footer">
                <div className="service-metric">
                  <span className="label">Monthly SLA</span>
                  <span className="value">{service.uptimePercentage}%</span>
                </div>
                <div className="service-metric">
                  <span className="label">Last Synced</span>
                  <span className="value">{new Date(service.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
