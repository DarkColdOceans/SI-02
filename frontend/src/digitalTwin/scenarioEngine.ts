/**
 * scenarioEngine.ts
 *
 * Multi-variable scenario execution engine.  Accepts a ScenarioDefinition
 * containing N mutations, applies all of them to an isolated deep-clone of
 * the live factory state, simulates a comparison window, and returns
 * structured baseline-vs-scenario results.
 *
 * All functions are side-effect-free with respect to the caller's live
 * simulation state.  Uses ONLY existing engine primitives — no second
 * simulation engine.
 */

import { analyzeFactory } from './bottleneckEngine'
import { cloneFactoryState, simulate } from './simulationEngine'
import type { BufferId, FactoryState, MachineId } from './types'
import type {
  ScenarioDefinition,
  ScenarioMutation,
  ScenarioResult,
  ScenarioSnapshot,
  ValidationError,
} from './scenarioTypes'
import { BOUNDS, MAX_MUTATIONS } from './scenarioTypes'
import { MACHINE_SPECS, BUFFER_SPECS } from './factoryModel'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default simulation window if not specified. */
export const DEFAULT_WINDOW_MINUTES = 20

const VALID_MACHINE_IDS = new Set<string>(MACHINE_SPECS.map((s) => s.id))
const VALID_BUFFER_IDS = new Set<string>(BUFFER_SPECS.map((s) => s.id))

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateScenario(def: ScenarioDefinition): ValidationError[] {
  const errors: ValidationError[] = []

  if (def.name.trim().length === 0) {
    errors.push({ mutationIndex: -1, field: 'name', message: 'Scenario name is required.' })
  }

  if (def.windowMinutes < BOUNDS.windowMinutes.min || def.windowMinutes > BOUNDS.windowMinutes.max) {
    errors.push({
      mutationIndex: -1,
      field: 'windowMinutes',
      message: `Simulation window must be ${BOUNDS.windowMinutes.min}–${BOUNDS.windowMinutes.max} minutes.`,
    })
  }

  if (def.mutations.length === 0) {
    errors.push({ mutationIndex: -1, field: 'mutations', message: 'Add at least one change to the scenario.' })
  }

  if (def.mutations.length > MAX_MUTATIONS) {
    errors.push({
      mutationIndex: -1,
      field: 'mutations',
      message: `Maximum ${MAX_MUTATIONS} changes per scenario.`,
    })
  }

  for (let i = 0; i < def.mutations.length; i++) {
    errors.push(...validateMutation(def.mutations[i]!, i))
  }

  return errors
}

function validateMutation(m: ScenarioMutation, index: number): ValidationError[] {
  const errors: ValidationError[] = []

  switch (m.kind) {
    case 'rawMaterial':
      if (!Number.isFinite(m.inputRate) || m.inputRate < BOUNDS.rawMaterial.min || m.inputRate > BOUNDS.rawMaterial.max) {
        errors.push({
          mutationIndex: index,
          field: 'inputRate',
          message: `Input rate must be ${BOUNDS.rawMaterial.min}–${BOUNDS.rawMaterial.max} units/min.`,
        })
      }
      break

    case 'capacity':
      if (!VALID_MACHINE_IDS.has(m.machineId)) {
        errors.push({ mutationIndex: index, field: 'machineId', message: 'Invalid machine ID.' })
      }
      if (!Number.isFinite(m.capacityPerMinute) || m.capacityPerMinute < BOUNDS.capacity.min || m.capacityPerMinute > BOUNDS.capacity.max) {
        errors.push({
          mutationIndex: index,
          field: 'capacityPerMinute',
          message: `Capacity must be ${BOUNDS.capacity.min}–${BOUNDS.capacity.max} units/min.`,
        })
      }
      break

    case 'downtime':
      if (!VALID_MACHINE_IDS.has(m.machineId)) {
        errors.push({ mutationIndex: index, field: 'machineId', message: 'Invalid machine ID.' })
      }
      if (!Number.isFinite(m.durationMinutes) || m.durationMinutes < BOUNDS.downtime.min || m.durationMinutes > BOUNDS.downtime.max || !Number.isInteger(m.durationMinutes)) {
        errors.push({
          mutationIndex: index,
          field: 'durationMinutes',
          message: `Downtime must be a whole number, ${BOUNDS.downtime.min}–${BOUNDS.downtime.max} minutes.`,
        })
      }
      break

    case 'rejectionRate':
      if (!VALID_MACHINE_IDS.has(m.machineId)) {
        errors.push({ mutationIndex: index, field: 'machineId', message: 'Invalid machine ID.' })
      }
      if (!Number.isFinite(m.rejectionRate) || m.rejectionRate < BOUNDS.rejectionRate.min || m.rejectionRate > BOUNDS.rejectionRate.max) {
        errors.push({
          mutationIndex: index,
          field: 'rejectionRate',
          message: `Rejection rate must be 0–${BOUNDS.rejectionRate.max * 100}%.`,
        })
      }
      break

    case 'bufferCapacity':
      if (!VALID_BUFFER_IDS.has(m.bufferId)) {
        errors.push({ mutationIndex: index, field: 'bufferId', message: 'Invalid buffer ID.' })
      }
      if (!Number.isFinite(m.maxCapacity) || m.maxCapacity < BOUNDS.bufferCapacity.min || m.maxCapacity > BOUNDS.bufferCapacity.max) {
        errors.push({
          mutationIndex: index,
          field: 'maxCapacity',
          message: `Buffer capacity must be ${BOUNDS.bufferCapacity.min}–${BOUNDS.bufferCapacity.max} units.`,
        })
      }
      break
  }

  return errors
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Compute a unique key for each mutation so we can detect duplicates.
 * Mutations with the same key target the same parameter on the same entity.
 */
function getMutationKey(m: ScenarioMutation): string {
  switch (m.kind) {
    case 'rawMaterial':     return 'rawMaterial'
    case 'capacity':        return `capacity:${m.machineId}`
    case 'downtime':        return `downtime:${m.machineId}`
    case 'rejectionRate':   return `rejectionRate:${m.machineId}`
    case 'bufferCapacity':  return `bufferCapacity:${m.bufferId}`
  }
}

/**
 * Deduplicate mutations by key.  If multiple mutations share the same key,
 * only the last one is kept (last-write-wins).  Warnings are emitted for
 * overridden mutations.
 */
export function deduplicateMutations(mutations: ScenarioMutation[]): {
  applied: ScenarioMutation[]
  warnings: string[]
} {
  const warnings: string[] = []
  const seen = new Map<string, number>() // key → last index

  for (let i = 0; i < mutations.length; i++) {
    const key = getMutationKey(mutations[i]!)
    if (seen.has(key)) {
      const prevIdx = seen.get(key)!
      warnings.push(
        `Change #${prevIdx + 1} (${key}) overridden by change #${i + 1}.`,
      )
    }
    seen.set(key, i)
  }

  // Keep only the last occurrence of each key
  const lastIndices = new Set(seen.values())
  const applied = mutations.filter((_, i) => lastIndices.has(i))

  return { applied, warnings }
}

// ─── Mutation application ─────────────────────────────────────────────────────

/**
 * Apply a single mutation to an already-cloned factory state.
 * Mutates the state in-place.  Callers must ensure state is a clone.
 */
function applyMutation(state: FactoryState, mutation: ScenarioMutation): void {
  switch (mutation.kind) {
    case 'rawMaterial':
      state.rawMaterialInputRate = mutation.inputRate
      break

    case 'capacity': {
      const m = requireMachine(state, mutation.machineId)
      m.capacityPerMinute = mutation.capacityPerMinute
      break
    }

    case 'downtime': {
      const m = requireMachine(state, mutation.machineId)
      m.downtimeRemaining = mutation.durationMinutes
      m.status = 'DOWN'
      m.inputRate = 0
      m.outputRate = 0
      m.utilization = 0
      break
    }

    case 'rejectionRate': {
      const m = requireMachine(state, mutation.machineId)
      m.rejectionRate = mutation.rejectionRate
      break
    }

    case 'bufferCapacity': {
      const b = requireBuffer(state, mutation.bufferId)
      b.maxCapacity = mutation.maxCapacity
      // Clamp current fill to new max (excess is discarded)
      if (b.quantity > b.maxCapacity) {
        b.quantity = b.maxCapacity
      }
      break
    }
  }
}

// ─── Snapshot builder ─────────────────────────────────────────────────────────

function computeOverallUtil(state: FactoryState): number {
  if (state.machines.length === 0) return 0
  return (
    (state.machines.reduce((sum, m) => sum + m.utilization, 0) /
      state.machines.length) *
    100
  )
}

function buildSnapshot(
  startState: FactoryState,
  windowMinutes: number,
  recentHistory: FactoryState[],
): ScenarioSnapshot {
  // Run the comparison window, accumulating history for bottleneck scoring
  const history: FactoryState[] = [...recentHistory]
  let current = cloneFactoryState(startState)
  for (let i = 0; i < windowMinutes; i++) {
    current = simulate(current, 1)
    history.push(current)
  }
  const analysis = analyzeFactory(current, history.slice(-30))
  return {
    state: current,
    analysis,
    overallUtilization: computeOverallUtil(current),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run a multi-variable scenario against a snapshot of the live simulation state.
 *
 * Guarantees:
 *  - `liveState` is never mutated.
 *  - `liveHistory` is never mutated.
 *  - Running the same inputs produces the same outputs (deterministic).
 */
export function runMultiScenario(
  liveState: FactoryState,
  liveHistory: FactoryState[],
  definition: ScenarioDefinition,
): ScenarioResult {
  // ── 1. Validate ──────────────────────────────────────────────────────────
  const validationErrors = validateScenario(definition)
  if (validationErrors.length > 0) {
    throw new Error(
      `Scenario validation failed:\n${validationErrors.map((e) => `  [${e.field}] ${e.message}`).join('\n')}`,
    )
  }

  // ── 2. Deduplicate ───────────────────────────────────────────────────────
  const { applied, warnings } = deduplicateMutations(definition.mutations)
  const windowMinutes = definition.windowMinutes

  // ── 3. Baseline: run the same window from the current live state ─────────
  const baselineSnapshot = buildSnapshot(liveState, windowMinutes, liveHistory)

  // ── 4. Scenario: deep-clone, apply all mutations, run same window ────────
  const scenarioStart = cloneFactoryState(liveState)
  for (const mutation of applied) {
    applyMutation(scenarioStart, mutation)
  }
  const scenarioSnapshot = buildSnapshot(scenarioStart, windowMinutes, liveHistory)

  // ── 5. Compute deltas ────────────────────────────────────────────────────
  const baselineBnId = baselineSnapshot.analysis.line.bottleneck?.machineId ?? null
  const scenarioBnId = scenarioSnapshot.analysis.line.bottleneck?.machineId ?? null

  const baselineRejected = sumRejected(baselineSnapshot.state)
  const scenarioRejected = sumRejected(scenarioSnapshot.state)

  const delta = {
    production:
      scenarioSnapshot.state.totalProduction -
      baselineSnapshot.state.totalProduction,
    throughput:
      scenarioSnapshot.state.throughput - baselineSnapshot.state.throughput,
    wip: scenarioSnapshot.state.wip - baselineSnapshot.state.wip,
    overallUtilization:
      scenarioSnapshot.overallUtilization - baselineSnapshot.overallUtilization,
    totalRejected: scenarioRejected - baselineRejected,
    bottleneckChanged: baselineBnId !== scenarioBnId,
    baselineBnId,
    scenarioBnId,
  }

  return {
    scenarioId: definition.id,
    scenarioName: definition.name,
    windowMinutes,
    baselineSnapshot,
    scenarioSnapshot,
    appliedMutations: applied,
    warnings,
    delta,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireMachine(state: FactoryState, machineId: MachineId) {
  const machine = state.machines.find((m) => m.id === machineId)
  if (!machine) throw new Error(`Unknown machine: ${machineId}`)
  return machine
}

function requireBuffer(state: FactoryState, bufferId: BufferId) {
  const buffer = state.buffers.find((b) => b.id === bufferId)
  if (!buffer) throw new Error(`Unknown buffer: ${bufferId}`)
  return buffer
}

function sumRejected(state: FactoryState): number {
  if (!state.rejectedUnits) return 0
  return Object.values(state.rejectedUnits).reduce((sum, n) => sum + n, 0)
}

// ─── Re-exports for backward compatibility ────────────────────────────────────

export * from './scenarioTypes'

/** @deprecated Use BOUNDS.windowMinutes from scenarioTypes instead. */
export const SCENARIO_WINDOW_MINUTES = DEFAULT_WINDOW_MINUTES

export type ScenarioType = 'capacity' | 'downtime'

export interface ScenarioConfig {
  machineId: MachineId
  scenarioType?: ScenarioType
  type?: ScenarioType
  newCapacity?: number
  downtimeDuration?: number
  durationMinutes?: number
  windowMinutes?: number
}

/** Legacy adapter for single-variable scenario calls. */
export function runScenario(
  liveState: FactoryState,
  liveHistory: FactoryState[],
  config: ScenarioConfig,
): ScenarioResult {
  const kind = config.scenarioType ?? config.type ?? 'capacity'
  const mutations: ScenarioMutation[] = []
  if (kind === 'capacity' && config.newCapacity !== undefined) {
    mutations.push({
      kind: 'capacity',
      machineId: config.machineId,
      capacityPerMinute: config.newCapacity,
    })
  } else if (kind === 'downtime') {
    const dur = config.durationMinutes ?? config.downtimeDuration ?? 5
    mutations.push({
      kind: 'downtime',
      machineId: config.machineId,
      durationMinutes: dur,
    })
  }

  const def: ScenarioDefinition = {
    id: `legacy-${Date.now()}`,
    name: `${config.machineId} ${kind}`,
    windowMinutes: config.windowMinutes ?? DEFAULT_WINDOW_MINUTES,
    mutations,
  }

  return runMultiScenario(liveState, liveHistory, def)
}
