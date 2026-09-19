import { useCallback, useEffect, useState } from 'react'
import { useDigitalTwin } from '../hooks/useDigitalTwin'
import type { ScenarioResult } from '../digitalTwin/scenarioTypes'
import type { MachineId } from '../digitalTwin/types'
import { Continuous2DJourney } from './Continuous2DJourney'
import { ScenarioPanel } from './ScenarioPanel'

const chapters: Array<[MachineId, string, string]> = [['M1', 'MIX', 'POWDER'], ['M2', 'GRANULATE', 'GRANULES'], ['M3', 'PRESS', 'TABLET'], ['M4', 'COAT', 'COATED'], ['M5', 'CHECK', 'INSPECTED'], ['M6', 'PACK', 'FINISHED']]

export function StoryExperience() {
  const twin = useDigitalTwin()
  const [started, setStarted] = useState(false)
  const [activeId, setActiveId] = useState<MachineId>('M1')
  const [scenarioBottleneckId, setScenarioBottleneckId] = useState<MachineId | null>(null)
  const [scenarioState, setScenarioState] = useState<typeof twin.factoryState | null>(null)
  const machine = twin.factoryState.machines.find((item) => item.id === activeId) ?? twin.factoryState.machines[0]!
  const selectChapter = useCallback((id: MachineId) => setActiveId(id), [])
  const handleScenarioResult = useCallback((result: ScenarioResult | null) => { setScenarioBottleneckId((result?.scenarioSnapshot.analysis.line.bottleneck?.machineId as MachineId | undefined) ?? null); setScenarioState(result?.scenarioSnapshot.state ?? null) }, [])
  const start = () => { setStarted(true); twin.start() }
  const replay = () => { twin.reset(); setStarted(true); twin.start() }
  useEffect(() => () => twin.pause(), [twin.pause])

  return <div className="motion-site">
    <header className="motion-header"><a href="#top" className="motion-logo">SI—02</a><span className="motion-subtitle">DIGITAL PRODUCTION TWIN</span><div className="motion-controls"><span>T+{twin.factoryState.simulationTime.toString().padStart(2, '0')} MIN</span>{started && <button onClick={twin.isRunning ? twin.pause : start}>{twin.isRunning ? 'PAUSE' : 'RESUME'}</button>}</div></header>
    <main>
      <section className="motion-hero" id="top"><div className="motion-intro"><p className="micro-label">ONE MATERIAL / SIX CHAPTERS</p><h1>FROM<br /><em>POWDER</em><br />TO PRODUCT.</h1><p>A tiny material journey through mix, press, coat, check, and pack.</p><button className="motion-start" onClick={started ? replay : start}>{started ? 'REPLAY JOURNEY →' : 'START JOURNEY →'}</button></div><Continuous2DJourney state={twin.factoryState} scenarioState={scenarioState} activeId={activeId} started={started} onStage={selectChapter} bottleneckId={scenarioBottleneckId} /></section>
      <nav className="chapter-nav" aria-label="Journey chapters">{chapters.map(([id, verb, material]) => <button key={id} className={activeId === id ? 'active' : ''} onClick={() => selectChapter(id)}><b>{id}</b><strong>{verb}</strong><small>{material}</small></button>)}</nav>
      <section className="motion-readout"><div><span className="micro-label">NOW IN MOTION</span><h2>{machine.stage.toUpperCase()}</h2></div><div className="motion-metrics"><span><b>{machine.outputRate.toFixed(0)}</b> UNITS / MIN</span><span><b>{Math.round(machine.utilization * 100)}%</b> LOAD</span><span><b>{machine.queue.toFixed(0)}</b> WAITING</span></div><p>{machine.status === 'DOWN' ? 'The material waits here.' : 'The material keeps moving through the line.'}</p></section>
      <section className="motion-experiment"><div><span className="micro-label">OPTIONAL EXPERIMENT</span><h2>What if<br /><em>the pace changes?</em></h2><p className="scenario-intro">Combine changes, run the line forward, and compare the result with the untouched baseline.</p></div><ScenarioPanel liveState={twin.factoryState} liveHistory={twin.liveHistory} onResult={handleScenarioResult} /></section>
    </main>
    <footer className="motion-footer"><span>SI—02</span><span>RAW MATERIAL → FINISHED PRODUCT</span><span>LIVE DIGITAL TWIN</span></footer>
  </div>
}
