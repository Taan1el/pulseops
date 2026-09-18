import { useState } from 'react'
import { TriangleAlert, X } from 'lucide-react'
import type { CreateIncidentDto, IncidentSeverity, Service } from '../../../shared/types'
import { useEscapeToClose } from '../hooks/useEscapeToClose'

interface CreateIncidentModalProps {
  services: Service[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateIncidentDto) => Promise<void>
}

export function CreateIncidentModal({
  services,
  isOpen,
  onClose,
  onSubmit,
}: CreateIncidentModalProps) {
  const [title, setTitle] = useState('')
  const [serviceId, setServiceId] = useState(services[0]?.id || 1)
  const [severity, setSeverity] = useState<IncidentSeverity>('p2')
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEscapeToClose(isOpen, onClose)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !summary.trim() || !serviceId) {
      setError('Fill out every required field.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onSubmit({
        title: title.trim(),
        serviceId: Number(serviceId),
        severity,
        summary: summary.trim(),
      })
      setTitle('')
      setSummary('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not declare the incident.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-labelledby="modal-title"
        aria-modal="true"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">Incident</span>
            <h2 id="modal-title">Declare incident</h2>
          </div>
          <button
            aria-label="Close modal"
            className="icon-btn"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} strokeWidth={1.75} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="alert-message">
              <TriangleAlert aria-hidden="true" size={16} strokeWidth={1.75} /> {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="incident-title">Incident title *</label>
            <input
              autoFocus
              id="incident-title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elevated database connection pool saturation"
              required
              value={title}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="incident-service">Affected service *</label>
              <select
                id="incident-service"
                onChange={(e) => setServiceId(Number(e.target.value))}
                value={serviceId}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.tier})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="incident-severity">Severity *</label>
              <select
                id="incident-severity"
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                value={severity}
              >
                <option value="p1">P1: critical outage, sets the service to outage</option>
                <option value="p2">P2: major impairment, sets the service to degraded</option>
                <option value="p3">P3: minor disruption, degrades an operational service</option>
                <option value="p4">P4: low impact, informational</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="incident-summary">Summary *</label>
            <textarea
              id="incident-summary"
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the symptoms, customer impact, and what you know so far."
              required
              rows={4}
              value={summary}
            />
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn btn-danger" disabled={submitting} type="submit">
              {submitting ? 'Declaring...' : 'Declare incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
