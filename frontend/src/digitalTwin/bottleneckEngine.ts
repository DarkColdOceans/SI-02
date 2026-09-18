import {
  cloneFactoryState,
  injectDowntime,
  resetSimulation,
  stepSimulation,
} from './simulationEngine'
import type { FactoryState, LineBuffer, Machine, MachineId, MachineStatus } from './types'

const LINE_ORDER: MachineId[] = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']

/** Prototype scoring weights — our design choices, not SI-02 problem-statement values. */
const WEIGHTS = {
  highUtilization: 2,
  upstreamWip: 2,
  throughputConstraint: 3,
  persistence: 2,
  downtimeImpact: 1,
} as const

const MAX_SCORE =
  WEIGHTS.highUtilization +
  WEIGHTS.upstreamWip +
  WEIGHTS.throughputConstraint +
  WEIGHTS.persistence +
  WEIGHTS.downtimeImpact

const HISTORY_WINDOW = 10

export interface MachineBottleneckResult {
  machineId: MachineId
  machineName: string
  score: number
  confidence: number
  reasons: string[]
  utilization: number
  queueBefore: number
  outputRate: number
  capacityPerMinute: number
  status: MachineStatus
}

export interface LineMetrics {
  throughput: number
  totalProduction: number
  wip: number
  bottleneck: MachineBottleneckResult | null
  bottleneckScore: number
  blockedMachines: MachineId[]
  starvedMachines: MachineId[]
  downMachines: MachineId[]
  estimatedProductionLoss: number
}

export interface FactoryAnalysis {
  machines: MachineBottleneckResult[]
  line: LineMetrics
}

export function analyzeFactory(
  state: FactoryState,
  recentStates: FactoryState[] = [],
): FactoryAnalysis {
  const history = [...recentStates, state]
  const window = history.slice(-HISTORY_WINDOW)
  const machines = state.machines.map((machine) => scoreMachine(machine, state, window))
  const line = calculateLineMetrics(state, recentStates, machines)
  return { machines, line }
}

export function detectBottleneck(
  state: FactoryState,
  recentStates: FactoryState[] = [],
): MachineBottleneckResult | null {
  return analyzeFactory(state, recentStates).line.bottleneck
}

export function detectBlocking(state: FactoryState): Machine[] {
  return state.machines.filter((machine) => machine.status === 'BLOCKED')
}

export function detectStarvation(state: FactoryState): Machine[] {
  return state.machines.filter((machine) => machine.status === 'STARVED')
}

export function detectDisruptions(state: FactoryState): Machine[] {
  return state.machines.filter(
    (machine) => machine.status === 'DOWN' || machine.downtimeRemaining > 0,
  )
}

export function calculateLineMetrics(
  state: FactoryState,
  recentStates: FactoryState[] = [],
  scoredMachines?: MachineBottleneckResult[],
): LineMetrics {
  const machines =
    scoredMachines ??
    state.machines.map((machine) =>
      scoreMachine(machine, state, [...recentStates, state].slice(-HISTORY_WINDOW)),
    )

  const bottleneck = selectPrimaryBottleneck(state, machines)
  const theoreticalRate = Math.min(...state.machines.map((machine) => machine.capacityPerMinute))

  return {
    throughput: state.throughput,
    totalProduction: state.totalProduction,
    wip: state.wip,
    bottleneck,
    bottleneckScore: bottleneck?.score ?? 0,
    blockedMachines: detectBlocking(state).map((machine) => machine.id),
    starvedMachines: detectStarvation(state).map((machine) => machine.id),
    downMachines: detectDisruptions(state).map((machine) => machine.id),
    estimatedProductionLoss: Math.max(0, theoreticalRate - state.throughput),
  }
}

export function collectSimulationTrace(
  minutes: number,
  start: FactoryState = resetSimulation(),
): { state: FactoryState; history: FactoryState[] } {
  const history: FactoryState[] = []
  let current = cloneFactoryState(start)
  for (let i = 0; i < minutes; i += 1) {
    current = stepSimulation(current)
    history.push(current)
  }
  return { state: current, history }
}

export function runBottleneckVerification(): { passed: boolean; messages: string[] } {
  const messages: string[] = []
  const fail = (line: string) => {
    messages.push(`FAIL: ${line}`)
  }
  const info = (line: string) => {
    messages.push(line)
  }

  info('=== TEST 1: stable flow should surface M3 as the primary constraint ===')
  const stable = collectSimulationTrace(20)
  const stableAnalysis = analyzeFactory(stable.state, stable.history)
  info(summarizeAnalysis(stableAnalysis))
  const stableBn = stableAnalysis.line.bottleneck
  if (stableBn?.machineId !== 'M3') {
    fail(`expected primary bottleneck M3, got ${stableBn?.machineId ?? 'none'}`)
  }
  if ((stableBn?.score ?? 0) <= 0) {
    fail('M3 bottleneck score should be > 0')
  }

  info('=== TEST 2: M4 downtime is a disruption, not a blind bottleneck label ===')
  const wipBeforeDown = stable.state.wip
  const b3Before = upstreamQueue(stable.state, 'M4')
  const injected = injectDowntime(stable.state, 'M4', 5)
  const downTrace = collectSimulationTrace(5, injected)
  const downHistory = [...stable.history, injected, ...downTrace.history]
  const downAnalysis = analyzeFactory(downTrace.state, downHistory)
  info(summarizeAnalysis(downAnalysis))

  if (!downAnalysis.line.downMachines.includes('M4')) {
    fail('M4 should be reported in downMachines')
  }
  if (downTrace.state.wip <= wipBeforeDown) {
    fail(`upstream WIP should increase (before=${wipBeforeDown}, after=${downTrace.state.wip})`)
  }
  if (upstreamQueue(downTrace.state, 'M4') <= b3Before) {
    fail('buffer immediately before M4 should increase while M4 is down')
  }
  const starved = downAnalysis.line.starvedMachines
  if (!starved.includes('M5') && !starved.includes('M6')) {
    fail(`M5/M6 should be STARVED, got [${starved.join(', ')}]`)
  }
  if (downAnalysis.line.estimatedProductionLoss <= 0) {
    fail('downtime disruption should produce estimated production loss')
  }
  if (downAnalysis.line.bottleneck?.machineId === 'M4') {
    fail('primary bottleneck must not blindly become the DOWN machine (M4)')
  }

  info('=== TEST 3: changing capacity should move the detected constraint ===')
  const retuned = cloneFactoryState(resetSimulation())
  const m5 = retuned.machines.find((machine) => machine.id === 'M5')
  if (!m5) {
    fail('M5 missing from factory model')
  } else {
    m5.capacityPerMinute = 40
  }
  const retunedTrace = collectSimulationTrace(25, retuned)
  const retunedAnalysis = analyzeFactory(retunedTrace.state, retunedTrace.history)
  info(summarizeAnalysis(retunedAnalysis))
  if (retunedAnalysis.line.bottleneck?.machineId !== 'M5') {
    fail(
      `expected bottleneck to move to M5 after capacity change, got ${retunedAnalysis.line.bottleneck?.machineId ?? 'none'}`,
    )
  }

  const passed = messages.every((line) => !line.startsWith('FAIL:'))
  info(passed ? 'BOTTLENECK VERIFICATION PASSED' : 'BOTTLENECK VERIFICATION FAILED')
  return { passed, messages }
}

function scoreMachine(
  machine: Machine,
  state: FactoryState,
  window: FactoryState[],
): MachineBottleneckResult {
  const queueBefore = upstreamQueue(state, machine.id)
  const reasons: string[] = []
  let score = 0

  const highUtil = machine.utilization >= 0.9
  if (highUtil) {
    score += WEIGHTS.highUtilization
    reasons.push(`High utilization (${(machine.utilization * 100).toFixed(0)}%)`)
  }

  const wipBuildup = hasUpstreamWipBuildup(machine.id, state, window)
  if (wipBuildup) {
    score += WEIGHTS.upstreamWip
    reasons.push(`Upstream WIP/queue buildup (queue=${queueBefore})`)
  }

  const constrains = isThroughputConstraint(machine, state)
  if (constrains) {
    score += WEIGHTS.throughputConstraint
    reasons.push('Effective output is limiting downstream / line throughput')
  }

  const persistent = isPersistentConstraint(machine.id, window)
  if (persistent) {
    score += WEIGHTS.persistence
    reasons.push('Constraint signals persist across recent ticks')
  }

  const downImpact = machine.status === 'DOWN' || machine.downtimeRemaining > 0
  if (downImpact) {
    score += WEIGHTS.downtimeImpact
    reasons.push('Current downtime disruption')
  }

  if (machine.status === 'STARVED') {
    reasons.push('STARVED — insufficient input; not treated as the primary bottleneck')
  }
  if (machine.status === 'BLOCKED') {
    reasons.push('BLOCKED — downstream constraint; reported separately from primary bottleneck')
  }

  return {
    machineId: machine.id,
    machineName: machine.name,
    score,
    confidence: clamp01(score / MAX_SCORE),
    reasons,
    utilization: machine.utilization,
    queueBefore,
    outputRate: machine.outputRate,
    capacityPerMinute: machine.capacityPerMinute,
    status: machine.status,
  }
}

function selectPrimaryBottleneck(
  state: FactoryState,
  machines: MachineBottleneckResult[],
): MachineBottleneckResult | null {
  const candidates = machines.filter((result) => {
    if (result.score <= 0) {
      return false
    }
    if (result.status === 'DOWN' || result.status === 'STARVED') {
      return false
    }
    return true
  })

  if (candidates.length === 0) {
    return null
  }

  const ranked = [...candidates].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    if (b.utilization !== a.utilization) {
      return b.utilization - a.utilization
    }
    return a.outputRate - b.outputRate
  })

  const best = ranked[0]
  if (!best) {
    return null
  }

  if (best.status === 'BLOCKED' && !isThroughputConstraint(requireMachine(state, best.machineId), state)) {
    const runningConstraint = ranked.find((result) => result.status === 'RUNNING')
    if (runningConstraint && runningConstraint.score >= best.score - WEIGHTS.persistence) {
      return runningConstraint
    }
  }

  return best
}

function isThroughputConstraint(machine: Machine, state: FactoryState): boolean {
  if (machine.status === 'DOWN' || machine.status === 'STARVED' || machine.status === 'BLOCKED') {
    return false
  }
  if (state.throughput <= 0) {
    return false
  }
  if (machine.utilization < 0.9) {
    return false
  }
  if (Math.abs(machine.outputRate - state.throughput) > 1) {
    return false
  }

  const downstream = nextMachine(state, machine.id)
  if (!downstream) {
    return true
  }
  return (
    downstream.status === 'STARVED' ||
    downstream.outputRate <= machine.outputRate + 0.01
  )
}

function hasUpstreamWipBuildup(
  machineId: MachineId,
  state: FactoryState,
  window: FactoryState[],
): boolean {
  const current = upstreamQueue(state, machineId)
  const buffer = findUpstreamBuffer(state, machineId)
  if (!buffer) {
    return false
  }

  const standingHigh = current >= Math.max(40, buffer.maxCapacity * 0.2)
  if (window.length < 2) {
    return standingHigh
  }

  const first = upstreamQueue(window[0]!, machineId)
  const last = upstreamQueue(window[window.length - 1]!, machineId)
  const increasing = last - first >= 15
  return standingHigh || increasing
}

function isPersistentConstraint(machineId: MachineId, window: FactoryState[]): boolean {
  if (window.length < 3) {
    return false
  }
  let hits = 0
  for (const snapshot of window) {
    const machine = snapshot.machines.find((item) => item.id === machineId)
    if (!machine) {
      continue
    }
    if (machine.status === 'STARVED' || machine.status === 'DOWN') {
      continue
    }
    const constrains = isThroughputConstraint(machine, snapshot)
    const highUtil = machine.utilization >= 0.9
    if (highUtil && (constrains || machine.status === 'RUNNING')) {
      hits += 1
    }
  }
  return hits / window.length >= 0.5
}

function upstreamQueue(state: FactoryState, machineId: MachineId): number {
  const machine = state.machines.find((item) => item.id === machineId)
  if (machineId === 'M1') {
    return 0
  }
  return machine?.queue ?? findUpstreamBuffer(state, machineId)?.quantity ?? 0
}

function findUpstreamBuffer(state: FactoryState, machineId: MachineId): LineBuffer | undefined {
  return state.buffers.find((buffer) => buffer.destinationMachine === machineId)
}

function nextMachine(state: FactoryState, machineId: MachineId): Machine | undefined {
  const index = LINE_ORDER.indexOf(machineId)
  const nextId = LINE_ORDER[index + 1]
  if (!nextId) {
    return undefined
  }
  return state.machines.find((machine) => machine.id === nextId)
}

function requireMachine(state: FactoryState, machineId: MachineId): Machine {
  const machine = state.machines.find((item) => item.id === machineId)
  if (!machine) {
    throw new Error(`Unknown machine: ${machineId}`)
  }
  return machine
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function summarizeAnalysis(analysis: FactoryAnalysis): string {
  const { line } = analysis
  const bn = line.bottleneck
  const machineLines = analysis.machines
    .map(
      (machine) =>
        `${machine.machineId} score=${machine.score} conf=${machine.confidence.toFixed(2)} ${machine.status} util=${machine.utilization.toFixed(2)} q=${machine.queueBefore} :: ${machine.reasons.join('; ') || '—'}`,
    )
    .join('\n')
  return [
    `throughput=${line.throughput} produced=${line.totalProduction} wip=${line.wip} loss=${line.estimatedProductionLoss}`,
    `bottleneck=${bn ? `${bn.machineId} (${bn.machineName}) score=${bn.score}` : 'none'}`,
    `blocked=[${line.blockedMachines.join(', ')}] starved=[${line.starvedMachines.join(', ')}] down=[${line.downMachines.join(', ')}]`,
    machineLines,
  ].join('\n')
}
