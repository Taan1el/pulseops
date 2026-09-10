import { useState } from 'react'
import type { CreateIncidentDto, IncidentSeverity, Service } from '../../../shared/types'

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

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !summary.trim() || !serviceId) {
      setError('Please fill out all required fields.')
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
      setError(err.message || 'Failed to create incident.')
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
            <span className="modal-eyebrow">Emergency Operations</span>
            <h2 id="modal-title">Declare Incident</h2>
          </div>
          <button
            aria-label="Close modal"
            className="close-btn"
            onClick={onClose}
            type="button"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="incident-title">Incident Title *</label>
            <input
              id="incident-title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elevated Database Connection Pool Saturation"
              required
              value={title}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="incident-service">Primary Affected Service *</label>
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
              <label htmlFor="incident-severity">Impact Severity *</label>
              <select
                id="incident-severity"
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                value={severity}
              >
                <option value="p1">P1 - Critical Outage (Sets Service Outage)</option>
                <option value="p2">P2 - Major Impairment (Sets Service Degraded)</option>
                <option value="p3">P3 - Minor Disruption (Degraded)</option>
                <option value="p4">P4 - Low / Informational</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="incident-summary">Initial Triage Summary *</label>
            <textarea
              id="incident-summary"
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe symptoms, impact on customers, and initial diagnostic findings..."
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
              {submitting ? 'Declaring...' : 'Declare & Notify Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
