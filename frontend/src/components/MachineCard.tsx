import { useEffect, useRef } from 'react'
import type { Machine } from '../digitalTwin/types'
import type { MachineBottleneckResult } from '../digitalTwin/bottleneckEngine'
import { StatusBadge } from './StatusBadge'

interface Props {
  machine: Machine
  bottleneckResult?: MachineBottleneckResult
  isBottleneck: boolean
}

const STAGE_ICONS: Record<string, string> = {
  Mixing: '⚗️',
  Granulation: '🔩',
  Compression: '🔨',
  Coating: '🎨',
  Inspection: '🔬',
  Packing: '📦',
}

export function MachineCard({ machine, isBottleneck }: Props) {
  const utilPct = Math.round(machine.utilization * 100)
  const cardRef = useRef<HTMLDivElement>(null)
  const prevStatusRef = useRef(machine.status)

  // Animate fault transitions
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    if (prevStatusRef.current !== machine.status) {
      el.animate(
        [
          { opacity: 0.4, transform: 'scale(0.97)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 300, easing: 'ease-out' },
      )
      prevStatusRef.current = machine.status
    }
  }, [machine.status])

  const borderColor =
    machine.status === 'DOWN'
      ? 'border-red-500/60'
      : isBottleneck
        ? 'border-violet-500/70'
        : machine.status === 'RUNNING'
          ? 'border-emerald-500/30'
          : machine.status === 'STARVED'
            ? 'border-amber-500/40'
            : machine.status === 'BLOCKED'
              ? 'border-orange-500/40'
              : 'border-slate-700/60'

  const glowClass =
    isBottleneck
      ? 'shadow-[0_0_20px_rgba(139,92,246,0.3)]'
      : machine.status === 'DOWN'
        ? 'shadow-[0_0_16px_rgba(239,68,68,0.25)]'
        : ''

  const icon = STAGE_ICONS[machine.stage] ?? '⚙️'

  return (
    <div
      ref={cardRef}
      className={`relative flex flex-col gap-2 rounded-xl border bg-slate-900/80 backdrop-blur-sm p-3 w-[148px] shrink-0 transition-all duration-500 ${borderColor} ${glowClass}`}
    >
      {/* Bottleneck pulse ring */}
      {isBottleneck && (
        <span className="absolute inset-0 rounded-xl border-2 border-violet-500/50 animate-ping pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-xs font-bold text-slate-100 tracking-tight leading-tight">
            {machine.id}
          </span>
        </div>
        <StatusBadge status={machine.status} />
      </div>

      <div className="text-[10px] text-slate-400 font-medium leading-none truncate">
        {machine.name}
      </div>

      {/* Utilisation bar */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">Util</span>
          <span className="text-[10px] font-mono font-semibold text-slate-300">
            {utilPct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              utilPct >= 90
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                : utilPct >= 60
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  : 'bg-slate-600'
            }`}
            style={{ width: `${utilPct}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <div>
          <div className="text-[8px] text-slate-500 uppercase tracking-wider">Output</div>
          <div className="text-[11px] font-mono font-semibold text-slate-200">
            {machine.outputRate.toFixed(0)}<span className="text-[8px] text-slate-500">/min</span>
          </div>
        </div>
        <div>
          <div className="text-[8px] text-slate-500 uppercase tracking-wider">Queue</div>
          <div className="text-[11px] font-mono font-semibold text-slate-200">
            {machine.queue}
          </div>
        </div>
        {machine.downtimeRemaining > 0 && (
          <div className="col-span-2 mt-0.5">
            <div className="text-[8px] text-red-400 uppercase tracking-wider">Downtime</div>
            <div className="text-[11px] font-mono font-semibold text-red-300">
              {machine.downtimeRemaining}min left
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
