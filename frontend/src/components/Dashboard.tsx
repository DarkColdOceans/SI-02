import { useDigitalTwin } from '../hooks/useDigitalTwin'
import { Header } from './Header'
import { KpiBar } from './KpiBar'
import { ProductionLine } from './ProductionLine'
import { BottleneckPanel } from './BottleneckPanel'
import { ControlPanel } from './ControlPanel'
import { WhatIfPanel } from './WhatIfPanel'

export function Dashboard() {
  const {
    factoryState,
    liveHistory,
    analysis,
    isRunning,
    start,
    pause,
    reset,
    injectM4Downtime,
    injectM5Slowdown,
    clearFaults,
  } = useDigitalTwin()

  // Compute average utilisation across all machines
  const overallUtilization =
    factoryState.machines.length > 0
      ? (factoryState.machines.reduce((sum, m) => sum + m.utilization, 0) /
          factoryState.machines.length) *
        100
      : 0

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Ambient gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-cyan-900/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-900/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-blue-900/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Header simulationTime={factoryState.simulationTime} isRunning={isRunning} />

        <main className="flex-1 flex flex-col gap-5 p-5 max-w-[1600px] mx-auto w-full">

          {/* KPI bar */}
          <KpiBar factoryState={factoryState} overallUtilization={overallUtilization} />

          {/* Production line */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-slate-800/60">
              <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Production Line
              </h2>
            </div>
            <ProductionLine factoryState={factoryState} analysis={analysis} />
          </section>

          {/* Bottom panels: bottleneck + controls */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <BottleneckPanel analysis={analysis} />
            <ControlPanel
              isRunning={isRunning}
              onStart={start}
              onPause={pause}
              onReset={reset}
              onInjectM4Downtime={injectM4Downtime}
              onInjectM5Slowdown={injectM5Slowdown}
              onClearFaults={clearFaults}
            />
          </div>

          {/* What-If Scenario panel */}
          <WhatIfPanel liveState={factoryState} liveHistory={liveHistory} />

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 px-6 py-3 text-center text-[9px] text-slate-600 uppercase tracking-widest">
          SI-02 · Tablet Manufacturing Digital Twin · Prototype
        </footer>
      </div>
    </div>
  )
}
