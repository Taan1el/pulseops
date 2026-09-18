import { useState, useEffect, useCallback, useRef } from 'react'
import { TriangleAlert } from 'lucide-react'
import type {
  CreateIncidentDto,
  CreateServiceDto,
  AddIncidentUpdateDto,
  Incident,
  Service,
  SystemMetrics,
} from '../../shared/types'
import { api } from './services/api'
import { Header } from './components/Header'
import { DemoBanner } from './components/DemoBanner'
import { StatsStrip } from './components/StatsStrip'
import { ServiceTable } from './components/ServiceTable'
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
  const [loadFailed, setLoadFailed] = useState(false)
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

  // Only the most recent load may update state, so a slow older request
  // cannot overwrite newer data or report a failure that was already recovered.
  const latestLoadId = useRef(0)

  const loadDashboardData = useCallback(async () => {
    const loadId = ++latestLoadId.current
    try {
      setLoading(true)
      const [fetchedServices, fetchedIncidents, fetchedMetrics] = await Promise.all([
        api.getServices(),
        api.getIncidents(),
        api.getMetrics(),
      ])
      if (loadId !== latestLoadId.current) return
      setServices(fetchedServices)
      setIncidents(fetchedIncidents)
      setMetrics(fetchedMetrics)
      setLoadFailed(false)
    } catch {
      if (loadId !== latestLoadId.current) return
      setLoadFailed(true)
    } finally {
      if (loadId === latestLoadId.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleCreateIncident = async (dto: CreateIncidentDto) => {
    await api.createIncident(dto)
    showToast(`Declared a ${dto.severity.toUpperCase()} incident: "${dto.title}"`)
    await loadDashboardData()
  }

  const handleAddUpdate = async (incidentId: number, dto: AddIncidentUpdateDto) => {
    await api.addIncidentUpdate(incidentId, dto)
    showToast(
      dto.status === 'resolved'
        ? 'Incident resolved. Service health restored.'
        : `Timeline updated to ${dto.status}.`,
    )
    await loadDashboardData()
  }

  const handleCreateService = async (dto: CreateServiceDto) => {
    await api.createService(dto)
    showToast(`Registered "${dto.name}"`)
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

      {import.meta.env.VITE_DEMO_MODE === 'true' && <DemoBanner />}

      <Header
        activeIncidentsCount={activeIncidents.length}
        dataStatus={loadFailed ? (metrics ? 'stale' : 'unavailable') : metrics ? 'ready' : 'loading'}
        onOpenNewServiceModal={() => setIsNewServiceOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
      />

      <main className="main-content">
        {loadFailed && (
          <section aria-label="Dashboard connection error" className="alert alert-error">
            <span className="alert-message" role="alert">
              <TriangleAlert aria-hidden="true" size={16} strokeWidth={1.75} />
              Unable to load dashboard data.{' '}
              {metrics
                ? 'Showing the last successfully loaded data. It may be outdated.'
                : 'Service health and incidents are unavailable. Try again to load them.'}
            </span>
            <button
              className="btn btn-secondary"
              disabled={loading}
              onClick={() => void loadDashboardData()}
              type="button"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </section>
        )}

        {(!loadFailed || metrics) && (
          <div aria-busy={loading} className="dashboard-stack">
            <StatsStrip loading={loading && !metrics} metrics={metrics} />
            <ServiceTable loading={loading && !metrics} services={services} />
            <IncidentFeed
              incidents={incidents}
              loading={loading && !metrics}
              onOpenAddUpdate={(incident) => setSelectedIncident(incident)}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div>PulseOps</div>
        <div className="footer-links">
          <a href="https://github.com/Taan1el/pulseops" rel="noreferrer" target="_blank">
            Source on GitHub
          </a>
        </div>
      </footer>

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
