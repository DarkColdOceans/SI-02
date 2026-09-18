import { useEffect, useRef } from 'react'
import type { FactoryState } from '../digitalTwin/types'

interface Props {
  factoryState: FactoryState
  overallUtilization: number
}

interface KpiItem {
  label: string
  value: string | number
  unit?: string
  color: string
}

export function KpiBar({ factoryState, overallUtilization }: Props) {
  const kpis: KpiItem[] = [
    {
      label: 'Sim Time',
      value: `T+${factoryState.simulationTime}`,
      unit: 'min',
      color: 'text-cyan-400',
    },
    {
      label: 'Throughput',
      value: factoryState.throughput.toFixed(0),
      unit: '/min',
      color: 'text-emerald-400',
    },
    {
      label: 'Total Produced',
      value: factoryState.totalProduction.toLocaleString(),
      unit: 'tabs',
      color: 'text-blue-400',
    },
    {
      label: 'WIP',
      value: factoryState.wip.toLocaleString(),
      unit: 'units',
      color: 'text-amber-400',
    },
    {
      label: 'Overall Util',
      value: `${overallUtilization.toFixed(1)}`,
      unit: '%',
      color: overallUtilization >= 80 ? 'text-violet-400' : 'text-slate-300',
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-3 w-full">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} />
      ))}
    </div>
  )
}

function KpiCard({ kpi }: { kpi: KpiItem }) {
  const valueRef = useRef<HTMLSpanElement>(null)
  const prevValueRef = useRef(kpi.value)

  useEffect(() => {
    if (prevValueRef.current !== kpi.value) {
      const el = valueRef.current
      if (el) {
        el.animate(
          [
            { transform: 'translateY(-4px)', opacity: 0.5 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          { duration: 250, easing: 'ease-out' },
        )
      }
      prevValueRef.current = kpi.value
    }
  }, [kpi.value])

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-sm p-3">
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
        {kpi.label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          ref={valueRef}
          className={`text-xl font-bold font-mono tabular-nums ${kpi.color}`}
        >
          {kpi.value}
        </span>
        {kpi.unit && (
          <span className="text-[10px] text-slate-500">{kpi.unit}</span>
        )}
      </div>
    </div>
  )
}
