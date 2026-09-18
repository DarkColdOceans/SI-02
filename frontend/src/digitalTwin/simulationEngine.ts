import { createInitialFactoryState as buildInitialFactoryState } from './factoryModel'
import type { FactoryState, LineBuffer, Machine, MachineId, MachineStatus } from './types'

const MACHINE_ORDER: MachineId[] = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']

export function createInitialFactoryState(): FactoryState {
  return cloneFactoryState(buildInitialFactoryState())
}

export function cloneFactoryState(state: FactoryState): FactoryState {
  return structuredClone(state)
}

export function resetFactoryState(): FactoryState {
  return createInitialFactoryState()
}

export function resetSimulation(): FactoryState {
  return createInitialFactoryState()
}

export function injectDowntime(
  state: FactoryState,
  machineId: MachineId,
  duration: number,
): FactoryState {
  const next = cloneFactoryState(state)
  const machine = requireMachine(next, machineId)
  machine.downtimeRemaining = duration
  machine.status = 'DOWN'
  machine.inputRate = 0
  machine.outputRate = 0
  machine.utilization = 0
  return next
}

/** One tick = 1 simulated minute. Does not mutate the input state. */
export function stepSimulation(state: FactoryState): FactoryState {
  const next = cloneFactoryState(state)
  next.simulationTime += 1

  let finishedThisTick = 0

  for (const id of MACHINE_ORDER) {
    finishedThisTick += processMachine(next, id)
  }

  for (const id of MACHINE_ORDER) {
    const machine = requireMachine(next, id)
    machine.queue = id === 'M1' ? 0 : (findUpstreamBuffer(next, id)?.quantity ?? 0)
  }

  next.throughput = finishedThisTick
  next.totalProduction += finishedThisTick
  next.wip = next.buffers.reduce((sum, buffer) => sum + buffer.quantity, 0)
  return next
}

export function simulate(state: FactoryState, minutes: number): FactoryState {
  let current = cloneFactoryState(state)
  for (let i = 0; i < minutes; i += 1) {
    current = stepSimulation(current)
  }
  return current
}

export function runSimulationVerification(): { passed: boolean; messages: string[] } {
  const messages: string[] = []
  const fail = (line: string) => {
    messages.push(`FAIL: ${line}`)
  }
  const info = (line: string) => {
    messages.push(line)
  }

  const after10 = simulate(resetSimulation(), 10)
  info('--- After 10 simulated minutes ---')
  info(summarizeState(after10))

  if (after10.simulationTime !== 10) {
    fail(`simulationTime expected 10, got ${after10.simulationTime}`)
  }
  if (after10.totalProduction <= 0) {
    fail(`totalProduction should be > 0, got ${after10.totalProduction}`)
  }
  if (after10.wip <= 0) {
    fail(`buffers should contain WIP, wip=${after10.wip}`)
  }
  if (after10.throughput <= 0) {
    fail(`line should be flowing, throughput=${after10.throughput}`)
  }

  const down = injectDowntime(after10, 'M4', 5)
  const m4Injected = requireMachine(down, 'M4')
  info('--- injectDowntime(state, "M4", 5) ---')
  info(`M4 status=${m4Injected.status} downtimeRemaining=${m4Injected.downtimeRemaining}`)
  if (m4Injected.status !== 'DOWN' || m4Injected.downtimeRemaining !== 5) {
    fail('M4 should be DOWN with downtimeRemaining=5 after injectDowntime')
  }

  const b3Before = requireBuffer(down, 'B3').quantity
  const productionBefore = down.totalProduction

  const duringDown = simulate(down, 5)
  const m4During = requireMachine(duringDown, 'M4')
  const b3During = requireBuffer(duringDown, 'B3').quantity
  const m5 = requireMachine(duringDown, 'M5')
  const m6 = requireMachine(duringDown, 'M6')

  info('--- After 5 minutes with M4 down ---')
  info(summarizeState(duringDown))
  info(`B3 before=${b3Before} after=${b3During}`)
  info(`M5 status=${m5.status} M6 status=${m6.status}`)

  if (m4During.downtimeRemaining !== 0) {
    fail(`M4 downtimeRemaining expected 0 after 5 ticks, got ${m4During.downtimeRemaining}`)
  }
  if (duringDown.totalProduction !== productionBefore) {
    fail(
      `finished production should stall while M4 is down (before=${productionBefore}, after=${duringDown.totalProduction})`,
    )
  }
  if (b3During <= b3Before) {
    fail(`material should accumulate upstream of M4 in B3 (before=${b3Before}, after=${b3During})`)
  }
  if (m5.status !== 'STARVED' && m6.status !== 'STARVED') {
    fail('downstream machines should be affected (expected STARVED on M5 and/or M6)')
  }

  const recovered = simulate(duringDown, 3)
  const m4Recovered = requireMachine(recovered, 'M4')
  info('--- After 3 more minutes (M4 recovered) ---')
  info(summarizeState(recovered))

  if (m4Recovered.status === 'DOWN' || m4Recovered.downtimeRemaining !== 0) {
    fail('M4 should no longer be DOWN after downtime reaches 0')
  }
  if (recovered.totalProduction <= duringDown.totalProduction) {
    fail('totalProduction should resume after M4 recovers')
  }

  const passed = messages.every((line) => !line.startsWith('FAIL:'))
  info(passed ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED')
  return { passed, messages }
}

function processMachine(state: FactoryState, id: MachineId): number {
  const machine = requireMachine(state, id)
  const capacity = machine.capacityPerMinute
  const upstream = findUpstreamBuffer(state, id)
  const downstream = findDownstreamBuffer(state, id)

  if (machine.downtimeRemaining > 0) {
    machine.status = 'DOWN'
    machine.inputRate = 0
    machine.outputRate = 0
    machine.utilization = 0
    machine.downtimeRemaining -= 1
    return 0
  }

  const inputAvailable = id === 'M1' ? Number.POSITIVE_INFINITY : (upstream?.quantity ?? 0)
  const outputSpace = downstream
    ? Math.max(0, downstream.maxCapacity - downstream.quantity)
    : Number.POSITIVE_INFINITY

  const processed = Math.min(capacity, inputAvailable, outputSpace)

  if (upstream && processed > 0) {
    upstream.quantity -= processed
  }
  if (downstream && processed > 0) {
    downstream.quantity += processed
  }

  machine.inputRate = processed
  machine.outputRate = processed
  machine.totalProcessed += processed
  machine.utilization = capacity <= 0 ? 0 : clamp01(processed / capacity)
  machine.status = resolveStatus(id, processed, capacity, inputAvailable, outputSpace)

  return id === 'M6' ? processed : 0
}

function resolveStatus(
  id: MachineId,
  processed: number,
  capacity: number,
  inputAvailable: number,
  outputSpace: number,
): MachineStatus {
  if (outputSpace <= 0) {
    return 'BLOCKED'
  }
  if (outputSpace < capacity && outputSpace <= inputAvailable) {
    return 'BLOCKED'
  }
  if (id !== 'M1' && inputAvailable < capacity) {
    return 'STARVED'
  }
  if (processed > 0) {
    return 'RUNNING'
  }
  return 'IDLE'
}

function findUpstreamBuffer(state: FactoryState, machineId: MachineId): LineBuffer | undefined {
  return state.buffers.find((buffer) => buffer.destinationMachine === machineId)
}

function findDownstreamBuffer(state: FactoryState, machineId: MachineId): LineBuffer | undefined {
  return state.buffers.find((buffer) => buffer.sourceMachine === machineId)
}

function requireMachine(state: FactoryState, machineId: MachineId): Machine {
  const machine = state.machines.find((item) => item.id === machineId)
  if (!machine) {
    throw new Error(`Unknown machine: ${machineId}`)
  }
  return machine
}

function requireBuffer(state: FactoryState, bufferId: LineBuffer['id']): LineBuffer {
  const buffer = state.buffers.find((item) => item.id === bufferId)
  if (!buffer) {
    throw new Error(`Unknown buffer: ${bufferId}`)
  }
  return buffer
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function summarizeState(state: FactoryState): string {
  const machines = state.machines
    .map(
      (machine) =>
        `${machine.id}:${machine.status} out=${machine.outputRate} util=${machine.utilization.toFixed(2)} q=${machine.queue}`,
    )
    .join(' | ')
  const buffers = state.buffers
    .map((buffer) => `${buffer.id}=${buffer.quantity}/${buffer.maxCapacity}`)
    .join(' ')
  return [
    `t=${state.simulationTime} produced=${state.totalProduction} throughput=${state.throughput} wip=${state.wip}`,
    machines,
    buffers,
  ].join('\n')
}
