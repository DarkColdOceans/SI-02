interface Props {
  simulationTime: number
  isRunning: boolean
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `T+${m}m`
  return `T+${h}h ${m}m`
}

export function Header({ simulationTime, isRunning }: Props) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
      {/* Left: brand */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-black text-sm shadow-lg shadow-blue-900/40">
          DT
        </div>
        <div>
          <div className="text-sm font-bold text-slate-100 tracking-tight leading-none">
            Tablet Manufacturing
          </div>
          <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold">
            Digital Twin
          </div>
        </div>
      </div>

      {/* Centre: sim time clock */}
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-1.5">
        <div className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-xs font-mono font-semibold text-slate-300">
          {formatTime(simulationTime)}
        </span>
        <span className="text-[9px] text-slate-600 uppercase tracking-widest">
          {isRunning ? 'LIVE' : 'PAUSED'}
        </span>
      </div>

      {/* Right: status chips */}
      <div className="flex items-center gap-2">
        <div className="text-[9px] uppercase tracking-widest text-slate-600 hidden md:block">
          6 machines · 5 buffers
        </div>
        <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
          isRunning
            ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-400'
            : 'border-slate-700 bg-slate-900 text-slate-500'
        }`}>
          {isRunning ? '● Live' : '○ Idle'}
        </div>
      </div>
    </header>
  )
}
