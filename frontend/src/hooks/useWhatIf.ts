/**
 * useWhatIf.ts
 *
 * React hook that owns the What-If Scenario form state and execution.
 * Completely separate from useDigitalTwin — it never touches the live
 * simulation loop.
 */

import { useCallback, useState } from 'react'
import { runScenario } from '../digitalTwin/scenarioEngine'
import type { ScenarioConfig, ScenarioResult, ScenarioType } from '../digitalTwin/scenarioEngine'
import { MACHINE_SPECS } from '../digitalTwin/factoryModel'
import type { FactoryState, MachineId } from '../digitalTwin/types'

export interface WhatIfFormState {
  machineId: MachineId
  scenarioType: ScenarioType
  /** Capacity Change: new capacity (units/min) */
  newCapacity: string
  /** Downtime: duration (sim minutes) */
  downtimeDuration: string
}

export interface UseWhatIfReturn {
  form: WhatIfFormState
  result: ScenarioResult | null
  error: string | null
  isRunning: boolean
  setMachineId: (id: MachineId) => void
  setScenarioType: (t: ScenarioType) => void
  setNewCapacity: (v: string) => void
  setDowntimeDuration: (v: string) => void
  runScenarioAction: (liveState: FactoryState, liveHistory: FactoryState[]) => void
  clearResult: () => void
}

/** Return the baseline capacity for a machine from MACHINE_SPECS */
export function getBaselineCapacity(machineId: MachineId): number {
  return MACHINE_SPECS.find((s) => s.id === machineId)?.capacityPerMinute ?? 0
}

function defaultForm(): WhatIfFormState {
  const defaultMachine: MachineId = 'M3'
  return {
    machineId: defaultMachine,
    scenarioType: 'capacity',
    newCapacity: String(getBaselineCapacity(defaultMachine)),
    downtimeDuration: '5',
  }
}

export function useWhatIf(): UseWhatIfReturn {
  const [form, setForm] = useState<WhatIfFormState>(defaultForm)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const setMachineId = useCallback((id: MachineId) => {
    setForm((prev) => ({
      ...prev,
      machineId: id,
      // Pre-fill the capacity field with the baseline for the newly selected machine
      newCapacity:
        prev.scenarioType === 'capacity'
          ? String(getBaselineCapacity(id))
          : prev.newCapacity,
    }))
    setResult(null)
    setError(null)
  }, [])

  const setScenarioType = useCallback((t: ScenarioType) => {
    setForm((prev) => ({
      ...prev,
      scenarioType: t,
      newCapacity:
        t === 'capacity' ? String(getBaselineCapacity(prev.machineId)) : prev.newCapacity,
    }))
    setResult(null)
    setError(null)
  }, [])

  const setNewCapacity = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, newCapacity: v }))
    setError(null)
  }, [])

  const setDowntimeDuration = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, downtimeDuration: v }))
    setError(null)
  }, [])

  const runScenarioAction = useCallback(
    (liveState: FactoryState, liveHistory: FactoryState[]) => {
      setError(null)
      setIsRunning(true)

      try {
        let config: ScenarioConfig

        if (form.scenarioType === 'capacity') {
          const cap = Number(form.newCapacity)
          if (!Number.isFinite(cap) || cap <= 0) {
            setError('Capacity must be a positive number.')
            setIsRunning(false)
            return
          }
          config = { type: 'capacity', machineId: form.machineId, newCapacity: cap }
        } else {
          const dur = Number(form.downtimeDuration)
          if (!Number.isFinite(dur) || dur <= 0 || !Number.isInteger(dur)) {
            setError('Downtime duration must be a positive whole number.')
            setIsRunning(false)
            return
          }
          config = { type: 'downtime', machineId: form.machineId, durationMinutes: dur }
        }

        // runScenario is synchronous and deterministic — no await needed
        const scenarioResult = runScenario(liveState, liveHistory, config)
        setResult(scenarioResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scenario execution failed.')
      } finally {
        setIsRunning(false)
      }
    },
    [form],
  )

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    form,
    result,
    error,
    isRunning,
    setMachineId,
    setScenarioType,
    setNewCapacity,
    setDowntimeDuration,
    runScenarioAction,
    clearResult,
  }
}
