import type { MachineStatus } from '../digitalTwin/types'

interface Props {
  status: MachineStatus
}

/**
 * Semantic color system (Light Theme adapted):
 *   RUNNING   → green
 *   IDLE      → amber/yellow
 *   STARVED   → blue
 *   BLOCKED   → orange
 *   DOWN      → red
 *   BOTTLENECK → deep red (stronger than normal statuses)
 */
const STATUS_CONFIG: Record<
  MachineStatus,
  { label: string; bg: string; text: string; dotClass: string }
> = {
  RUNNING: {
    label: 'RUNNING',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dotClass: 'bg-emerald-500 animate-dot-slow',
  },
  IDLE: {
    label: 'IDLE',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  STARVED: {
    label: 'STARVED',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dotClass: 'bg-blue-500 animate-dot-slow',
  },
  BLOCKED: {
    label: 'BLOCKED',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dotClass: 'bg-orange-500 animate-dot-slow',
  },
  DOWN: {
    label: 'DOWN',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dotClass: 'bg-red-500 animate-dot-slow',
  },
  BOTTLENECK: {
    label: 'BOTTLENECK',
    bg: 'bg-red-50 border border-red-200',
    text: 'text-[#C62828]',
    dotClass: 'bg-[#C62828] animate-dot-slow',
  },
}

export function StatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  )
}
