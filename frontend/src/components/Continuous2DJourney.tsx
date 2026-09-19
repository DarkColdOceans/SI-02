import { useMemo } from 'react'
import type { FactoryState, MachineId } from '../digitalTwin/types'

interface Props { state: FactoryState; activeId: MachineId; started: boolean; onStage: (id: MachineId) => void }
const stages: Array<{ id: MachineId; verb: string; material: string; x: number }> = [
  { id: 'M1', verb: 'MIX', material: 'POWDER', x: 130 }, { id: 'M2', verb: 'CLUMP', material: 'GRANULES', x: 295 },
  { id: 'M3', verb: 'PRESS', material: 'TABLET', x: 460 }, { id: 'M4', verb: 'SPRAY', material: 'COATED', x: 625 },
  { id: 'M5', verb: 'SCAN', material: 'CHECKED', x: 790 }, { id: 'M6', verb: 'SEAL', material: 'PACKED', x: 955 },
]
export function Continuous2DJourney({ state, activeId, started, onStage }: Props) {
  const machines = useMemo(() => stages.map((stage) => ({ ...stage, machine: state.machines.find((m) => m.id === stage.id)! })), [state.machines])
  const time = state.simulationTime
  const throughput = Math.max(0, state.throughput)
  const progress = started ? (time % 18) / 18 : 0
  const activeIndex = Math.min(5, Math.floor(progress * 6))
  const productX = 70 + progress * 960
  const productKind = activeIndex < 1 ? 'powder' : activeIndex < 2 ? 'granules' : activeIndex < 3 ? 'tablet' : activeIndex < 5 ? 'coated' : 'pack'
  return <div className="motion-film" style={{ '--product-x': `${productX}px`, '--motion-rate': `${Math.max(.25, throughput / 80)}` } as React.CSSProperties}>
    <svg viewBox="0 0 1100 520" role="img" aria-label="Continuous tablet manufacturing animation" className="motion-svg">
      <defs><linearGradient id="film-paper" x1="0" x2="1"><stop stopColor="#f0f0eb"/><stop offset="1" stopColor="#e4e5de"/></linearGradient><linearGradient id="film-red" x1="0" x2="1"><stop stopColor="#d94e3e"/><stop offset="1" stopColor="#a9332c"/></linearGradient><filter id="soft-shadow"><feGaussianBlur stdDeviation="5" /></filter></defs>
      <rect width="1100" height="520" fill="url(#film-paper)" />
      <path d="M48 386 H1050" stroke="#9da29a" strokeWidth="2" /><path d="M48 398 H1050" stroke="#d3d5cd" strokeWidth="1" />
      {machines.map(({ id, x, verb, material }) => <g key={id} className={`film-chapter ${activeId === id ? 'film-chapter-active' : ''}`} onClick={() => onStage(id)}>
        <line x1={x} x2={x} y1="102" y2="380" stroke="#d0d2ca" strokeDasharray="3 8" /><circle cx={x} cy="78" r="17" fill={activeId === id ? '#d94e3e' : '#222824'} /><text x={x} y="82" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="DM Mono">{id}</text><text x={x} y="125" textAnchor="middle" className="film-verb">{verb}</text><text x={x} y="145" textAnchor="middle" className="film-material">{material}</text>
        <g transform={`translate(${x - 54} 205)`} className={`film-object film-${id.toLowerCase()}`}><ellipse cx="54" cy="176" rx="55" ry="8" fill="#222824" opacity=".14" filter="url(#soft-shadow)" />{id === 'M1' && <><circle cx="54" cy="75" r="57" fill="#f8f8f3" stroke="#222824" strokeWidth="3" /><path className="film-blade" d="M54 20 V130 M0 75 H108" stroke="#d94e3e" strokeWidth="5" /><circle cx="54" cy="75" r="8" fill="#222824" /></>}{id === 'M2' && <><rect x="5" y="30" width="98" height="90" rx="45" fill="#f8f8f3" stroke="#222824" strokeWidth="3" /><circle cx="30" cy="75" r="10" fill="#d94e3e" /><circle cx="54" cy="62" r="14" fill="#c77b4d" /><circle cx="78" cy="82" r="12" fill="#d94e3e" /></>}{id === 'M3' && <><path d="M22 30 H86 L76 67 H32 Z" fill="#f8f8f3" stroke="#222824" strokeWidth="3" /><rect x="35" y="107" width="38" height="18" rx="3" fill="#d94e3e" /><rect className="film-punch" x="43" y="55" width="22" height="54" fill="#222824" /></>}{id === 'M4' && <><circle className="film-pan" cx="54" cy="78" r="52" fill="#f8f8f3" stroke="#222824" strokeWidth="3" /><circle cx="28" cy="58" r="5" fill="#d94e3e" /><circle cx="75" cy="94" r="5" fill="#d94e3e" /><path d="M35 20 L28 2 M54 18 V0 M73 20 L81 3" stroke="#d94e3e" strokeWidth="4" /></>}{id === 'M5' && <><rect x="8" y="30" width="92" height="90" rx="6" fill="#f8f8f3" stroke="#222824" strokeWidth="3" /><path className="film-scan" d="M25 30 V120" stroke="#d94e3e" strokeWidth="5" /><rect x="43" y="66" width="24" height="16" rx="8" fill="#d94e3e" /></>}{id === 'M6' && <><rect x="5" y="52" width="98" height="55" fill="#f8f8f3" stroke="#222824" strokeWidth="3" />{[25,54,83].map((cx) => <circle key={cx} cx={cx} cy="80" r="11" fill="#d94e3e" />)}<path className="film-foil" d="M5 42 H103" stroke="#222824" strokeWidth="10" /></>}</g>
      </g>)}
      <path d="M70 386 H1030" stroke="#d94e3e" strokeWidth="2" strokeDasharray="4 10" opacity=".6" />
      <g className={`film-product product-${productKind}`} transform={`translate(${productX} 350)`}><circle r="18" fill={productKind === 'pack' ? '#e6e7df' : productKind === 'tablet' || productKind === 'coated' ? 'url(#film-red)' : '#c77b4d'} stroke="#222824" strokeWidth="2" />{productKind === 'powder' && <><circle cx="-20" cy="-8" r="4" fill="#c77b4d" /><circle cx="24" cy="-10" r="4" fill="#c77b4d" /></>}{productKind === 'granules' && <><circle cx="-8" cy="-10" r="8" fill="#d94e3e" /><circle cx="10" cy="6" r="7" fill="#c77b4d" /></>}{productKind === 'pack' && <path d="M-12 -7 H12 M-12 0 H12 M-12 7 H12" stroke="#222824" strokeWidth="2" />}</g>
    </svg>
    <div className="motion-caption"><span>{started ? `CHAPTER 0${activeIndex + 1} / ${stages[activeIndex]!.verb}` : 'RAW MATERIAL / READY'}</span><strong>{started ? `${productKind.toUpperCase()} IN MOTION` : 'PRESS START TO FOLLOW'}</strong></div>
  </div>
}
