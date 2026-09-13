import type { Request, Response, NextFunction } from 'express'
import { IncidentService } from '../services/incident.service.js'
import type { AddIncidentUpdateDto, CreateIncidentDto, IncidentStatus } from '../../../shared/types.js'

export class IncidentController {
  constructor(private incidentService: IncidentService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as IncidentStatus | undefined
      const serviceId = req.query.serviceId ? Number(req.query.serviceId) : undefined

      const incidents = this.incidentService.getAllIncidents({ status, serviceId })
      res.json({ success: true, data: incidents })
    } catch (err) {
      next(err)
    }
  }

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      const incident = this.incidentService.getIncidentById(id)
      if (!incident) {
        res.status(404).json({ success: false, error: 'Incident not found' })
        return
      }
      res.json({ success: true, data: incident })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, severity, serviceId, summary, initialStatus } =
        req.body as CreateIncidentDto

      if (!title || !severity || !serviceId || !summary) {
        res.status(400).json({
          success: false,
          error: 'Title, severity, serviceId, and summary are required',
        })
        return
      }

      const validSeverities = ['p1', 'p2', 'p3', 'p4']
      if (!validSeverities.includes(severity)) {
        res.status(400).json({
          success: false,
          error: 'Invalid severity. Must be one of: p1, p2, p3, p4',
        })
        return
      }

      const validStatuses = ['investigating', 'identified', 'monitoring', 'resolved']
      if (initialStatus && !validStatuses.includes(initialStatus)) {
        res.status(400).json({
          success: false,
          error: 'Invalid initialStatus. Must be one of: investigating, identified, monitoring, resolved',
        })
        return
      }

      const incident = this.incidentService.createIncident({
        title,
        severity,
        serviceId: Number(serviceId),
        summary,
        initialStatus,
      })

      res.status(201).json({ success: true, data: incident })
    } catch (err) {
      next(err)
    }
  }

  addUpdate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id)
      const { status, message } = req.body as AddIncidentUpdateDto

      if (!status || !message) {
        res.status(400).json({
          success: false,
          error: 'Status and message are required',
        })
        return
      }

      const validStatuses = ['investigating', 'identified', 'monitoring', 'resolved']
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be one of: investigating, identified, monitoring, resolved',
        })
        return
      }

      const result = this.incidentService.addUpdate(id, { status, message })
      res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }
}
