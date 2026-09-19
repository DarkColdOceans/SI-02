/**
 * useScenario.ts
 *
 * React hook that owns the multi-variable Scenario Simulation form state
 * and execution.  Completely separate from useDigitalTwin — it never
 * touches the live simulation loop.
 */

import { useCallback, useMemo, useState } from 'react'
import { runMultiScenario, DEFAULT_WINDOW_MINUTES } from '../digitalTwin/scenarioEngine'
import type { FactoryState, MachineId, BufferId } from '../digitalTwin/types'
import type {
  ScenarioDefinition,
  ScenarioMutation,
  ScenarioResult,
  ValidationError,
} from '../digitalTwin/scenarioTypes'
import { BOUNDS, MAX_MUTATIONS } from '../digitalTwin/scenarioTypes'
import { MACHINE_SPECS, BUFFER_SPECS } from '../digitalTwin/factoryModel'

// ─── Public interface ─────────────────────────────────────────────────────────

export interface UseScenarioReturn {
  /** Current scenario definition being composed. */
  scenario: ScenarioDefinition
  /** Scenario execution result (null until first run). */
  result: ScenarioResult | null
  /** Error message from last run attempt. */
  error: string | null
  /** Whether a scenario is currently executing. */
  isRunning: boolean
  /** Live validation errors for the current scenario. */
  validationErrors: ValidationError[]

  // ── Scenario metadata ──
  setName: (name: string) => void
  setWindowMinutes: (minutes: number) => void

  // ── Mutation CRUD ──
  addMutation: (mutation: ScenarioMutation) => void
  updateMutation: (index: number, mutation: ScenarioMutation) => void
  removeMutation: (index: number) => void
  clearMutations: () => void

  // ── Execution ──
  runScenarioAction: (liveState: FactoryState, liveHistory: FactoryState[]) => void
  clearResult: () => void

  // ── Derived helpers ──
  /** Machine IDs currently targeted by at least one mutation. */
  activeMachineIds: Set<MachineId>
  /** Buffer IDs currently targeted by at least one mutation. */
  activeBufferIds: Set<BufferId>
  /** Whether a raw material mutation exists in the current scenario. */
  hasRawMaterialChange: boolean
  /** Whether the maximum mutation count has been reached. */
  isAtMaxMutations: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyScenario(): ScenarioDefinition {
  return {
    id: generateId(),
    name: '',
    mutations: [],
    windowMinutes: DEFAULT_WINDOW_MINUTES,
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Quick client-side validation (mirrors scenarioEngine.validateScenario). */
function validateLocally(def: ScenarioDefinition): ValidationError[] {
  const errors: ValidationError[] = []

  if (def.mutations.length === 0) {
    errors.push({ mutationIndex: -1, field: 'mutations', message: 'Add at least one change.' })
  }
  if (def.mutations.length > MAX_MUTATIONS) {
    errors.push({ mutationIndex: -1, field: 'mutations', message: `Maximum ${MAX_MUTATIONS} changes.` })
  }
  if (def.windowMinutes < BOUNDS.windowMinutes.min || def.windowMinutes > BOUNDS.windowMinutes.max) {
    errors.push({ mutationIndex: -1, field: 'windowMinutes', message: `Window must be ${BOUNDS.windowMinutes.min}–${BOUNDS.windowMinutes.max} min.` })
  }

  // Per-mutation validation
  for (let i = 0; i < def.mutations.length; i++) {
    const m = def.mutations[i]!
    switch (m.kind) {
      case 'rawMaterial':
        if (m.inputRate < BOUNDS.rawMaterial.min || m.inputRate > BOUNDS.rawMaterial.max) {
          errors.push({ mutationIndex: i, field: 'inputRate', message: `Must be ${BOUNDS.rawMaterial.min}–${BOUNDS.rawMaterial.max}.` })
        }
        break
      case 'capacity':
        if (m.capacityPerMinute < BOUNDS.capacity.min || m.capacityPerMinute > BOUNDS.capacity.max) {
          errors.push({ mutationIndex: i, field: 'capacityPerMinute', message: `Must be ${BOUNDS.capacity.min}–${BOUNDS.capacity.max}.` })
        }
        break
      case 'downtime':
        if (m.durationMinutes < BOUNDS.downtime.min || m.durationMinutes > BOUNDS.downtime.max) {
          errors.push({ mutationIndex: i, field: 'durationMinutes', message: `Must be ${BOUNDS.downtime.min}–${BOUNDS.downtime.max}.` })
        }
        break
      case 'rejectionRate':
        if (m.rejectionRate < BOUNDS.rejectionRate.min || m.rejectionRate > BOUNDS.rejectionRate.max) {
          errors.push({ mutationIndex: i, field: 'rejectionRate', message: `Must be 0–${BOUNDS.rejectionRate.max * 100}%.` })
        }
        break
      case 'bufferCapacity':
        if (m.maxCapacity < BOUNDS.bufferCapacity.min || m.maxCapacity > BOUNDS.bufferCapacity.max) {
          errors.push({ mutationIndex: i, field: 'maxCapacity', message: `Must be ${BOUNDS.bufferCapacity.min}–${BOUNDS.bufferCapacity.max}.` })
        }
        break
    }
  }

  return errors
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useScenario(): UseScenarioReturn {
  const [scenario, setScenario] = useState<ScenarioDefinition>(createEmptyScenario)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // ── Derived state ──

  const validationErrors = useMemo(() => validateLocally(scenario), [scenario])

  const activeMachineIds = useMemo(() => {
    const ids = new Set<MachineId>()
    for (const m of scenario.mutations) {
      if ('machineId' in m) ids.add(m.machineId)
    }
    return ids
  }, [scenario.mutations])

  const activeBufferIds = useMemo(() => {
    const ids = new Set<BufferId>()
    for (const m of scenario.mutations) {
      if ('bufferId' in m) ids.add((m as { bufferId: BufferId }).bufferId)
    }
    return ids
  }, [scenario.mutations])

  const hasRawMaterialChange = useMemo(
    () => scenario.mutations.some((m) => m.kind === 'rawMaterial'),
    [scenario.mutations],
  )

  const isAtMaxMutations = scenario.mutations.length >= MAX_MUTATIONS

  // ── Scenario metadata ──

  const setName = useCallback((name: string) => {
    setScenario((prev) => ({ ...prev, name }))
    setResult(null)
    setError(null)
  }, [])

  const setWindowMinutes = useCallback((minutes: number) => {
    setScenario((prev) => ({ ...prev, windowMinutes: minutes }))
    setResult(null)
    setError(null)
  }, [])

  // ── Mutation CRUD ──

  const addMutation = useCallback((mutation: ScenarioMutation) => {
    setScenario((prev) => ({
      ...prev,
      mutations: [...prev.mutations, mutation],
    }))
    setResult(null)
    setError(null)
  }, [])

  const updateMutation = useCallback((index: number, mutation: ScenarioMutation) => {
    setScenario((prev) => {
      const next = [...prev.mutations]
      if (index >= 0 && index < next.length) {
        next[index] = mutation
      }
      return { ...prev, mutations: next }
    })
    setResult(null)
    setError(null)
  }, [])

  const removeMutation = useCallback((index: number) => {
    setScenario((prev) => ({
      ...prev,
      mutations: prev.mutations.filter((_, i) => i !== index),
    }))
    setResult(null)
    setError(null)
  }, [])

  const clearMutations = useCallback(() => {
    setScenario((prev) => ({ ...prev, mutations: [] }))
    setResult(null)
    setError(null)
  }, [])

  // ── Execution ──

  const runScenarioAction = useCallback(
    (liveState: FactoryState, liveHistory: FactoryState[]) => {
      setError(null)
      setIsRunning(true)

      try {
        // Ensure name is set
        const def: ScenarioDefinition = {
          ...scenario,
          name: scenario.name.trim() || 'Untitled Scenario',
        }

        const scenarioResult = runMultiScenario(liveState, liveHistory, def)
        setResult(scenarioResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scenario execution failed.')
      } finally {
        setIsRunning(false)
      }
    },
    [scenario],
  )

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    scenario,
    result,
    error,
    isRunning,
    validationErrors,
    setName,
    setWindowMinutes,
    addMutation,
    updateMutation,
    removeMutation,
    clearMutations,
    runScenarioAction,
    clearResult,
    activeMachineIds,
    activeBufferIds,
    hasRawMaterialChange,
    isAtMaxMutations,
  }
}

// ─── Utility exports for UI components ────────────────────────────────────────

/** Return the baseline capacity for a machine from MACHINE_SPECS. */
export function getBaselineCapacity(machineId: MachineId): number {
  return MACHINE_SPECS.find((s) => s.id === machineId)?.capacityPerMinute ?? 0
}

/** Return the baseline max capacity for a buffer from BUFFER_SPECS. */
export function getBaselineBufferCapacity(bufferId: BufferId): number {
  return BUFFER_SPECS.find((s) => s.id === bufferId)?.maxCapacity ?? 0
}

/** All machine specs for building UI selectors. */
export { MACHINE_SPECS, BUFFER_SPECS }
