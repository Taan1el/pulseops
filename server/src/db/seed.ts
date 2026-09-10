import { Database } from './database.js'

export function seedDatabase(db: Database): void {
  const existingServices = db.queryAll('SELECT id FROM services LIMIT 1')
  if (existingServices.length > 0) {
    return
  }

  const now = new Date().toISOString()

  // Seed services
  const services = [
    {
      name: 'Auth & Identity API',
      slug: 'auth-identity-api',
      description: 'User authentication, token verification, and RBAC authorization service.',
      status: 'operational',
      tier: 'critical',
      uptime_percentage: 99.98,
    },
    {
      name: 'Payment Processing Gateway',
      slug: 'payment-processing-gateway',
      description: 'Stripe, SEPA, and regional payment webhook ingestion and reconciliation.',
      status: 'operational',
      tier: 'critical',
      uptime_percentage: 99.95,
    },
    {
      name: 'Core REST API',
      slug: 'core-rest-api',
      description: 'Main product domain REST endpoints serving client dashboards and mobile clients.',
      status: 'operational',
      tier: 'critical',
      uptime_percentage: 99.99,
    },
    {
      name: 'Search & Indexing Engine',
      slug: 'search-indexing-engine',
      description: 'Elasticsearch cluster indexing user resources and fast query resolution.',
      status: 'operational',
      tier: 'standard',
      uptime_percentage: 99.85,
    },
    {
      name: 'Notification & Webhook Dispatcher',
      slug: 'notification-dispatcher',
      description: 'Reliable message queue for outgoing client webhooks, email, and SMS notifications.',
      status: 'operational',
      tier: 'standard',
      uptime_percentage: 99.91,
    },
    {
      name: 'Analytics & Audit Pipeline',
      slug: 'analytics-audit-pipeline',
      description: 'Background stream recording user activity logs and compliance audit trails.',
      status: 'operational',
      tier: 'internal',
      uptime_percentage: 99.70,
    },
  ]

  for (const service of services) {
    db.execute(
      `INSERT INTO services (name, slug, description, status, tier, uptime_percentage, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        service.name,
        service.slug,
        service.description,
        service.status,
        service.tier,
        service.uptime_percentage,
        now,
      ],
    )
  }

  // Seed resolved reference incident
  const authService = db.queryOne<{ id: number }>(
    "SELECT id FROM services WHERE slug = 'auth-identity-api'",
  )

  if (authService) {
    const pastHour = new Date(Date.now() - 3600 * 1000 * 3).toISOString()
    const pastHalfHour = new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    const resolvedTime = new Date(Date.now() - 3600 * 1000 * 1).toISOString()

    const incidentResult = db.execute(
      `INSERT INTO incidents (title, status, severity, service_id, summary, created_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Elevated JWT Token Validation Latency',
        'resolved',
        'p2',
        authService.id,
        'Downstream Redis replica lag caused transient 504 gateway timeouts on token validation endpoints.',
        pastHour,
        resolvedTime,
      ],
    )

    const incidentId = Number(incidentResult.lastInsertRowid)

    db.execute(
      `INSERT INTO incident_updates (incident_id, status, message, created_at)
       VALUES (?, ?, ?, ?)`,
      [
        incidentId,
        'investigating',
        'We are investigating reports of slow authentication requests affecting login endpoints.',
        pastHour,
      ],
    )

    db.execute(
      `INSERT INTO incident_updates (incident_id, status, message, created_at)
       VALUES (?, ?, ?, ?)`,
      [
        incidentId,
        'identified',
        'Redis replica synchronizing caused cache lookup timeouts. Traffic redirected to primary cache.',
        pastHalfHour,
      ],
    )

    db.execute(
      `INSERT INTO incident_updates (incident_id, status, message, created_at)
       VALUES (?, ?, ?, ?)`,
      [
        incidentId,
        'resolved',
        'Cache replica synchronization complete and error rate returned to 0.00%. Incident resolved.',
        resolvedTime,
      ],
    )
  }
}
