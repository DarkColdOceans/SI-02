/**
 * Scenario engine end-to-end test: "Production Stress Test"
 *
 * Verifies that the multi-variable scenario system works correctly
 * with the example from the architecture design document.
 */

import { resetSimulation, simulate } from './simulationEngine'
import { runMultiScenario } from './scenarioEngine'
import type { ScenarioDefinition } from './scenarioTypes'
import type { MachineId, BufferId, FactoryState } from './types'

// Build up a live state with some history (20 ticks)
let liveState = resetSimulation()
const liveHistory: FactoryState[] = []
for (let i = 0; i < 20; i++) {
  liveState = simulate(liveState, 1)
  liveHistory.push(liveState)
}

console.log('=== LIVE STATE (after 20 ticks) ===')
console.log(`  t=${liveState.simulationTime}  produced=${liveState.totalProduction}  throughput=${liveState.throughput}  wip=${liveState.wip}`)

// Construct the Production Stress Test scenario
const stressTest: ScenarioDefinition = {
  id: 'stress-test-001',
  name: 'Production Stress Test',
  windowMinutes: 20,
  mutations: [
    {
      kind: 'rawMaterial',
      inputRate: 144,             // +20% above M1 baseline (120 * 1.2)
    },
    {
      kind: 'capacity',
      machineId: 'M2' as MachineId,
      capacityPerMinute: 93.5,    // -15% from baseline 110 (110 * 0.85)
    },
    {
      kind: 'downtime',
      machineId: 'M4' as MachineId,
      durationMinutes: 10,
    },
    {
      kind: 'rejectionRate',
      machineId: 'M5' as MachineId,
      rejectionRate: 0.05,        // 5% rejection
    },
    {
      kind: 'bufferCapacity',
      bufferId: 'B3' as BufferId,
      maxCapacity: 375,           // +50% from baseline 250 (250 * 1.5)
    },
  ],
}

console.log('\n=== RUNNING SCENARIO: "Production Stress Test" ===')
console.log(`  Mutations: ${stressTest.mutations.length}`)

const result = runMultiScenario(liveState, liveHistory, stressTest)

console.log('\n=== RESULTS ===')
console.log(`  Scenario: ${result.scenarioName}`)
console.log(`  Window: +${result.windowMinutes} sim-min`)
console.log(`  Applied mutations: ${result.appliedMutations.length}`)
console.log(`  Warnings: ${result.warnings.length > 0 ? result.warnings.join('; ') : 'none'}`)

console.log('\n  BASELINE:')
console.log(`    Production: ${result.baselineSnapshot.state.totalProduction}`)
console.log(`    Throughput: ${result.baselineSnapshot.state.throughput}`)
console.log(`    WIP: ${result.baselineSnapshot.state.wip}`)
console.log(`    Utilization: ${result.baselineSnapshot.overallUtilization.toFixed(1)}%`)
console.log(`    Bottleneck: ${result.baselineSnapshot.analysis.line.bottleneck?.machineId ?? 'none'}`)

console.log('\n  SCENARIO:')
console.log(`    Production: ${result.scenarioSnapshot.state.totalProduction}`)
console.log(`    Throughput: ${result.scenarioSnapshot.state.throughput}`)
console.log(`    WIP: ${result.scenarioSnapshot.state.wip}`)
console.log(`    Utilization: ${result.scenarioSnapshot.overallUtilization.toFixed(1)}%`)
console.log(`    Bottleneck: ${result.scenarioSnapshot.analysis.line.bottleneck?.machineId ?? 'none'}`)
console.log(`    Rejected: ${JSON.stringify(result.scenarioSnapshot.state.rejectedUnits)}`)

console.log('\n  DELTAS:')
console.log(`    Production: ${result.delta.production > 0 ? '+' : ''}${result.delta.production}`)
console.log(`    Throughput: ${result.delta.throughput > 0 ? '+' : ''}${result.delta.throughput}`)
console.log(`    WIP: ${result.delta.wip > 0 ? '+' : ''}${result.delta.wip}`)
console.log(`    Utilization: ${result.delta.overallUtilization > 0 ? '+' : ''}${result.delta.overallUtilization.toFixed(1)}%`)
console.log(`    Rejected: +${result.delta.totalRejected}`)
console.log(`    Bottleneck changed: ${result.delta.bottleneckChanged} (${result.delta.baselineBnId} → ${result.delta.scenarioBnId})`)

// Verify invariants
const messages: string[] = []
const fail = (msg: string) => messages.push(`FAIL: ${msg}`)

if (result.appliedMutations.length !== 5) {
  fail(`expected 5 applied mutations, got ${result.appliedMutations.length}`)
}
if (result.warnings.length !== 0) {
  fail(`expected 0 warnings (no duplicates), got ${result.warnings.length}`)
}
if (result.delta.production >= 0) {
  fail(`expected production to decrease under stress, delta=${result.delta.production}`)
}
if (result.delta.totalRejected <= 0) {
  fail(`expected rejected units > 0 with M5 rejection rate, got ${result.delta.totalRejected}`)
}
if (result.scenarioSnapshot.state.totalProduction < 0) {
  fail('totalProduction should never be negative')
}

// Verify live state was not mutated
if (liveState.simulationTime !== 20) {
  fail(`live state was mutated: simulationTime=${liveState.simulationTime} (expected 20)`)
}
if (liveState.machines.find(m => m.id === 'M2')!.capacityPerMinute !== 110) {
  fail('live state M2 capacity was mutated')
}
if (liveState.machines.find(m => m.id === 'M4')!.status === 'DOWN') {
  fail('live state M4 was set to DOWN')
}

const passed = messages.every(line => !line.startsWith('FAIL:'))
console.log('\n' + (passed ? 'SCENARIO TEST PASSED' : 'SCENARIO TEST FAILED'))
for (const msg of messages) {
  console.log('  ' + msg)
}

if (!passed) {
  throw new Error('Scenario verification failed')
}
