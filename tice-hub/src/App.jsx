import { useEffect, useState } from 'react'
import AIAnalyst from './components/AIAnalyst'
import Dashboard from './components/Dashboard'
import WeeklyReport from './components/WeeklyReport'

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'analyst', label: 'AI Analyst' },
  { id: 'report', label: 'Weekly Report' },
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    setIsSwitching(true)
    const timer = window.setTimeout(() => setIsSwitching(false), 220)
    return () => window.clearTimeout(timer)
  }, [activeTab])

  function renderContent() {
    if (activeTab === 'analyst') return <AIAnalyst />
    if (activeTab === 'report') return <WeeklyReport />
    return <Dashboard />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-[#2d436f] bg-[#1B2A4A] shadow-lg">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E8792B] text-lg font-black text-[#1B2A4A]">
                T
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">TICE Operations Intelligence</p>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Teamwork · Integrity · Commitment to Excellence</p>
              </div>
            </div>
            <div className="rounded-full border border-[#415d92] bg-[#16233e] px-3 py-1 text-xs font-medium text-[#E8792B]">
              Demo — Simulated Data
            </div>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Primary">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[#E8792B] text-[#1B2A4A] shadow'
                      : 'bg-[#22365c] text-slate-200 hover:bg-[#2b4471]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        {isSwitching ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-300" />
          </div>
        ) : (
          renderContent()
        )}
      </main>

      <footer className="mt-8 border-t border-slate-800 bg-slate-900/80">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-sm text-slate-300 md:px-6 lg:px-8">
          Built for TICE by Matthew Amaro | Operations Intelligence Prototype | Data is simulated for demonstration purposes
        </div>
      </footer>
    </div>
  )
}

export default App
