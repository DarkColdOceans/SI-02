interface Props {
  simulationTime: number
  isRunning: boolean
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `T + ${String(m).padStart(2, '0')} min`
  return `T + ${h}h ${String(m).padStart(2, '0')} min`
}

export function Header({ simulationTime, isRunning }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#8E1B1B] bg-[#C62828] text-white">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* Left: brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 h-8 w-8 rounded bg-white flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#C62828]">
              <path d="M10 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v2H2a1 1 0 000 2h1v2a2 2 0 002 2h1v1a1 1 0 002 0v-1h4v1a1 1 0 002 0v-1h1a2 2 0 002-2v-2h1a1 1 0 000-2h-1V6a2 2 0 00-2-2h-4V3a1 1 0 00-1-1z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-white/80 uppercase tracking-[0.2em] leading-none">
              Smart Industry — Digital Twin
            </div>
            <div className="text-sm font-bold text-white leading-tight mt-0.5 truncate">
              Tablet Production Line · Bottleneck Intelligence
            </div>
          </div>
        </div>

        {/* Right: clock + status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2.5 rounded border border-white/20 bg-black/10 px-3 py-1.5">
            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isRunning ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
            <span className="text-xs font-mono font-semibold text-white tabular-nums">
              {formatTime(simulationTime)}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isRunning ? 'text-white' : 'text-white/60'}`}>
              {isRunning ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          <div className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${
            isRunning
              ? 'border-white bg-white text-[#C62828]'
              : 'border-white/20 bg-black/10 text-white/70'
          }`}>
            {isRunning ? '● Live' : '○ Idle'}
          </div>
        </div>

      </div>
    </header>
  )
}
