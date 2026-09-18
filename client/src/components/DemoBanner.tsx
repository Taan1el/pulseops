import { resetDemoData } from '../services/demoApi'

export function DemoBanner() {
  const handleReset = () => {
    resetDemoData()
    window.location.reload()
  }

  return (
    <div className="demo-bar" role="status">
      <div className="demo-bar-inner">
        <span>Demo: everything runs in your browser with sample data.</span>
        <span className="demo-bar-links">
          <button className="link-btn" onClick={handleReset} type="button">
            Reset sample data
          </button>
          <a href="https://github.com/Taan1el/pulseops" rel="noreferrer" target="_blank">
            Source on GitHub
          </a>
        </span>
      </div>
    </div>
  )
}
