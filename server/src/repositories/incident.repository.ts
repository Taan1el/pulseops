import { Database } from '../db/database.js'
import type {
  AddIncidentUpdateDto,
  CreateIncidentDto,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentUpdate,
} from '../../../shared/types.js'

interface IncidentRow {
  id: number
  title: string
  status: IncidentStatus
  severity: IncidentSeverity
  service_id: number
  service_name?: string
  summary: string
  created_at: string
  resolved_at: string | null
}

interface IncidentUpdateRow {
  id: number
  incident_id: number
  status: IncidentStatus
  message: string
  created_at: string
}

function mapRowToIncident(row: IncidentRow, updates: IncidentUpdate[] = []): Incident {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    severity: row.severity,
    serviceId: row.service_id,
    serviceName: row.service_name,
    summary: row.summary,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    updates,
  }
}

function mapRowToUpdate(row: IncidentUpdateRow): IncidentUpdate {
  return {
    id: row.id,
    incidentId: row.incident_id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
  }
}

export class IncidentRepository {
  constructor(private db: Database) {}

  findAll(filter?: { status?: IncidentStatus; serviceId?: number }): Incident[] {
    let sql = `
      SELECT i.*, s.name as service_name
      FROM incidents i
      LEFT JOIN services s ON i.service_id = s.id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (filter?.status) {
      sql += ' AND i.status = ?'
      params.push(filter.status)
    }

    if (filter?.serviceId) {
      sql += ' AND i.service_id = ?'
      params.push(filter.serviceId)
    }

    sql += " ORDER BY CASE WHEN i.status != 'resolved' THEN 0 ELSE 1 END, i.created_at DESC"

    const rows = this.db.queryAll<IncidentRow>(sql, params)
    return rows.map((row) => {
      const updates = this.findUpdatesByIncidentId(row.id)
      return mapRowToIncident(row, updates)
    })
  }

  findById(id: number): Incident | undefined {
    const row = this.db.queryOne<IncidentRow>(
      `SELECT i.*, s.name as service_name
       FROM incidents i
       LEFT JOIN services s ON i.service_id = s.id
       WHERE i.id = ?`,
      [id],
    )
    if (!row) return undefined
    const updates = this.findUpdatesByIncidentId(row.id)
    return mapRowToIncident(row, updates)
  }

  create(dto: CreateIncidentDto): Incident {
    const now = new Date().toISOString()
    const initialStatus = dto.initialStatus ?? 'investigating'

    const result = this.db.execute(
      `INSERT INTO incidents (title, status, severity, service_id, summary, created_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [dto.title, initialStatus, dto.severity, dto.serviceId, dto.summary, now],
    )

    const incidentId = Number(result.lastInsertRowid)

    // Automatically create first timeline update
    const initialUpdateResult = this.db.execute(
      `INSERT INTO incident_updates (incident_id, status, message, created_at)
       VALUES (?, ?, ?, ?)`,
      [incidentId, initialStatus, `Incident opened: ${dto.summary}`, now],
    )

    const initialUpdate: IncidentUpdate = {
      id: Number(initialUpdateResult.lastInsertRowid),
      incidentId,
      status: initialStatus,
      message: `Incident opened: ${dto.summary}`,
      createdAt: now,
    }

    const service = this.db.queryOne<{ name: string }>(
      'SELECT name FROM services WHERE id = ?',
      [dto.serviceId],
    )

    return {
      id: incidentId,
      title: dto.title,
      status: initialStatus,
      severity: dto.severity,
      serviceId: dto.serviceId,
      serviceName: service?.name,
      summary: dto.summary,
      createdAt: now,
      resolvedAt: null,
      updates: [initialUpdate],
    }
  }

  addUpdate(dto: AddIncidentUpdateDto & { incidentId: number }): IncidentUpdate {
    const now = new Date().toISOString()
    const result = this.db.execute(
      `INSERT INTO incident_updates (incident_id, status, message, created_at)
       VALUES (?, ?, ?, ?)`,
      [dto.incidentId, dto.status, dto.message, now],
    )

    // Update incident status and resolved_at if resolved
    const resolvedAt = dto.status === 'resolved' ? now : null
    if (dto.status === 'resolved') {
      this.db.execute(
        'UPDATE incidents SET status = ?, resolved_at = ? WHERE id = ?',
        [dto.status, resolvedAt, dto.incidentId],
      )
    } else {
      this.db.execute('UPDATE incidents SET status = ? WHERE id = ?', [
        dto.status,
        dto.incidentId,
      ])
    }

    return {
      id: Number(result.lastInsertRowid),
      incidentId: dto.incidentId,
      status: dto.status,
      message: dto.message,
      createdAt: now,
    }
  }

  findUpdatesByIncidentId(incidentId: number): IncidentUpdate[] {
    const rows = this.db.queryAll<IncidentUpdateRow>(
      'SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY created_at DESC',
      [incidentId],
    )
    return rows.map(mapRowToUpdate)
  }

  countActive(): number {
    const result = this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM incidents WHERE status != 'resolved'",
    )
    return result?.count ?? 0
  }

  countActiveByService(serviceId: number): number {
    const result = this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM incidents WHERE service_id = ? AND status != 'resolved'",
      [serviceId],
    )
    return result?.count ?? 0
  }

  countResolved(): number {
    const result = this.db.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM incidents WHERE status = 'resolved'",
    )
    return result?.count ?? 0
  }
}
