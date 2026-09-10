import { useState } from 'react'
import type { AddIncidentUpdateDto, Incident, IncidentStatus } from '../../../shared/types'

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

  if (!isOpen || !incident) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please provide a message describing the update.')
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
      setError(err.message || 'Failed to post update.')
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
            <span className="modal-eyebrow">Incident Timeline</span>
            <h2 id="update-modal-title">Post Timeline Update</h2>
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

        <p className="modal-subtitle">
          Incident: <strong>{incident.title}</strong>
        </p>

        {error && (
          <div className="alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="update-status">Lifecycle State *</label>
            <select
              id="update-status"
              onChange={(e) => setStatus(e.target.value as IncidentStatus)}
              value={status}
            >
              <option value="investigating">Investigating - Actively searching for root cause</option>
              <option value="identified">Identified - Cause found, fix in progress</option>
              <option value="monitoring">Monitoring - Fix deployed, verifying telemetry</option>
              <option value="resolved">Resolved - Issue fully remediated (Restores Service Health)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="update-message">Public Investigation Note *</label>
            <textarea
              id="update-message"
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Traffic failed over to secondary cluster. Error rates dropped to normal levels..."
              required
              rows={4}
              value={message}
            />
          </div>

          {status === 'resolved' && (
            <div className="alert-info">
              Selecting <strong>Resolved</strong> will mark this incident as complete and automatically restore affected service health back to Operational.
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className={`btn ${status === 'resolved' ? 'btn-success' : 'btn-primary'}`}
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Posting...' : status === 'resolved' ? 'Resolve Incident' : 'Post Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
