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
  Mixing: '⚗',
  Granulation: '⬡',
  Compression: '⬛',
  Coating: '◈',
  Inspection: '◎',
  Packing: '▣',
}

/**
 * Status → card border color (semantic system light theme):
 *   RUNNING   → emerald (dim)
 *   IDLE      → amber/yellow (dim)
 *   STARVED   → blue
 *   BLOCKED   → orange
 *   DOWN      → red border + down-pulse glow
 *   BOTTLENECK card → deep red border + bn-pulse glow
 */
function getCardClasses(status: Machine['status'], isBottleneck: boolean): string {
  if (isBottleneck) {
    // Bottleneck takes visual priority — deep red border + pulsing shadow glow
    return 'border-[#C62828] animate-bn-pulse ring-1 ring-[#C62828]/30 z-10'
  }
  if (status === 'DOWN') {
    return 'border-red-600 animate-down-pulse z-10'
  }
  if (status === 'BLOCKED') return 'border-orange-400'
  if (status === 'STARVED') return 'border-blue-300'
  if (status === 'RUNNING') return 'border-emerald-200'
  if (status === 'IDLE') return 'border-amber-200'
  return 'border-[#E5E5E5]'
}

/**
 * Utilization bar color:
 *   ≥95 % → deep red (at/near capacity, high stress)
 *   ≥80 % → emerald (healthy high utilisation)
 *   ≥40 % → gray (moderate)
 *   <40 % → light gray (underused)
 */
function getUtilBarColor(pct: number, isBottleneck: boolean): string {
  if (isBottleneck && pct >= 80) return 'bg-[#C62828]'
  if (pct >= 95) return 'bg-red-500'
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 40) return 'bg-[#A3A3A3]'
  return 'bg-[#D4D4D4]'
}

export function MachineCard({ machine, isBottleneck }: Props) {
  const utilPct = Math.round(machine.utilization * 100)
  const cardRef = useRef<HTMLDivElement>(null)
  const prevStatusRef = useRef(machine.status)

  // Brief fade-scale on status change (keeps it subtle, not jarring)
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    if (prevStatusRef.current !== machine.status) {
      el.animate(
        [
          { opacity: 0.55, transform: 'scale(0.985)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 280, easing: 'ease-out' },
      )
      prevStatusRef.current = machine.status
    }
  }, [machine.status])

  const cardBorderAnim = getCardClasses(machine.status, isBottleneck)
  const utilBarColor = getUtilBarColor(utilPct, isBottleneck)
  const icon = STAGE_ICONS[machine.stage] ?? '◉'
  const stageName = machine.name.replace(/^M\d\s+/, '')

  return (
    <div
      ref={cardRef}
      className={`relative flex flex-col gap-2.5 rounded-lg border bg-white shadow-sm p-3 w-[140px] shrink-0 status-transition ${cardBorderAnim}`}
    >
      {/* Bottleneck label strip — text label not color alone */}
      {isBottleneck && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-b-md bg-[#C62828] text-[8px] font-bold uppercase tracking-widest text-white leading-none whitespace-nowrap shadow-sm">
          ⚠ BOTTLENECK
        </div>
      )}

      {/* Machine ID + stage name */}
      <div className="flex items-start justify-between gap-1 mt-2">
        <div>
          <div className="text-xs font-bold text-[#1F1F1F] leading-none">{machine.id}</div>
          <div className="text-[10px] text-[#666666] leading-tight mt-0.5">{stageName}</div>
        </div>
        <span className="text-base leading-none text-[#A3A3A3]">{icon}</span>
      </div>

      {/* Status badge */}
      <StatusBadge status={machine.status} />

      {/* Utilization bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-wider text-[#666666]">Utilization</span>
          <span className="text-[10px] font-mono font-semibold text-[#1F1F1F] tabular-nums">{utilPct}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-[#E5E5E5] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${utilBarColor}`}
            style={{ width: `${utilPct}%` }}
          />
        </div>
      </div>

      {/* Output / Queue stats */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        <div>
          <div className="text-[8px] text-[#666666] uppercase tracking-wider">Output</div>
          <div className="text-[11px] font-mono font-semibold text-[#1F1F1F] tabular-nums">
            {machine.outputRate.toFixed(0)}<span className="text-[#A3A3A3] text-[8px]">/m</span>
          </div>
        </div>
        <div>
          <div className="text-[8px] text-[#666666] uppercase tracking-wider">Queue</div>
          <div className="text-[11px] font-mono font-semibold text-[#1F1F1F] tabular-nums">
            {machine.queue}
          </div>
        </div>
      </div>

      {/* Downtime callout */}
      {machine.downtimeRemaining > 0 && (
        <div className="rounded bg-red-50 border border-red-200 px-2 py-1 mt-1">
          <div className="text-[8px] text-red-600 uppercase tracking-wider font-semibold">Downtime</div>
          <div className="text-[10px] font-mono font-bold text-red-700">
            {machine.downtimeRemaining} min left
          </div>
        </div>
      )}
    </div>
  )
}
