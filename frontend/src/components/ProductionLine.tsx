import type { FactoryState } from '../digitalTwin/types'
import type { FactoryAnalysis } from '../digitalTwin/bottleneckEngine'
import { MachineCard } from './MachineCard'
import { BufferIndicator } from './BufferIndicator'

interface Props {
  factoryState: FactoryState
  analysis: FactoryAnalysis
}

export function ProductionLine({ factoryState, analysis }: Props) {
  const bottleneckId = analysis.line.bottleneck?.machineId

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center justify-start gap-0 min-w-max px-4 py-2">

        {/* Raw Material source node */}
        <div className="flex flex-col items-center gap-1 mr-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Source</div>
            <div className="text-[11px] font-bold text-slate-300">RAW</div>
            <div className="text-[10px] text-slate-400">MATERIAL</div>
          </div>
          {/* exit arrow */}
          <div className="flex items-center mt-1">
            <div className="h-px w-4 bg-slate-700" />
            <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4 2l6 4-6 4V2z" />
            </svg>
          </div>
        </div>

        {/* Machines interleaved with buffers */}
        {factoryState.machines.map((machine, idx) => {
          const buffer = factoryState.buffers[idx] // buffer AFTER this machine
          const bottleneckResult = analysis.machines.find((r) => r.machineId === machine.id)
          return (
            <div key={machine.id} className="flex items-center">
              <MachineCard
                machine={machine}
                bottleneckResult={bottleneckResult}
                isBottleneck={machine.id === bottleneckId}
              />
              {buffer && (
                <BufferIndicator buffer={buffer} />
              )}
            </div>
          )
        })}

        {/* Finished Tablets sink node */}
        <div className="flex flex-col items-center gap-1 ml-2">
          <div className="flex items-center mb-1">
            <div className="h-px w-4 bg-slate-700" />
            <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4 2l6 4-6 4V2z" />
            </svg>
          </div>
          <div className="rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-3 py-2 text-center">
            <div className="text-[9px] text-emerald-500 uppercase tracking-widest mb-0.5">Output</div>
            <div className="text-[11px] font-bold text-emerald-300">FINISHED</div>
            <div className="text-[10px] text-emerald-400">TABLETS</div>
          </div>
        </div>

      </div>
    </div>
  )
}
