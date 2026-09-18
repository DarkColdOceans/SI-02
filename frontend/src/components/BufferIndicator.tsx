import type { LineBuffer } from '../digitalTwin/types'

interface Props {
  buffer: LineBuffer
}

export function BufferIndicator({ buffer }: Props) {
  const pct = buffer.maxCapacity > 0 ? buffer.quantity / buffer.maxCapacity : 0
  const fillPct = Math.round(pct * 100)

  // Fill colour: semantic ramp — gray → amber → red
  const fillColor =
    pct < 0.5 ? 'bg-[#D4D4D4]'
    : pct < 0.8 ? 'bg-amber-400'
    : 'bg-[#C62828]'

  // Border highlight when near-full
  const tankBorder = pct >= 0.8 ? 'border-[#C62828]' : 'border-[#E5E5E5]'

  // Subtle shimmer animation when at/near-full (≥80 %) and potentially causing blocking
  const warnAnim = pct >= 0.8 ? 'animate-buffer-warn' : ''

  return (
    <div className="flex items-center gap-0 self-center">
      {/* line in */}
      <div className="w-4 h-px bg-[#E5E5E5]" />

      {/* buffer column */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[8px] font-mono text-[#A3A3A3] tracking-wider leading-none">
          {buffer.id}
        </span>
        {/* vertical tank */}
        <div
          className={`w-4 h-12 rounded-sm border ${tankBorder} bg-[#F7F7F7] overflow-hidden flex flex-col justify-end status-transition shadow-inner`}
        >
          <div
            className={`w-full transition-all duration-700 ${fillColor} ${warnAnim}`}
            style={{ height: `${fillPct}%` }}
          />
        </div>
        <span className={`text-[8px] font-mono tabular-nums leading-none font-semibold ${pct >= 0.8 ? 'text-[#C62828]' : 'text-[#666666]'}`}>
          {buffer.quantity}
        </span>
      </div>

      {/* arrowhead */}
      <div className="w-4 h-px bg-[#E5E5E5]" />
      <svg
        className={`h-2.5 w-2.5 flex-shrink-0 ${pct >= 0.8 ? 'text-[#C62828]' : 'text-[#D4D4D4]'}`}
        viewBox="0 0 10 10"
        fill="currentColor"
      >
        <path d="M3 1l5 4-5 4V1z" />
      </svg>
    </div>
  )
}
