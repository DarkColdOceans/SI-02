import type { MachineStatus } from '../digitalTwin/types'

interface Props {
  status: MachineStatus
}

const STATUS_CONFIG: Record<MachineStatus, { label: string; classes: string; dot: string }> = {
  RUNNING: {
    label: 'RUNNING',
    classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dot: 'bg-emerald-400 animate-pulse',
  },
  IDLE: {
    label: 'IDLE',
    classes: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    dot: 'bg-slate-500',
  },
  STARVED: {
    label: 'STARVED',
    classes: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dot: 'bg-amber-400 animate-pulse',
  },
  BLOCKED: {
    label: 'BLOCKED',
    classes: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    dot: 'bg-orange-400 animate-pulse',
  },
  DOWN: {
    label: 'DOWN',
    classes: 'bg-red-500/20 text-red-300 border-red-500/40',
    dot: 'bg-red-500 animate-pulse',
  },
  BOTTLENECK: {
    label: 'BOTTLENECK',
    classes: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    dot: 'bg-violet-400 animate-pulse',
  },
}

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
