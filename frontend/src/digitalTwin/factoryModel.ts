import type { BufferSpec, FactoryState, LineBuffer, Machine, MachineSpec } from './types'

/**
 * Prototype tablet line: Raw Material → M1…M6 → Finished Tablets.
 * Capacities and processing times are simulated demo values only.
 * They are not claimed to represent real pharmaceutical equipment.
 */
export const PRODUCTION_LINE = [
  'Raw Material',
  'M1 Mixing',
  'M2 Granulation',
  'M3 Compression',
  'M4 Coating',
  'M5 Inspection',
  'M6 Packing',
  'Finished Tablets',
] as const

export const MACHINE_SPECS: readonly MachineSpec[] = [
  {
    id: 'M1',
    name: 'M1 Mixing',
    stage: 'Mixing',
    capacityPerMinute: 120,
    processingTime: 0.5,
  },
  {
    id: 'M2',
    name: 'M2 Granulation',
    stage: 'Granulation',
    capacityPerMinute: 110,
    processingTime: 0.55,
  },
  {
    id: 'M3',
    name: 'M3 Compression',
    stage: 'Compression',
    capacityPerMinute: 80,
    processingTime: 0.75,
  },
  {
    id: 'M4',
    name: 'M4 Coating',
    stage: 'Coating',
    capacityPerMinute: 100,
    processingTime: 0.6,
  },
  {
    id: 'M5',
    name: 'M5 Inspection',
    stage: 'Inspection',
    capacityPerMinute: 90,
    processingTime: 0.67,
  },
  {
    id: 'M6',
    name: 'M6 Packing',
    stage: 'Packing',
    capacityPerMinute: 100,
    processingTime: 0.6,
  },
]

/** In-process buffers between consecutive machines (B1: M1→M2 … B5: M5→M6). */
export const BUFFER_SPECS: readonly BufferSpec[] = [
  { id: 'B1', sourceMachine: 'M1', destinationMachine: 'M2', maxCapacity: 250 },
  { id: 'B2', sourceMachine: 'M2', destinationMachine: 'M3', maxCapacity: 250 },
  { id: 'B3', sourceMachine: 'M3', destinationMachine: 'M4', maxCapacity: 250 },
  { id: 'B4', sourceMachine: 'M4', destinationMachine: 'M5', maxCapacity: 250 },
  { id: 'B5', sourceMachine: 'M5', destinationMachine: 'M6', maxCapacity: 250 },
]

export function createMachineFromSpec(spec: MachineSpec): Machine {
  return {
    ...spec,
    status: 'IDLE',
    downtimeRemaining: 0,
    inputRate: 0,
    outputRate: 0,
    utilization: 0,
    queue: 0,
    totalProcessed: 0,
    rejectionRate: 0,
  }
}

export function createBufferFromSpec(spec: BufferSpec): LineBuffer {
  return {
    ...spec,
    quantity: 0,
  }
}

export function createInitialMachines(): Machine[] {
  return MACHINE_SPECS.map(createMachineFromSpec)
}

export function createInitialBuffers(): LineBuffer[] {
  return BUFFER_SPECS.map(createBufferFromSpec)
}

export function createInitialFactoryState(): FactoryState {
  return {
    simulationTime: 0,
    machines: createInitialMachines(),
    buffers: createInitialBuffers(),
    totalProduction: 0,
    throughput: 0,
    wip: 0,
    rejectedUnits: {},
  }
}

export const INITIAL_FACTORY_STATE: FactoryState = createInitialFactoryState()
