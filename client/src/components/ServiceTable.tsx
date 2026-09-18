import { useState } from 'react'
import type { Service, ServiceStatus } from '../../../shared/types'

interface ServiceTableProps {
  services: Service[]
  loading: boolean
}

const TIER_FILTERS = ['all', 'critical', 'standard', 'internal'] as const
type TierFilter = (typeof TIER_FILTERS)[number]

const STATUS_LABEL: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
  maintenance: 'Maintenance',
}

const STATUS_DOT: Record<ServiceStatus, 'ok' | 'warn' | 'bad' | 'unknown'> = {
  operational: 'ok',
  degraded: 'warn',
  outage: 'bad',
  maintenance: 'unknown',
}

export function ServiceTable({ services, loading }: ServiceTableProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')

  const filteredServices = services.filter(
    (service) => tierFilter === 'all' || service.tier === tierFilter,
  )

  return (
    <section aria-labelledby="services-heading">
      <div className="section-header">
        <div>
          <h2 className="section-heading" id="services-heading">
            Services
          </h2>
          <p className="section-description">Every registered service and its current status.</p>
        </div>
        <div className="segmented" role="group" aria-label="Filter services by tier">
          {TIER_FILTERS.map((tier) => (
            <button
              aria-pressed={tierFilter === tier}
              className={`segmented-btn ${tierFilter === tier ? 'active' : ''}`}
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
        <div className="skeleton skeleton-block" />
      ) : filteredServices.length === 0 ? (
        <div className="empty-state" role="status">
          No services match this tier.
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="services-table">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Status</th>
                <th scope="col">Tier</th>
                <th scope="col">SLA (30d)</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr aria-label={`${service.name}: ${service.status}`} key={service.id}>
                  <td>
                    <div className="service-name">{service.name}</div>
                    <div className="service-description">{service.description}</div>
                  </td>
                  <td>
                    <span className={`status-text status-${service.status}`}>
                      <span aria-hidden="true" className={`status-dot ${STATUS_DOT[service.status]}`} />
                      {STATUS_LABEL[service.status]}
                    </span>
                  </td>
                  <td>
                    <span className="tier-badge">{service.tier}</span>
                  </td>
                  <td className="mono-cell">{service.uptimePercentage}%</td>
                  <td className="mono-cell">
                    {new Date(service.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
