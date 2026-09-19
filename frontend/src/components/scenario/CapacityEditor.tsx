/**
 * CapacityEditor.tsx — Editor for machine capacity mutations.
 */

import type { CapacityMutation } from '../../digitalTwin/scenarioTypes'
import { BOUNDS } from '../../digitalTwin/scenarioTypes'
import type { MachineId } from '../../digitalTwin/types'
import { getBaselineCapacity, MACHINE_SPECS } from '../../hooks/useScenario'
import { ScenarioSlider } from './ScenarioSlider'

interface Props {
  mutation: CapacityMutation
  onChange: (mutation: CapacityMutation) => void
}

export function CapacityEditor({ mutation, onChange }: Props) {
  const baseline = getBaselineCapacity(mutation.machineId)

  return (
    <div className="flex flex-col gap-2">
      {/* Machine selector */}
      <div className="flex flex-wrap gap-1">
        {MACHINE_SPECS.map((spec) => (
          <button
            key={spec.id}
            onClick={() =>
              onChange({
                ...mutation,
                machineId: spec.id as MachineId,
                capacityPerMinute: getBaselineCapacity(spec.id as MachineId),
              })
            }
            className={`rounded border px-2 py-1 text-[10px] font-mono font-semibold transition-colors ${
              mutation.machineId === spec.id
                ? 'border-[#C62828] bg-red-50 text-[#C62828]'
                : 'border-[#E5E5E5] bg-white text-[#666666] hover:border-[#D4D4D4]'
            }`}
          >
            {spec.id}
          </button>
        ))}
      </div>

      {/* Baseline reference */}
      <div className="text-[8px] text-[#A3A3A3]">
        {mutation.machineId} baseline: {baseline} /min
      </div>

      {/* Capacity slider */}
      <ScenarioSlider
        id={`capacity-${mutation.machineId}`}
        label="Capacity"
        min={BOUNDS.capacity.min}
        max={BOUNDS.capacity.max}
        step={BOUNDS.capacity.step}
        value={mutation.capacityPerMinute}
        displayValue={`${mutation.capacityPerMinute} /min`}
        onChange={(v) => onChange({ ...mutation, capacityPerMinute: v })}
      />
    </div>
  )
}
