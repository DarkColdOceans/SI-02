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
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 flex flex-col gap-4 shadow-sm">

      {/* Section title */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
        <div className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-[#D4D4D4]'}`} />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#666666]">
          Simulation Controls
        </h3>
        <span className="ml-auto text-[9px] font-mono text-[#A3A3A3]">1 s = 1 sim-min</span>
      </div>

      {/* Run / Pause / Reset */}
      <div className="flex gap-2">
        <button
          onClick={onStart}
          disabled={isRunning}
          className="flex-1 rounded border border-transparent bg-[#C62828] py-2 text-xs font-bold text-white uppercase tracking-wider transition-colors hover:bg-[#8E1B1B] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          ▶ Start
        </button>
        <button
          onClick={onPause}
          disabled={!isRunning}
          className="flex-1 rounded border border-[#C62828] bg-white py-2 text-xs font-bold text-[#C62828] uppercase tracking-wider transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-white"
        >
          ⏸ Pause
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded border border-[#E5E5E5] bg-[#F7F7F7] py-2 text-xs font-bold text-[#666666] uppercase tracking-wider transition-colors hover:bg-[#E5E5E5]"
        >
          ↺ Reset
        </button>
      </div>

      {/* Fault injection */}
      <div>
        <div className="text-[8px] uppercase tracking-widest text-[#666666] font-semibold mb-2">
          Fault Injection
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onInjectM4Downtime}
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 text-left transition-colors hover:bg-red-100 hover:border-red-300 shadow-sm"
          >
            M4 Coating — 5 min downtime
          </button>
          <button
            onClick={onInjectM5Slowdown}
            className="rounded border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 text-left transition-colors hover:bg-orange-100 hover:border-orange-300 shadow-sm"
          >
            M5 Inspection — 40% slowdown
          </button>
          <button
            onClick={onClearFaults}
            className="rounded border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-2 text-xs font-semibold text-[#666666] text-left transition-colors hover:bg-[#E5E5E5]"
          >
            Clear / Reset Faults
          </button>
        </div>
      </div>
    </div>
  )
}
