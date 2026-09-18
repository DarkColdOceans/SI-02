/**
 * scenarioEngine.ts
 *
 * Pure what-if scenario execution.  All functions are side-effect-free with
 * respect to the caller's live simulation state.  They receive a snapshot,
 * deep-clone it, apply a mutation, simulate a fixed comparison window, and
 * return structured results.
 *
 * Uses ONLY existing engine primitives — no second simulation engine.
 */

import { analyzeFactory } from './bottleneckEngine'
import type { FactoryAnalysis } from './bottleneckEngine'
import { cloneFactoryState, injectDowntime, simulate } from './simulationEngine'
import type { FactoryState, MachineId } from './types'

// ─── Scenario types ───────────────────────────────────────────────────────────

export type ScenarioType = 'capacity' | 'downtime'

export interface CapacityScenario {
  type: 'capacity'
  machineId: MachineId
  /** New capacity in units per simulated minute */
  newCapacity: number
}

export interface DowntimeScenario {
  type: 'downtime'
  machineId: MachineId
  /** Downtime duration in simulated minutes */
  durationMinutes: number
}

export type ScenarioConfig = CapacityScenario | DowntimeScenario

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ScenarioSnapshot {
  /** State after simulating the scenario window */
  state: FactoryState
  /** Bottleneck analysis of the final scenario state */
  analysis: FactoryAnalysis
  /** Average utilization across all machines (0–100) */
  overallUtilization: number
}

export interface ScenarioResult {
  /** How many simulated minutes were run as the comparison window */
  windowMinutes: number
  /** Deep-frozen snapshot of the live state used as input (for reference) */
  baselineSnapshot: ScenarioSnapshot
  /** Deep-frozen result after applying the scenario */
  scenarioSnapshot: ScenarioSnapshot
  /** Delta metrics (scenario − baseline, except wip where higher is worse) */
  delta: {
    production: number
    throughput: number
    wip: number
    overallUtilization: number
    bottleneckChanged: boolean
    baselineBnId: string | null
    scenarioBnId: string | null
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Simulated minutes to run for each comparison. */
export const SCENARIO_WINDOW_MINUTES = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
 * Run a what-if scenario against a snapshot of the live simulation state.
 *
 * Guarantees:
 *  - `liveState` is never mutated.
 *  - `liveHistory` is never mutated.
 *  - Running the same inputs produces the same outputs (deterministic).
 */
export function runScenario(
  liveState: FactoryState,
  liveHistory: FactoryState[],
  config: ScenarioConfig,
  windowMinutes: number = SCENARIO_WINDOW_MINUTES,
): ScenarioResult {
  // ── 1. Baseline: run the same window from the current live state ──────────
  const baselineSnapshot = buildSnapshot(liveState, windowMinutes, liveHistory)

  // ── 2. Scenario: deep-clone live state, apply mutation, run same window ───
  const scenarioStart = cloneFactoryState(liveState)

  if (config.type === 'capacity') {
    const machine = scenarioStart.machines.find((m) => m.id === config.machineId)
    if (!machine) throw new Error(`Unknown machine: ${config.machineId}`)
    machine.capacityPerMinute = config.newCapacity
  } else {
    // downtime — use existing injectDowntime (which itself clones, so we
    // overwrite our already-cloned copy)
    const withDowntime = injectDowntime(
      scenarioStart,
      config.machineId,
      config.durationMinutes,
    )
    // Copy the mutated machines/state back onto scenarioStart reference
    Object.assign(scenarioStart, withDowntime)
  }

  const scenarioSnapshot = buildSnapshot(scenarioStart, windowMinutes, liveHistory)

  // ── 3. Delta ──────────────────────────────────────────────────────────────
  const baselineBnId = baselineSnapshot.analysis.line.bottleneck?.machineId ?? null
  const scenarioBnId = scenarioSnapshot.analysis.line.bottleneck?.machineId ?? null

  const delta = {
    production:
      scenarioSnapshot.state.totalProduction -
      baselineSnapshot.state.totalProduction,
    throughput:
      scenarioSnapshot.state.throughput - baselineSnapshot.state.throughput,
    wip: scenarioSnapshot.state.wip - baselineSnapshot.state.wip,
    overallUtilization:
      scenarioSnapshot.overallUtilization - baselineSnapshot.overallUtilization,
    bottleneckChanged: baselineBnId !== scenarioBnId,
    baselineBnId,
    scenarioBnId,
  }

  return {
    windowMinutes,
    baselineSnapshot,
    scenarioSnapshot,
    delta,
  }
}
