import type { FactoryState } from '../digitalTwin/types'
import type { FactoryAnalysis } from '../digitalTwin/bottleneckEngine'

interface Props {
  factoryState: FactoryState
  analysis: FactoryAnalysis
  selectedId: string
  onSelect: (id: string) => void
}

export function ProductionLine({ factoryState, analysis, selectedId, onSelect }: Props) {
  const bottleneckId = analysis.line.bottleneck?.machineId
  return (
    <div className="stage-rail-wrap">
      <div className="stage-rail-line" />
      <div className="stage-rail">
        <button className={`stage-node source-node ${selectedId === 'SOURCE' ? 'selected' : ''}`} onClick={() => onSelect('SOURCE')}>
          <span className="node-mark">IN</span><span className="node-label">RAW MATERIAL</span>
        </button>
        {factoryState.machines.map((machine, index) => {
          const buffer = factoryState.buffers[index]
          const isSelected = machine.id === selectedId
          const isBottleneck = machine.id === bottleneckId
          return (
            <div className="stage-rail-segment" key={machine.id}>
              <button className={`stage-node ${isSelected ? 'selected' : ''} ${isBottleneck ? 'constraint' : ''}`} onClick={() => onSelect(machine.id)}>
                <span className="node-index">0{index + 1}</span><span className="node-id">{machine.id}</span><span className="node-label">{machine.stage.toUpperCase()}</span>
                <span className={`node-state state-${machine.status.toLowerCase()}`}><i />{machine.status}</span>
              </button>
              {buffer && <div className="rail-buffer"><span>{buffer.id}</span><b style={{ height: `${Math.round((buffer.quantity / buffer.maxCapacity) * 100)}%` }} /></div>}
            </div>
          )
        })}
        <div className="stage-node sink-node"><span className="node-mark">OUT</span><span className="node-label">FINISHED TABLETS</span></div>
      </div>
    </div>
  )
}
