import { resetDemoData } from '../services/demoApi'

export function DemoModeBanner() {
  const handleReset = () => {
    resetDemoData()
    window.location.reload()
  }

  return (
    <div className="demo-mode-banner" role="status">
      <span>
        <strong>Demo mode.</strong> Data is simulated in your browser and never leaves your
        device.{' '}
        <a href="https://github.com/Taan1el/pulseops" rel="noreferrer" target="_blank">
          View the source on GitHub
        </a>
      </span>
      <button className="btn btn-sm btn-outline" onClick={handleReset} type="button">
        Reset demo data
      </button>
    </div>
  )
}
