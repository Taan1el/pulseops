import { useState } from 'react'
import type { CreateServiceDto, ServiceTier } from '../../../shared/types'

interface NewServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateServiceDto) => Promise<void>
}

export function NewServiceModal({ isOpen, onClose, onSubmit }: NewServiceModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tier, setTier] = useState<ServiceTier>('standard')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !description.trim()) {
      setError('Please provide a name and description.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        tier,
      })
      setName('')
      setDescription('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to register service.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-labelledby="service-modal-title"
        aria-modal="true"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">Service Catalog</span>
            <h2 id="service-modal-title">Register Service</h2>
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
            <label htmlFor="service-name">Service Name *</label>
            <input
              id="service-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Identity Management Service"
              required
              value={name}
            />
          </div>

          <div className="form-group">
            <label htmlFor="service-tier">Criticality Tier *</label>
            <select
              id="service-tier"
              onChange={(e) => setTier(e.target.value as ServiceTier)}
              value={tier}
            >
              <option value="critical">Critical (Customer Facing, 99.99% SLA)</option>
              <option value="standard">Standard (Core Features, 99.9% SLA)</option>
              <option value="internal">Internal (Developer Tooling, 99.5% SLA)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="service-description">Service Responsibility & Overview *</label>
            <textarea
              id="service-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this service do? Which APIs or queues does it handle?"
              required
              rows={3}
              value={description}
            />
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" disabled={submitting} type="submit">
              {submitting ? 'Registering...' : 'Register Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
