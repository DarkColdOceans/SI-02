import { useState } from 'react'
import { useDigitalTwin } from '../hooks/useDigitalTwin'
import { Header } from './Header'
import { KpiBar } from './KpiBar'
import { ProductionLine } from './ProductionLine'
import { CinematicMachineScene } from './CinematicMachineScene'
import { BottleneckPanel } from './BottleneckPanel'
import { ControlPanel } from './ControlPanel'
import { WhatIfPanel } from './WhatIfPanel'

export function Dashboard() {
  const { factoryState, liveHistory, analysis, isRunning, start, pause, reset, injectM4Downtime, injectM5Slowdown, clearFaults } = useDigitalTwin()
  const [selectedId, setSelectedId] = useState('M3')
  const selectedIndex = Math.max(0, factoryState.machines.findIndex((machine) => machine.id === selectedId))
  const selectedMachine = factoryState.machines[selectedIndex] ?? factoryState.machines[0]!
  const selectedAnalysis = analysis.machines.find((item) => item.machineId === selectedMachine.id)
  const overallUtilization = factoryState.machines.length > 0
    ? (factoryState.machines.reduce((sum, machine) => sum + machine.utilization, 0) / factoryState.machines.length) * 100
    : 0
  const selectMachine = (id: string) => { if (id !== 'SOURCE') setSelectedId(id) }
  const previous = () => setSelectedId(factoryState.machines[(selectedIndex - 1 + factoryState.machines.length) % factoryState.machines.length]!.id)
  const next = () => setSelectedId(factoryState.machines[(selectedIndex + 1) % factoryState.machines.length]!.id)

  return (
    <div className="app-shell">
      <div className="film-grain" />
      <Header simulationTime={factoryState.simulationTime} isRunning={isRunning} />
      <main className="app-main">
        <section className="hero-intro">
          <div><p className="kicker">SI—02 / DIGITAL TWIN LABORATORY</p><h2>Observe the line.<br /><em>Understand the constraint.</em></h2></div>
          <div className="hero-note"><span className="signal-line" />The production line is live. Select a stage to enter the process.</div>
        </section>
        <KpiBar factoryState={factoryState} overallUtilization={overallUtilization} />
        <CinematicMachineScene machine={selectedMachine} bottleneck={selectedAnalysis} onPrevious={previous} onNext={next} />
        <section className="line-section"><div className="section-heading"><div><p className="kicker">LINE OVERVIEW / MATERIAL JOURNEY</p><h3>Production sequence</h3></div><span className="section-meta">{factoryState.machines.length} STAGES <i /> {factoryState.buffers.length} BUFFERS</span></div><ProductionLine factoryState={factoryState} analysis={analysis} selectedId={selectedId} onSelect={selectMachine} /></section>
        <div className="dashboard-grid"><BottleneckPanel analysis={analysis} /><ControlPanel isRunning={isRunning} onStart={start} onPause={pause} onReset={reset} onInjectM4Downtime={injectM4Downtime} onInjectM5Slowdown={injectM5Slowdown} onClearFaults={clearFaults} /></div>
        <WhatIfPanel liveState={factoryState} liveHistory={liveHistory} />
      </main>
      <footer className="app-footer"><span>SI—02</span><span>TABLET MANUFACTURING / DIGITAL TWIN</span><span>SIMULATION SOURCE: LIVE STATE</span></footer>
    </div>
  )
}
