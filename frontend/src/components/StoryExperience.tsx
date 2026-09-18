import { useCallback, useState } from 'react'
import { useDigitalTwin } from '../hooks/useDigitalTwin'
import { useWhatIf } from '../hooks/useWhatIf'
import type { Machine, MachineId } from '../digitalTwin/types'
import type { ScenarioResult } from '../digitalTwin/scenarioEngine'

const chapters = [
  { id: 'M1' as MachineId, number: '01', short: 'MIX', title: 'Powder becomes one.', detail: 'MIXING VESSEL' },
  { id: 'M2' as MachineId, number: '02', short: 'GRANULATE', title: 'Fine particles gather.', detail: 'GRANULATION CHAMBER' },
  { id: 'M3' as MachineId, number: '03', short: 'COMPRESS', title: 'Pressure makes form.', detail: 'ROTARY TABLET PRESS' },
  { id: 'M4' as MachineId, number: '04', short: 'COAT', title: 'The surface takes shape.', detail: 'COATING PAN' },
  { id: 'M5' as MachineId, number: '05', short: 'INSPECT', title: 'Every tablet is seen.', detail: 'VISION INSPECTION' },
  { id: 'M6' as MachineId, number: '06', short: 'PACK', title: 'A product takes its final form.', detail: 'BLISTER PACKING' },
]

const stagePalette: Record<string, string> = { Mixing: '#e14b3b', Granulation: '#cf6b43', Compression: '#b53b32', Coating: '#d6934d', Inspection: '#687c73', Packing: '#aa5a4a' }

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function fmt(value: number) { return value.toFixed(0) }

export function StoryExperience() {
  const twin = useDigitalTwin()
  const [selectedId, setSelectedId] = useState<MachineId>('M3')
  const [camera, setCamera] = useState(0)
  const selectedIndex = chapters.findIndex((chapter) => chapter.id === selectedId)
  const machine = twin.factoryState.machines.find((item) => item.id === selectedId) ?? twin.factoryState.machines[2]!
  const analysis = twin.analysis.machines.find((item) => item.machineId === selectedId)
  const currentChapter = chapters[selectedIndex]!
  const flow = clamp(machine.outputRate / Math.max(machine.capacityPerMinute, 1), 0, 1)
  const bottleneck = twin.analysis.line.bottleneck?.machineId === selectedId
  const selectChapter = useCallback((id: MachineId) => { setSelectedId(id); setCamera(0); document.getElementById('machine-focus')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const previous = () => selectChapter(chapters[(selectedIndex + chapters.length - 1) % chapters.length]!.id)
  const next = () => selectChapter(chapters[(selectedIndex + 1) % chapters.length]!.id)

  return <div className="story-site" style={{ '--accent': stagePalette[machine.stage] ?? '#d94f3d', '--flow': flow } as React.CSSProperties}>
    <StoryHeader twin={twin} />
    <main>
      <Hero twin={twin} onEnter={() => document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' })} />
      <Journey selectedId={selectedId} onSelect={selectChapter} />
      <MachineFocus machine={machine} analysis={analysis} chapter={currentChapter} camera={camera} bottleneck={bottleneck} onPrevious={previous} onNext={next} onCamera={() => setCamera((value) => (value + 1) % 3)} />
      <Experiment twin={twin} />
    </main>
    <footer className="story-footer"><span>SI—02</span><span>LIVE DIGITAL TWIN / TABLET MANUFACTURING</span><span>T+{twin.factoryState.simulationTime.toString().padStart(2, '0')} MIN</span></footer>
  </div>
}

function StoryHeader({ twin }: { twin: ReturnType<typeof useDigitalTwin> }) {
  return <header className="story-header"><a href="#top" className="story-logo">SI—02</a><div className="header-center"><span className={twin.isRunning ? 'pulse-mark' : 'idle-mark'} /> LIVE PRODUCTION SIMULATION</div><div className="header-actions"><span>BOTTLENECK INTELLIGENCE</span><span>WHAT—IF ANALYSIS</span><button onClick={twin.isRunning ? twin.pause : twin.start}>{twin.isRunning ? 'PAUSE' : 'RUN'}</button></div></header>
}

export function Hero({ twin, onEnter }: { twin: ReturnType<typeof useDigitalTwin>; onEnter: () => void }) {
  return <section className="hero-story" id="top"><div className="hero-stamp">SI—02 / 2026<br />DIGITAL MANUFACTURING STUDY</div><div className="hero-title"><p className="micro-label">A LIVE PRODUCTION LINE, OBSERVED</p><h1><span>PRODUCTION</span><span className="outline-word">LINE</span><span className="red-word">DIGITAL TWIN</span></h1></div><div className="hero-bottom"><p>Raw material enters. Transformation begins.<br />Follow the material all the way to the pack.</p><button className="enter-button" onClick={onEnter}>ENTER THE JOURNEY <span>↓</span></button><div className="hero-time"><span>SIMULATION TIME</span><strong>T+{twin.factoryState.simulationTime.toString().padStart(2, '0')} MIN</strong></div></div><div className="hero-line-art"><div className="hero-material material-a" /><div className="hero-material material-b" /><div className="hero-material material-c" /><div className="hero-machine machine-a" /><div className="hero-machine machine-b" /><div className="hero-machine machine-c" /></div></section>
}

function Journey({ selectedId, onSelect }: { selectedId: MachineId; onSelect: (id: MachineId) => void }) {
  return <section className="journey-section" id="journey"><div className="section-rail"><span>THE PRODUCTION JOURNEY</span><span>RAW POWDER <i /> FINISHED PACK</span></div><div className="journey-intro"><h2>Six chapters.<br /><em>One continuous transformation.</em></h2><p>Move through the line to see where material changes, where it waits, and where the process is under pressure.</p></div><div className="chapters">{chapters.map((chapter) => <button key={chapter.id} className={`chapter ${selectedId === chapter.id ? 'chapter-active' : ''}`} onClick={() => onSelect(chapter.id)}><span className="chapter-number">{chapter.number}</span><span className="chapter-word">{chapter.short}</span><span className="chapter-title">{chapter.title}</span><span className="chapter-arrow">↗</span></button>)}</div></section>
}

function MachineFocus({ machine, analysis, chapter, camera, bottleneck, onPrevious, onNext, onCamera }: { machine: Machine; analysis?: { confidence: number }; chapter: typeof chapters[number]; camera: number; bottleneck: boolean; onPrevious: () => void; onNext: () => void; onCamera: () => void }) {
  const speed = `${(2.4 - clamp(machine.outputRate / Math.max(machine.capacityPerMinute, 1), .08, 1) * 1.5).toFixed(2)}s`
  return <section className="machine-focus" id="machine-focus"><div className="focus-top"><div><span className="machine-code">M{machine.id.slice(1).padStart(2, '0')}</span><h2>{machine.stage.toUpperCase()}</h2><p>{chapter.detail} / MATERIAL TRANSFORMATION STUDY</p></div><div className="focus-meta"><span>LIVE STATE</span><strong>{machine.status}</strong><span>{machine.outputRate.toFixed(0)} UNITS / MIN</span></div></div><div className={`scene scene-${machine.stage.toLowerCase()} camera-${camera}`} style={{ '--scene-speed': speed } as React.CSSProperties}><SceneDrawing machine={machine} /><div className="scene-label scene-label-in">INPUT <strong>{machine.queue.toFixed(0)}</strong></div><div className="scene-label scene-label-out">OUTPUT <strong>{machine.outputRate.toFixed(0)} / MIN</strong></div><div className="scene-caption"><span>{chapter.title}</span><span>{bottleneck ? 'BOTTLENECK / ' : ''}{Math.round(machine.utilization * 100)}% UTILIZATION</span></div></div><div className="focus-bottom"><button className="text-button" onClick={onPrevious}>← PREVIOUS</button><div className="focus-stats"><span><b>{fmt(machine.outputRate)}</b> UNITS/MIN</span><span><b>{Math.round(machine.utilization * 100)}%</b> UTILIZATION</span>{analysis && <span><b>{Math.round(analysis.confidence * 100)}%</b> SIGNAL</span>}</div><button className="text-button" onClick={onNext}>NEXT →</button><button className="camera-button" onClick={onCamera}>CAMERA {camera + 1}/3</button></div></section>
}

function SceneDrawing({ machine }: { machine: Machine }) {
  const particles = Array.from({ length: 22 }, (_, index) => index)
  const stage = machine.stage
  return <svg className="scene-svg" viewBox="0 0 1000 560" role="img" aria-label={`${stage} process visualization`}><defs><linearGradient id="body" x1="0" x2="1"><stop stopColor="#d6d6d0"/><stop offset=".45" stopColor="#fafaf5"/><stop offset="1" stopColor="#b5bab2"/></linearGradient><linearGradient id="darkBody" x1="0" x2="1"><stop stopColor="#161b1a"/><stop offset=".5" stopColor="#39413d"/><stop offset="1" stopColor="#101413"/></linearGradient></defs><path className="scene-track" d="M60 470 H940" />{particles.map((index) => <circle key={index} className="scene-particle" cx={100 + index * 38} cy={445 - (index % 4) * 9} r={stage === 'Packing' ? 8 : 4 + (index % 3)} style={{ animationDelay: `${index * -0.12}s` }} />)}<g className="scene-machine" transform={stage === 'Compression' ? 'translate(0 10)' : undefined}><rect x="260" y="145" width="480" height="265" rx="12" fill="url(#body)" stroke="#151a18" strokeWidth="5" /><rect x="285" y="170" width="430" height="215" rx="7" fill="url(#darkBody)" />{stage === 'Compression' ? <CompressionMechanism /> : stage === 'Packing' ? <PackingMechanism /> : <GeneralMechanism stage={stage} />}</g></svg>
}
function GeneralMechanism({ stage }: { stage: string }) { return <g className="general-mechanism"><circle cx="500" cy="275" r="92" fill="#202926" stroke="#db5843" strokeWidth="4" /><circle cx="500" cy="275" r="58" fill="none" stroke="#aab4a9" strokeWidth="3" strokeDasharray="14 10" /><path d="M500 217 V333 M442 275 H558" stroke="#e07c52" strokeWidth="7" strokeLinecap="round" /><text x="500" y="278" textAnchor="middle" className="scene-svg-text">{stage.toUpperCase()}</text></g> }
function CompressionMechanism() { return <g className="compression-mechanism"><path d="M390 190 V245 M610 190 V245" stroke="#d8dcd4" strokeWidth="18" /><rect x="440" y="250" width="120" height="90" fill="#171d1b" stroke="#d65b46" strokeWidth="4" /><rect className="die-fill" x="460" y="290" width="80" height="35" rx="8" fill="#dca05c" /><path className="punch" d="M460 190 H540 V285 H460 Z" fill="#e5e7df" stroke="#29302d" strokeWidth="4" /><path d="M500 325 V375" stroke="#dca05c" strokeWidth="9" /><circle cx="500" cy="382" r="14" fill="#dca05c" /><text x="500" y="145" textAnchor="middle" className="scene-svg-text">COMPRESSION CYCLE</text></g> }
function PackingMechanism() { return <g className="packing-mechanism"><path d="M360 230 H640 V350 H360 Z" fill="#d7ded4" stroke="#27312c" strokeWidth="4" /><path d="M380 250 H620 V330 H380 Z" fill="#f1f2ec" stroke="#9fa9a0" />{[410,465,520,575].map((x) => <circle key={x} cx={x} cy="290" r="20" fill="#d65943" className="cavity" />)}<path className="foil" d="M350 205 H650 V230 H350 Z" fill="#b4bbb3" /><text x="500" y="180" textAnchor="middle" className="scene-svg-text">FILL / SEAL / EXIT</text></g> }

function Experiment({ twin }: { twin: ReturnType<typeof useDigitalTwin> }) {
  const whatIf = useWhatIf()
  const [show, setShow] = useState(false)
  const selected = twin.factoryState.machines.find((machine) => machine.id === whatIf.form.machineId)
  const baseline = selected?.capacityPerMinute ?? 80
  const value = whatIf.form.scenarioType === 'capacity' ? Number(whatIf.form.newCapacity) || baseline : Number(whatIf.form.downtimeDuration) || 5
  const run = () => { setShow(true); whatIf.runScenarioAction(twin.factoryState, twin.liveHistory) }
  return <section className={`experiment-section ${show && whatIf.result ? 'experiment-active' : ''}`} id="what-if"><div className="section-rail"><span>WHAT—IF / AN INTERACTIVE EXPERIMENT</span><span>CHANGE THE LINE / SEE THE CONSEQUENCE</span></div><div className="experiment-layout"><div className="experiment-title"><p className="micro-label">THE DIGITAL TWIN RESPONDS</p><h2>What if<br /><em>we change<br />the rhythm?</em></h2><p>Move one variable. The line will show you what happens next.</p></div><div className="experiment-controls"><label>MACHINE<select value={whatIf.form.machineId} onChange={(event) => whatIf.setMachineId(event.target.value as MachineId)}>{twin.factoryState.machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.id} / {machine.stage}</option>)}</select></label><div className="mode-toggle"><button className={whatIf.form.scenarioType === 'capacity' ? 'active' : ''} onClick={() => whatIf.setScenarioType('capacity')}>CAPACITY</button><button className={whatIf.form.scenarioType === 'downtime' ? 'active' : ''} onClick={() => whatIf.setScenarioType('downtime')}>DOWNTIME</button></div><label className="range-label"><span>{whatIf.form.scenarioType === 'capacity' ? 'CAPACITY' : 'DURATION'} <b>{value} {whatIf.form.scenarioType === 'capacity' ? 'UNITS/MIN' : 'MIN'}</b></span><input type="range" min={whatIf.form.scenarioType === 'capacity' ? 20 : 1} max={whatIf.form.scenarioType === 'capacity' ? 140 : 15} step={1} value={value} onChange={(event) => whatIf.form.scenarioType === 'capacity' ? whatIf.setNewCapacity(event.target.value) : whatIf.setDowntimeDuration(event.target.value)} /></label><button className="experiment-run" onClick={run} disabled={whatIf.isRunning}>RUN EXPERIMENT <span>→</span></button>{whatIf.error && <p className="error-line">{whatIf.error}</p>}</div></div>{whatIf.result && <ExperimentResult result={whatIf.result} />}</section>
}
function ExperimentResult({ result }: { result: ScenarioResult }) { const delta = result.delta; return <div className="experiment-result"><div className="result-flow"><span>NORMAL FLOW</span><i /><span className={delta.throughput < 0 ? 'result-negative' : 'result-positive'}>{delta.throughput < 0 ? 'FLOW REDUCED' : 'FLOW IMPROVED'}</span><i /><span>{delta.bottleneckChanged ? 'CONSTRAINT MOVED' : 'LINE HOLDS'}</span></div><div className="result-numbers"><div><b>{delta.production > 0 ? '+' : ''}{delta.production.toFixed(0)}</b><span>TABLETS / WINDOW</span></div><div><b>{delta.throughput > 0 ? '+' : ''}{delta.throughput.toFixed(0)}</b><span>THROUGHPUT / MIN</span></div><div><b>{delta.wip > 0 ? '+' : ''}{delta.wip.toFixed(0)}</b><span>WIP CHANGE</span></div></div></div> }
