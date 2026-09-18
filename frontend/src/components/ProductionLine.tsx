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
    <div className="w-full overflow-x-auto bg-[#F7F7F7] border-t border-[#E5E5E5]">
      <div className="flex items-center min-w-max px-5 py-5 gap-0">

        {/* Raw Material source */}
        <div className="flex flex-col items-center gap-0.5 mr-1">
          <div className="rounded border border-[#E5E5E5] bg-white px-2.5 py-2 text-center shadow-sm">
            <div className="text-[8px] text-[#666666] uppercase tracking-widest leading-none">Source</div>
            <div className="text-[10px] font-bold text-[#1F1F1F] mt-0.5">RAW</div>
            <div className="text-[9px] text-[#666666]">MATERIAL</div>
          </div>
          {/* exit arrow */}
          <div className="flex items-center mt-1">
            <div className="w-3 h-px bg-[#E5E5E5]" />
            <svg className="h-2.5 w-2.5 text-[#A3A3A3]" viewBox="0 0 10 10" fill="currentColor">
              <path d="M3 1l5 4-5 4V1z" />
            </svg>
          </div>
        </div>

        {/* Machines + buffers */}
        {factoryState.machines.map((machine, idx) => {
          const buffer = factoryState.buffers[idx]
          const bottleneckResult = analysis.machines.find((r) => r.machineId === machine.id)
          return (
            <div key={machine.id} className="flex items-center">
              <MachineCard
                machine={machine}
                bottleneckResult={bottleneckResult}
                isBottleneck={machine.id === bottleneckId}
              />
              {buffer && <BufferIndicator buffer={buffer} />}
            </div>
          )
        })}

        {/* Finished Tablets sink */}
        <div className="flex flex-col items-center gap-0.5 ml-1">
          <div className="flex items-center">
            <div className="w-3 h-px bg-[#E5E5E5]" />
          </div>
          <div className="rounded border border-[#E5E5E5] bg-white px-2.5 py-2 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#C62828]" />
            <div className="text-[8px] text-[#666666] uppercase tracking-widest leading-none mt-1">Output</div>
            <div className="text-[10px] font-bold text-[#1F1F1F] mt-0.5">FINISHED</div>
            <div className="text-[9px] text-[#C62828]">TABLETS</div>
          </div>
        </div>

      </div>
    </div>
  )
}
