import { useState } from 'react'
import type { Service, ServiceStatus } from '../../../shared/types'
import { formatCount } from '../utils/pluralize'

interface ServiceListProps {
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

export function ServiceList({ services, loading }: ServiceListProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')

  const filteredServices = services.filter(
    (service) => tierFilter === 'all' || service.tier === tierFilter,
  )

  return (
    <section aria-labelledby="services-heading" className="service-rail">
      <h2 className="rail-heading" id="services-heading">
        Services
      </h2>
      <p className="rail-count">
        {loading ? 'Loading services' : formatCount(filteredServices.length, 'service')}
      </p>

      <div className="field">
        <label htmlFor="tier-filter">Tier</label>
        <select
          id="tier-filter"
          onChange={(event) => setTierFilter(event.target.value as TierFilter)}
          value={tierFilter}
        >
          {TIER_FILTERS.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="skeleton skeleton-rail" />
      ) : filteredServices.length === 0 ? (
        <div className="empty-state" role="status">
          No services match this tier.
        </div>
      ) : (
        <ul aria-label="Services" className="service-list">
          {filteredServices.map((service) => (
            <li
              aria-label={`${service.name}: ${service.status}`}
              className="service-item"
              key={service.id}
            >
              <div className="service-line">
                <span aria-hidden="true" className={`status-dot ${STATUS_DOT[service.status]}`} />
                <span className="service-name">{service.name}</span>
                <span className="service-uptime">{service.uptimePercentage}%</span>
              </div>
              <div className="service-sub">
                <span className={`status-text status-${service.status}`}>
                  {STATUS_LABEL[service.status]}
                </span>
                <span className="service-tier">{service.tier}</span>
              </div>
              <div aria-hidden="true" className="meter">
                <div
                  className={`meter-fill ${STATUS_DOT[service.status]}`}
                  style={{ width: `${service.uptimePercentage}%` }}
                />
              </div>
              <p className="service-description">{service.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
