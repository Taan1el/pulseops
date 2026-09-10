import { Database } from '../db/database.js'
import type {
  CreateServiceDto,
  Service,
  ServiceStatus,
  UpdateServiceDto,
} from '../../../shared/types.js'

interface ServiceRow {
  id: number
  name: string
  slug: string
  description: string
  status: ServiceStatus
  tier: 'critical' | 'standard' | 'internal'
  uptime_percentage: number
  updated_at: string
}

function mapRowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    tier: row.tier,
    uptimePercentage: row.uptime_percentage,
    updatedAt: row.updated_at,
  }
}

export class ServiceRepository {
  constructor(private db: Database) {}

  findAll(): Service[] {
    const rows = this.db.queryAll<ServiceRow>(
      "SELECT * FROM services ORDER BY tier = 'critical' DESC, name ASC",
    )
    return rows.map(mapRowToService)
  }

  findById(id: number): Service | undefined {
    const row = this.db.queryOne<ServiceRow>('SELECT * FROM services WHERE id = ?', [id])
    return row ? mapRowToService(row) : undefined
  }

  findBySlug(slug: string): Service | undefined {
    const row = this.db.queryOne<ServiceRow>(
      'SELECT * FROM services WHERE slug = ?',
      [slug],
    )
    return row ? mapRowToService(row) : undefined
  }

  create(dto: CreateServiceDto): Service {
    const slug =
      dto.slug ??
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    const now = new Date().toISOString()
    const status = dto.status ?? 'operational'
    const tier = dto.tier ?? 'standard'

    const result = this.db.execute(
      `INSERT INTO services (name, slug, description, status, tier, uptime_percentage, updated_at)
       VALUES (?, ?, ?, ?, ?, 100.0, ?)`,
      [dto.name, slug, dto.description, status, tier, now],
    )

    return {
      id: Number(result.lastInsertRowid),
      name: dto.name,
      slug,
      description: dto.description,
      status,
      tier,
      uptimePercentage: 100.0,
      updatedAt: now,
    }
  }

  updateStatus(id: number, status: ServiceStatus): Service | undefined {
    const now = new Date().toISOString()
    this.db.execute('UPDATE services SET status = ?, updated_at = ? WHERE id = ?', [
      status,
      now,
      id,
    ])
    return this.findById(id)
  }

  update(id: number, data: UpdateServiceDto): Service | undefined {
    const existing = this.findById(id)
    if (!existing) return undefined

    const name = data.name ?? existing.name
    const description = data.description ?? existing.description
    const status = data.status ?? existing.status
    const tier = data.tier ?? existing.tier
    const now = new Date().toISOString()

    this.db.execute(
      `UPDATE services SET name = ?, description = ?, status = ?, tier = ?, updated_at = ?
       WHERE id = ?`,
      [name, description, status, tier, now, id],
    )

    return this.findById(id)
  }

  count(): number {
    const result = this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM services',
    )
    return result?.count ?? 0
  }

  countByStatus(status: ServiceStatus): number {
    const result = this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM services WHERE status = ?',
      [status],
    )
    return result?.count ?? 0
  }
}
