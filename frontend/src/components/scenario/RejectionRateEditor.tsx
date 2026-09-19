/**
 * RejectionRateEditor.tsx — Editor for machine rejection rate mutations.
 */

import type { RejectionRateMutation } from '../../digitalTwin/scenarioTypes'
import { BOUNDS } from '../../digitalTwin/scenarioTypes'
import type { MachineId } from '../../digitalTwin/types'
import { MACHINE_SPECS } from '../../hooks/useScenario'
import { ScenarioSlider } from './ScenarioSlider'

interface Props {
  mutation: RejectionRateMutation
  onChange: (mutation: RejectionRateMutation) => void
}

export function RejectionRateEditor({ mutation, onChange }: Props) {
  const pctValue = Math.round(mutation.rejectionRate * 100)

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

      {/* Info */}
      <div className="text-[8px] text-[#A3A3A3]">
        Fraction of output rejected after processing (material lost)
      </div>

      {/* Rejection slider — uses percentage for display, fraction internally */}
      <ScenarioSlider
        id={`rejection-${mutation.machineId}`}
        label="Rejection Rate"
        min={BOUNDS.rejectionRate.min * 100}
        max={BOUNDS.rejectionRate.max * 100}
        step={BOUNDS.rejectionRate.step * 100}
        value={pctValue}
        displayValue={`${pctValue}%`}
        onChange={(v) => onChange({ ...mutation, rejectionRate: v / 100 })}
      />
    </div>
  )
}
