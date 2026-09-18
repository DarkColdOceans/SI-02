import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeFactory } from '../digitalTwin/bottleneckEngine'
import type { FactoryAnalysis } from '../digitalTwin/bottleneckEngine'
import {
  createInitialFactoryState,
  injectDowntime,
  stepSimulation,
} from '../digitalTwin/simulationEngine'
import type { FactoryState, MachineId } from '../digitalTwin/types'

/** 1 real second = 1 simulated minute */
const TICK_INTERVAL_MS = 1000

export interface UseDigitalTwinReturn {
  factoryState: FactoryState
  /** Rolling 30-tick history — READ-ONLY; do not mutate. */
  liveHistory: FactoryState[]
  analysis: FactoryAnalysis
  isRunning: boolean
  start: () => void
  pause: () => void
  reset: () => void
  injectM4Downtime: () => void
  injectM5Slowdown: () => void
  clearFaults: () => void
}

function buildInitialAnalysis(state: FactoryState): FactoryAnalysis {
  return analyzeFactory(state, [])
}

export function useDigitalTwin(): UseDigitalTwinReturn {
  const [factoryState, setFactoryState] = useState<FactoryState>(() =>
    createInitialFactoryState(),
  )
  const [analysis, setAnalysis] = useState<FactoryAnalysis>(() =>
    buildInitialAnalysis(createInitialFactoryState()),
  )
  const [isRunning, setIsRunning] = useState(false)

  // Keep a mutable ref so the interval callback always sees latest state
  const stateRef = useRef<FactoryState>(factoryState)
  const historyRef = useRef<FactoryState[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track slowdown so we can restore capacity
  const m5SlowedRef = useRef(false)

  const tick = useCallback(() => {
    const next = stepSimulation(stateRef.current)
    // Keep a rolling history window (last 30 ticks)
    historyRef.current = [...historyRef.current, next].slice(-30)
    const nextAnalysis = analyzeFactory(next, historyRef.current)
    stateRef.current = next
    setFactoryState(next)
    setAnalysis(nextAnalysis)
  }, [])

  const start = useCallback(() => {
    if (intervalRef.current) return
    setIsRunning(true)
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS)
  }, [tick])

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
    m5SlowedRef.current = false
    const fresh = createInitialFactoryState()
    stateRef.current = fresh
    historyRef.current = []
    setFactoryState(fresh)
    setAnalysis(buildInitialAnalysis(fresh))
  }, [])

  const injectM4Downtime = useCallback(() => {
    const next = injectDowntime(stateRef.current, 'M4' as MachineId, 5)
    stateRef.current = next
    setFactoryState(next)
  }, [])

  const injectM5Slowdown = useCallback(() => {
    if (m5SlowedRef.current) return
    m5SlowedRef.current = true
    setFactoryState((prev) => {
      const next = { ...prev, machines: prev.machines.map((m) => {
        if (m.id === 'M5') {
          return { ...m, capacityPerMinute: Math.round(m.capacityPerMinute * 0.4) }
        }
        return m
      })}
      stateRef.current = next
      return next
    })
  }, [])

  const clearFaults = useCallback(() => {
    // Clear downtimes and restore M5 if it was slowed
    setFactoryState((prev) => {
      const originalM5Cap = 90 // from MACHINE_SPECS
      const next = {
        ...prev,
        machines: prev.machines.map((m) => {
          if (m.status === 'DOWN' || m.downtimeRemaining > 0) {
            return { ...m, status: 'IDLE' as const, downtimeRemaining: 0 }
          }
          if (m.id === 'M5' && m5SlowedRef.current) {
            return { ...m, capacityPerMinute: originalM5Cap }
          }
          return m
        }),
      }
      m5SlowedRef.current = false
      stateRef.current = next
      return next
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return {
    factoryState,
    liveHistory: historyRef.current,
    analysis,
    isRunning,
    start,
    pause,
    reset,
    injectM4Downtime,
    injectM5Slowdown,
    clearFaults,
  }
}
