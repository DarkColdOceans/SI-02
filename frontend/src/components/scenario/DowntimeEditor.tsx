/**
 * DowntimeEditor.tsx — Editor for machine downtime mutations.
 */

import type { DowntimeMutation } from '../../digitalTwin/scenarioTypes'
import { BOUNDS } from '../../digitalTwin/scenarioTypes'
import type { MachineId } from '../../digitalTwin/types'
import { MACHINE_SPECS } from '../../hooks/useScenario'
import { ScenarioSlider } from './ScenarioSlider'

interface Props {
  mutation: DowntimeMutation
  onChange: (mutation: DowntimeMutation) => void
}

export function DowntimeEditor({ mutation, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Machine selector */}
      <div className="flex flex-wrap gap-1">
        {MACHINE_SPECS.map((spec) => (
          <button
            key={spec.id}
            onClick={() =>
              onChange({ ...mutation, machineId: spec.id as MachineId })
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

      {/* Downtime slider */}
      <ScenarioSlider
        id={`downtime-${mutation.machineId}`}
        label="Duration"
        min={BOUNDS.downtime.min}
        max={BOUNDS.downtime.max}
        step={BOUNDS.downtime.step}
        value={mutation.durationMinutes}
        displayValue={`${mutation.durationMinutes} min`}
        onChange={(v) => onChange({ ...mutation, durationMinutes: v })}
      />
    </div>
  )
}
