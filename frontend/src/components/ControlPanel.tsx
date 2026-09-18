interface Props {
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onInjectM4Downtime: () => void
  onInjectM5Slowdown: () => void
  onClearFaults: () => void
}

export function ControlPanel({
  isRunning,
  onStart,
  onPause,
  onReset,
  onInjectM4Downtime,
  onInjectM5Slowdown,
  onClearFaults,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-5 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
          Simulation Controls
        </h3>
        <span className="ml-auto text-[9px] text-slate-500 font-mono">
          1s real = 1min sim
        </span>
      </div>

      {/* Run controls */}
      <div className="flex gap-2">
        <button
          onClick={onStart}
          disabled={isRunning}
          className="flex-1 rounded-lg border border-emerald-600/60 bg-emerald-900/40 px-3 py-2 text-xs font-bold text-emerald-300 uppercase tracking-wider transition-all duration-200 hover:bg-emerald-800/60 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          ▶ Start
        </button>
        <button
          onClick={onPause}
          disabled={!isRunning}
          className="flex-1 rounded-lg border border-amber-600/60 bg-amber-900/40 px-3 py-2 text-xs font-bold text-amber-300 uppercase tracking-wider transition-all duration-200 hover:bg-amber-800/60 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          ⏸ Pause
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-300 uppercase tracking-wider transition-all duration-200 hover:bg-slate-700/60 active:scale-95"
        >
          ↺ Reset
        </button>
      </div>

      {/* Fault injection */}
      <div>
        <div className="mb-2 text-[9px] uppercase tracking-widest text-slate-500 font-medium">
          Fault Injection
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onInjectM4Downtime}
            className="rounded-lg border border-red-700/50 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300 tracking-wide transition-all duration-200 hover:bg-red-900/50 active:scale-95 text-left"
          >
            🔴 M4 Downtime <span className="opacity-60 text-[10px]">— 5 min fault</span>
          </button>
          <button
            onClick={onInjectM5Slowdown}
            className="rounded-lg border border-orange-700/50 bg-orange-950/30 px-3 py-2 text-xs font-semibold text-orange-300 tracking-wide transition-all duration-200 hover:bg-orange-900/50 active:scale-95 text-left"
          >
            🟠 M5 Slowdown <span className="opacity-60 text-[10px]">— 40% capacity</span>
          </button>
          <button
            onClick={onClearFaults}
            className="rounded-lg border border-slate-600/60 bg-slate-800/40 px-3 py-2 text-xs font-semibold text-slate-400 tracking-wide transition-all duration-200 hover:bg-slate-700/50 active:scale-95 text-left"
          >
            ✓ Clear / Reset Faults
          </button>
        </div>
      </div>
    </div>
  )
}
