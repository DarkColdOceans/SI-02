export type MachineId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6'

export type BufferId = 'B1' | 'B2' | 'B3' | 'B4' | 'B5'

export type MachineStatus =
  | 'RUNNING'
  | 'IDLE'
  | 'STARVED'
  | 'BLOCKED'
  | 'DOWN'
  | 'BOTTLENECK'

export interface Machine {
  id: MachineId
  name: string
  stage: string
  capacityPerMinute: number
  processingTime: number
  status: MachineStatus
  downtimeRemaining: number
  inputRate: number
  outputRate: number
  utilization: number
  queue: number
  totalProcessed: number
  /** Fraction of processed output rejected (0–1). Default: 0 (no rejection). */
  rejectionRate: number
}

export interface LineBuffer {
  id: BufferId
  sourceMachine: MachineId
  destinationMachine: MachineId
  quantity: number
  maxCapacity: number
}

export interface FactoryState {
  simulationTime: number
  machines: Machine[]
  buffers: LineBuffer[]
  totalProduction: number
  throughput: number
  wip: number
  /** Raw-material input rate for M1 (units/min). undefined = unlimited. */
  rawMaterialInputRate?: number
  /** Cumulative rejected units per machine ID during simulation. */
  rejectedUnits: Record<string, number>
}

export type DigitalTwinState = FactoryState

export interface MachineSpec {
  id: MachineId
  name: string
  stage: string
  capacityPerMinute: number
  processingTime: number
}

export interface BufferSpec {
  id: BufferId
  sourceMachine: MachineId
  destinationMachine: MachineId
  maxCapacity: number
}
