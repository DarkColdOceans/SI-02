/**
 * BufferCapacityEditor.tsx — Editor for buffer capacity mutations.
 */

import type { BufferCapacityMutation } from '../../digitalTwin/scenarioTypes'
import { BOUNDS } from '../../digitalTwin/scenarioTypes'
import type { BufferId } from '../../digitalTwin/types'
import { getBaselineBufferCapacity, BUFFER_SPECS } from '../../hooks/useScenario'
import { ScenarioSlider } from './ScenarioSlider'

interface Props {
  mutation: BufferCapacityMutation
  onChange: (mutation: BufferCapacityMutation) => void
}

export function BufferCapacityEditor({ mutation, onChange }: Props) {
  const baseline = getBaselineBufferCapacity(mutation.bufferId)
  const spec = BUFFER_SPECS.find((s) => s.id === mutation.bufferId)

  return (
    <div className="flex flex-col gap-2">
      {/* Buffer selector */}
      <div className="flex flex-wrap gap-1">
        {BUFFER_SPECS.map((s) => (
          <button
            key={s.id}
            onClick={() =>
              onChange({
                ...mutation,
                bufferId: s.id as BufferId,
                maxCapacity: getBaselineBufferCapacity(s.id as BufferId),
              })
            }
            className={`rounded border px-2 py-1 text-[10px] font-mono font-semibold transition-colors ${
              mutation.bufferId === s.id
                ? 'border-[#C62828] bg-red-50 text-[#C62828]'
                : 'border-[#E5E5E5] bg-white text-[#666666] hover:border-[#D4D4D4]'
            }`}
          >
            {s.id}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="text-[8px] text-[#A3A3A3]">
        {spec ? `${spec.sourceMachine} → ${spec.destinationMachine}` : ''} • Baseline: {baseline} units
      </div>

      {/* Capacity slider */}
      <ScenarioSlider
        id={`buffer-${mutation.bufferId}`}
        label="Max Capacity"
        min={BOUNDS.bufferCapacity.min}
        max={BOUNDS.bufferCapacity.max}
        step={BOUNDS.bufferCapacity.step}
        value={mutation.maxCapacity}
        displayValue={`${mutation.maxCapacity} units`}
        onChange={(v) => onChange({ ...mutation, maxCapacity: v })}
      />
    </div>
  )
}
