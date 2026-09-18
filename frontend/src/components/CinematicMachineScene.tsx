import { useState } from 'react'
import type { Machine } from '../digitalTwin/types'
import type { MachineBottleneckResult } from '../digitalTwin/bottleneckEngine'

interface Props {
  machine: Machine
  bottleneck?: MachineBottleneckResult
  onPrevious: () => void
  onNext: () => void
}

const stageCopy: Record<string, { eyebrow: string; title: string; description: string; verb: string }> = {
  Mixing: { eyebrow: '01 / MATERIAL PREP', title: 'Powder mixing vessel', description: 'Dry ingredients are dosed into the vessel and homogenised by the internal impeller.', verb: 'MIXING' },
  Granulation: { eyebrow: '02 / PARTICLE FORMATION', title: 'Wet granulation chamber', description: 'Fine powder aggregates into consistent granules before the next hand-off.', verb: 'GRANULATING' },
  Compression: { eyebrow: '03 / TABLET FORMATION', title: 'Rotary tablet press', description: 'A measured charge enters the die, is compressed, then ejected as a finished tablet.', verb: 'COMPRESSING' },
  Coating: { eyebrow: '04 / SURFACE FINISH', title: 'Film coating pan', description: 'Tablets tumble through a controlled spray zone while the surface finish builds.', verb: 'COATING' },
  Inspection: { eyebrow: '05 / QUALITY GATE', title: 'Vision inspection cell', description: 'A scanning head checks the stream while accepted product continues downstream.', verb: 'INSPECTING' },
  Packing: { eyebrow: '06 / FINAL PACK', title: 'Blister packing cell', description: 'Tablets drop into indexed cavities, then foil is aligned, pressed, and sealed.', verb: 'PACKING' },
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }

export function CinematicMachineScene({ machine, bottleneck, onPrevious, onNext }: Props) {
  const [camera, setCamera] = useState(0)
  const info = stageCopy[machine.stage] ?? stageCopy.Mixing
  const flow = clamp(machine.outputRate / Math.max(machine.capacityPerMinute, 1), 0.12, 1)
  const speed = `${(1.8 - flow * 1.15).toFixed(2)}s`
  const particles = Array.from({ length: 16 }, (_, index) => index)

  return (
    <section className="cinema-panel" aria-label={`${machine.name} cinematic process view`}>
      <div className="cinema-toolbar">
        <div>
          <p className="kicker">{info.eyebrow}</p>
          <h1>{info.title}</h1>
        </div>
        <div className="camera-controls">
          <button onClick={() => setCamera((value) => (value + 2) % 3)} aria-label="Previous camera angle">←</button>
          <span>CAM 0{camera + 1} / 03</span>
          <button onClick={() => setCamera((value) => (value + 1) % 3)} aria-label="Next camera angle">→</button>
        </div>
      </div>

      <div className={`machine-viewport stage-${machine.stage.toLowerCase()} camera-${camera}`} style={{ '--machine-speed': speed, '--flow': flow } as React.CSSProperties}>
        <div className="viewport-grid" />
        <div className="viewport-readout"><span className="live-dot" /> LIVE PROCESS FEED <span>RATE {machine.outputRate.toFixed(0)} / MIN</span></div>
        <svg className="machine-svg" viewBox="0 0 920 470" role="img" aria-label={`${machine.stage} machinery with material flow`}>
          <defs>
            <linearGradient id="steel" x1="0" x2="1"><stop stopColor="#26323a"/><stop offset=".48" stopColor="#80909a"/><stop offset="1" stopColor="#1b252c"/></linearGradient>
            <linearGradient id="copper" x1="0" x2="1"><stop stopColor="#6d3525"/><stop offset=".5" stopColor="#d88746"/><stop offset="1" stopColor="#4f241a"/></linearGradient>
            <radialGradient id="glow"><stop stopColor="#f4b860" stopOpacity=".7"/><stop offset="1" stopColor="#f4b860" stopOpacity="0"/></radialGradient>
          </defs>
          <path className="conveyor" d="M30 382 H890" />
          <path className="conveyor-inner" d="M30 382 H890" />
          {particles.map((particle) => <circle key={particle} className="material-particle" cx={80 + particle * 48} cy={370 - (particle % 3) * 6} r={particle % 4 === 0 ? 5 : 3} style={{ animationDelay: `${particle * -0.18}s` }} />)}
          <g className="machine-body">
            <rect x="245" y="112" width="430" height="230" rx="26" fill="url(#steel)" stroke="#bac6ca" strokeOpacity=".45" />
            <rect x="263" y="130" width="394" height="194" rx="18" fill="#10191e" stroke="#0b1115" strokeWidth="8" />
            <path className="machine-highlight" d="M280 147 H640" />
            <circle className="machine-glow" cx="460" cy="235" r="120" fill="url(#glow)" />
            <g className="mechanism">
              <circle cx="460" cy="238" r="75" fill="#17242a" stroke="#d18a4b" strokeWidth="4" />
              <path d="M460 238 L460 170 M460 238 L520 280 M460 238 L400 280" stroke="#e5b06b" strokeWidth="12" strokeLinecap="round" />
              <circle cx="460" cy="238" r="14" fill="#e5b06b" />
            </g>
            <g className="stage-specific">
              <path d="M384 96 L384 35 H536 L536 96" fill="none" stroke="#81949b" strokeWidth="18" />
              <path d="M420 35 V12 H500 V35" fill="#2e3e45" stroke="#a8b8ba" strokeWidth="3" />
              <path d="M350 342 V395 H570 V342" fill="none" stroke="#c87841" strokeWidth="10" />
              <circle cx="350" cy="395" r="8" fill="#f4b860" /><circle cx="570" cy="395" r="8" fill="#f4b860" />
            </g>
          </g>
          <g className="stage-labels">
            <rect x="52" y="70" width="156" height="42" rx="5" fill="#0c1418" stroke="#34434a" />
            <text x="68" y="88" className="svg-label">MATERIAL IN</text><text x="68" y="103" className="svg-value">{machine.queue.toFixed(0)} UNITS QUEUED</text>
            <path d="M208 92 H360" className="leader" />
            <rect x="670" y="70" width="196" height="42" rx="5" fill="#0c1418" stroke="#34434a" />
            <text x="686" y="88" className="svg-label">OUTPUT HAND-OFF</text><text x="686" y="103" className="svg-value">{machine.outputRate.toFixed(0)} UNITS / MIN</text>
            <path d="M670 92 H610" className="leader" />
          </g>
          <g className="status-stamp"><rect x="34" y="420" width="160" height="28" rx="4" /><text x="48" y="439">{bottleneck ? 'CONSTRAINT SIGNAL' : info.verb}</text></g>
        </svg>
        <div className="viewport-caption"><span>CAMERA FOLLOWS MATERIAL</span><span>UTILISATION <strong>{Math.round(machine.utilization * 100)}%</strong></span></div>
      </div>

      <div className="cinema-footer">
        <button className="stage-nav" onClick={onPrevious}>← PREVIOUS STAGE</button>
        <div className="process-description"><span className="machine-id">{machine.id}</span><span>{info.description}</span></div>
        <button className="stage-nav" onClick={onNext}>NEXT STAGE →</button>
      </div>
    </section>
  )
}
