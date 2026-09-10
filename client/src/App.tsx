import { useState, useEffect, useCallback } from 'react'
import type {
  CreateIncidentDto,
  CreateServiceDto,
  AddIncidentUpdateDto,
  Incident,
  Service,
  SystemMetrics,
} from '../../shared/types'
import { api } from './services/api'
import { Navbar } from './components/Navbar'
import { MetricsCards } from './components/MetricsCards'
import { ServiceGrid } from './components/ServiceGrid'
import { IncidentFeed } from './components/IncidentFeed'
import { CreateIncidentModal } from './components/CreateIncidentModal'
import { AddUpdateModal } from './components/AddUpdateModal'
import { NewServiceModal } from './components/NewServiceModal'
import './App.css'

export function App() {
  const [services, setServices] = useState<Service[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur))
    }, 4000)
  }

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [fetchedServices, fetchedIncidents, fetchedMetrics] = await Promise.all([
        api.getServices(),
        api.getIncidents(),
        api.getMetrics(),
      ])
      setServices(fetchedServices)
      setIncidents(fetchedIncidents)
      setMetrics(fetchedMetrics)
    } catch (err: any) {
      showToast(`Error loading telemetry: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleCreateIncident = async (dto: CreateIncidentDto) => {
    await api.createIncident(dto)
    showToast(`Declared ${dto.severity.toUpperCase()} incident: "${dto.title}"`)
    await loadDashboardData()
  }

  const handleAddUpdate = async (incidentId: number, dto: AddIncidentUpdateDto) => {
    await api.addIncidentUpdate(incidentId, dto)
    showToast(
      dto.status === 'resolved'
        ? 'Incident resolved! Service health restored.'
        : `Timeline updated to: ${dto.status}`,
    )
    await loadDashboardData()
  }

  const handleCreateService = async (dto: CreateServiceDto) => {
    await api.createService(dto)
    showToast(`Registered new service: "${dto.name}"`)
    await loadDashboardData()
  }

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved')

  return (
    <div className="app-layout">
      {toastMessage && (
        <aside aria-live="polite" className="toast-notification" role="status">
          {toastMessage}
        </aside>
      )}

      <Navbar
        activeIncidentsCount={activeIncidents.length}
        onOpenNewServiceModal={() => setIsNewServiceOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
      />

      {/* Overview Banner */}
      <section className="overview-highlight-banner" aria-label="Quick Overview">
        <div className="banner-content">
          <div className="banner-tag">FULL-STACK EVALUATION</div>
          <p>
            <strong>PulseOps</strong> is an engineering incident & SLA platform demonstrating{' '}
            <strong>React 19 + TypeScript</strong>, <strong>Node.js / Express REST API</strong>,{' '}
            <strong>Relational SQLite/PostgreSQL</strong>, <strong>Docker Compose</strong>, and{' '}
            <strong>Automated State Transitions</strong>.
          </p>
          <div className="banner-badges">
            <span>Node.js / Express</span>
            <span>React 19</span>
            <span>Relational SQL</span>
            <span>Docker Multi-Stage</span>
            <span>100% Green CI</span>
          </div>
        </div>
      </section>

      <main className="main-content">
        <MetricsCards loading={loading} metrics={metrics} />

        <div className="dashboard-grid">
          <ServiceGrid loading={loading} services={services} />
          <IncidentFeed
            incidents={incidents}
            loading={loading}
            onOpenAddUpdate={(incident) => setSelectedIncident(incident)}
          />
        </div>
      </main>

      {/* Modals */}
      <CreateIncidentModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleCreateIncident}
        services={services}
      />

      <AddUpdateModal
        incident={selectedIncident}
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        onSubmit={handleAddUpdate}
      />

      <NewServiceModal
        isOpen={isNewServiceOpen}
        onClose={() => setIsNewServiceOpen(false)}
        onSubmit={handleCreateService}
      />
    </div>
  )
}

export default App
