import type { LineBuffer } from '../digitalTwin/types'

interface Props {
  buffer: LineBuffer
}

export function BufferIndicator({ buffer }: Props) {
  const pct = buffer.maxCapacity > 0 ? buffer.quantity / buffer.maxCapacity : 0
  const fillPct = Math.round(pct * 100)

  const barColor =
    pct < 0.5
      ? 'bg-cyan-500'
      : pct < 0.8
        ? 'bg-amber-500'
        : 'bg-red-500'

  return (
    <div className="flex flex-col items-center gap-1.5 px-1">
      {/* Arrow connector */}
      <div className="flex items-center gap-0.5 text-slate-600">
        <div className="h-px w-6 bg-slate-700" />
        <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12" fill="currentColor">
          <path d="M4 2l6 4-6 4V2z" />
        </svg>
      </div>

      {/* Buffer pill */}
      <div className="relative flex flex-col items-center">
        <div className="mb-0.5 text-[9px] font-mono text-slate-500 tracking-wider">
          {buffer.id}
        </div>
        <div className="h-14 w-5 rounded-sm border border-slate-700 bg-slate-900/60 overflow-hidden flex flex-col justify-end">
          <div
            className={`w-full transition-all duration-700 ${barColor}`}
            style={{ height: `${fillPct}%` }}
          />
        </div>
        <div className="mt-0.5 text-[9px] font-mono text-slate-400">
          {buffer.quantity}
        </div>
      </div>

      {/* Second arrow */}
      <div className="flex items-center gap-0.5 text-slate-600">
        <div className="h-px w-6 bg-slate-700" />
        <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12" fill="currentColor">
          <path d="M4 2l6 4-6 4V2z" />
        </svg>
      </div>
    </div>
  )
}
