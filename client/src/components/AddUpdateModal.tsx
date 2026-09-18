import { useState } from 'react'
import { TriangleAlert, X } from 'lucide-react'
import type { AddIncidentUpdateDto, Incident, IncidentStatus } from '../../../shared/types'
import { useEscapeToClose } from '../hooks/useEscapeToClose'

interface AddUpdateModalProps {
  incident: Incident | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (incidentId: number, dto: AddIncidentUpdateDto) => Promise<void>
}

export function AddUpdateModal({
  incident,
  isOpen,
  onClose,
  onSubmit,
}: AddUpdateModalProps) {
  const [status, setStatus] = useState<IncidentStatus>(incident?.status ?? 'identified')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEscapeToClose(isOpen, onClose)

  if (!isOpen || !incident) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('Describe the update before posting it.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onSubmit(incident.id, {
        status,
        message: message.trim(),
      })
      setMessage('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not post the update.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-labelledby="update-modal-title"
        aria-modal="true"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">Timeline</span>
            <h2 id="update-modal-title">Post update</h2>
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

        <p className="modal-subtitle">
          Incident: <strong>{incident.title}</strong>
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="alert-message">
              <TriangleAlert aria-hidden="true" size={16} strokeWidth={1.75} /> {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="update-status">Status *</label>
            <select
              autoFocus
              id="update-status"
              onChange={(e) => setStatus(e.target.value as IncidentStatus)}
              value={status}
            >
              <option value="investigating">Investigating: searching for the root cause</option>
              <option value="identified">Identified: cause found, fix in progress</option>
              <option value="monitoring">Monitoring: fix deployed, watching telemetry</option>
              <option value="resolved">Resolved: fully remediated, restores service health</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="update-message">Update *</label>
            <textarea
              id="update-message"
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Traffic failed over to the secondary cluster. Error rates are back to normal."
              required
              rows={4}
              value={message}
            />
          </div>

          {status === 'resolved' && (
            <div className="alert alert-info">
              Resolving marks this incident complete and restores the affected service to operational.
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className={`btn ${status === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Posting...' : status === 'resolved' ? 'Resolve incident' : 'Post update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
