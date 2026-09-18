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

  const overallUtilization =
    factoryState.machines.length > 0
      ? (factoryState.machines.reduce((sum, m) => sum + m.utilization, 0) /
          factoryState.machines.length) *
        100
      : 0

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#1F1F1F] flex flex-col">

      <Header simulationTime={factoryState.simulationTime} isRunning={isRunning} />

      <main className="flex-1 flex flex-col gap-4 px-5 py-5 max-w-[1600px] mx-auto w-full">

        {/* ── KPI Bar ──────────────────────────────────────────────────── */}
        <KpiBar factoryState={factoryState} overallUtilization={overallUtilization} />

        {/* ── Production Line ───────────────────────────────────────────── */}
        <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
          <div className="px-5 pt-3 pb-0 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-[#C62828]" />
            <h2 className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#666666]">
              Production Line
            </h2>
          </div>
          <ProductionLine factoryState={factoryState} analysis={analysis} />
        </section>

        {/* ── Intelligence + Controls ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
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

        {/* ── What-If Scenario ─────────────────────────────────────────── */}
        <WhatIfPanel liveState={factoryState} liveHistory={liveHistory} />

      </main>

      <footer className="border-t border-[#E5E5E5] px-6 py-2.5 text-center text-[8px] text-[#666666] uppercase tracking-widest">
        SI-02 · Tablet Manufacturing Digital Twin · Prototype
      </footer>
    </div>
  )
}
