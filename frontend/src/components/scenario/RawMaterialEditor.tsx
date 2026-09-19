/**
 * RawMaterialEditor.tsx — Editor for raw-material input rate mutations.
 */

import type { RawMaterialMutation } from '../../digitalTwin/scenarioTypes'
import { BOUNDS } from '../../digitalTwin/scenarioTypes'
import { ScenarioSlider } from './ScenarioSlider'

interface Props {
  mutation: RawMaterialMutation
  onChange: (mutation: RawMaterialMutation) => void
}

export function RawMaterialEditor({ mutation, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[8px] text-[#A3A3A3]">
        Default: unlimited • M1 can process up to 120/min
      </div>
      <ScenarioSlider
        id="raw-material-input"
        label="Input Rate"
        min={BOUNDS.rawMaterial.min}
        max={BOUNDS.rawMaterial.max}
        step={BOUNDS.rawMaterial.step}
        value={mutation.inputRate}
        displayValue={`${mutation.inputRate} /min`}
        onChange={(v) => onChange({ ...mutation, inputRate: v })}
      />
    </div>
  )
}
