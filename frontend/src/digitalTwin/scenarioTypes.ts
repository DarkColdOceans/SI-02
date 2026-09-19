/**
 * scenarioTypes.ts
 *
 * Type definitions for the multi-variable scenario simulation system.
 * A scenario contains zero or more mutations applied together to an
 * isolated clone of the live factory state.
 *
 * This module is pure types — no runtime logic.
 */

import type { FactoryAnalysis } from './bottleneckEngine'
import type { BufferId, FactoryState, MachineId } from './types'

// ─── Mutation primitives ────────────────────────────────────────────────────

/** Change the raw-material input rate fed to M1 (currently unlimited). */
export interface RawMaterialMutation {
  kind: 'rawMaterial'
  /** Units per simulated minute. */
  inputRate: number
}

/** Change a machine's processing capacity. */
export interface CapacityMutation {
  kind: 'capacity'
  machineId: MachineId
  /** New capacity in units per simulated minute. */
  capacityPerMinute: number
}

/** Inject downtime on a specific machine. */
export interface DowntimeMutation {
  kind: 'downtime'
  machineId: MachineId
  /** Downtime duration in simulated minutes. */
  durationMinutes: number
}

/** Set a rejection/scrap rate for a machine (material lost after processing). */
export interface RejectionRateMutation {
  kind: 'rejectionRate'
  machineId: MachineId
  /** Fraction of output rejected (0.0 = none, 1.0 = 100%). */
  rejectionRate: number
}

/** Change a buffer's maximum capacity. */
export interface BufferCapacityMutation {
  kind: 'bufferCapacity'
  bufferId: BufferId
  /** New buffer max capacity in units. */
  maxCapacity: number
}

/** Discriminated union of all supported mutation types. */
export type ScenarioMutation =
  | RawMaterialMutation
  | CapacityMutation
  | DowntimeMutation
  | RejectionRateMutation
  | BufferCapacityMutation

/** All possible mutation kind strings (for iteration / switch exhaustiveness). */
export type MutationKind = ScenarioMutation['kind']

// ─── Scenario container ─────────────────────────────────────────────────────

/** A named, user-composed scenario containing zero or more mutations. */
export interface ScenarioDefinition {
  /** Unique client-side ID. */
  id: string
  /** User-supplied scenario name. */
  name: string
  /** Ordered list of mutations. Applied sequentially to a cloned state. */
  mutations: ScenarioMutation[]
  /** Simulation window length in simulated minutes. */
  windowMinutes: number
}

// ─── Scenario results ───────────────────────────────────────────────────────

export interface ScenarioSnapshot {
  /** Factory state after simulating the scenario window. */
  state: FactoryState
  /** Bottleneck analysis of the final state. */
  analysis: FactoryAnalysis
  /** Average utilization across all machines (0–100). */
  overallUtilization: number
}

export interface ScenarioResult {
  /** ID of the scenario that produced this result. */
  scenarioId: string
  /** Name of the scenario. */
  scenarioName: string
  /** How many simulated minutes were run. */
  windowMinutes: number
  /** Snapshot from running the unmodified baseline forward. */
  baselineSnapshot: ScenarioSnapshot
  /** Snapshot after applying all mutations. */
  scenarioSnapshot: ScenarioSnapshot
  /** Mutations that were actually applied (post-deduplication). */
  appliedMutations: ScenarioMutation[]
  /** Deduplication warnings (empty if no conflicts). */
  warnings: string[]
  /** Delta metrics (scenario − baseline). */
  delta: {
    production: number
    throughput: number
    wip: number
    overallUtilization: number
    totalRejected: number
    bottleneckChanged: boolean
    baselineBnId: string | null
    scenarioBnId: string | null
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ValidationError {
  /** Index of the mutation with the error (-1 for scenario-level). */
  mutationIndex: number
  /** Field that failed validation. */
  field: string
  /** Human-readable error message. */
  message: string
}

// ─── Bounds constants (used by both validation and UI sliders) ───────────────

export const BOUNDS = {
  rawMaterial: { min: 1, max: 500, step: 5 },
  capacity: { min: 10, max: 300, step: 5 },
  downtime: { min: 1, max: 60, step: 1 },
  rejectionRate: { min: 0, max: 0.5, step: 0.01 },
  bufferCapacity: { min: 10, max: 1000, step: 25 },
  windowMinutes: { min: 5, max: 120, step: 5 },
} as const

export const MAX_MUTATIONS = 20
