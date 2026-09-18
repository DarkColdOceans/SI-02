import { useEffect, useRef } from 'react'
import type { FactoryState } from '../digitalTwin/types'

interface Props {
  factoryState: FactoryState
  overallUtilization: number
}

interface KpiItem {
  label: string
  value: string
  sub: string
  borderColor: string
}

export function KpiBar({ factoryState, overallUtilization }: Props) {
  const kpis: KpiItem[] = [
    {
      label: 'Total Production',
      value: factoryState.totalProduction.toLocaleString(),
      sub: 'tablets',
      borderColor: 'border-l-[#C62828]',
    },
    {
      label: 'Throughput',
      value: factoryState.throughput.toFixed(0),
      sub: 'units / min',
      borderColor: 'border-l-[#C62828]',
    },
    {
      label: 'Work In Progress',
      value: factoryState.wip.toLocaleString(),
      sub: 'units in buffers',
      borderColor: 'border-l-[#C62828]',
    },
    {
      label: 'Overall Utilization',
      value: `${overallUtilization.toFixed(1)}`,
      sub: '% avg across machines',
      borderColor: 'border-l-[#C62828]',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
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
            { transform: 'translateY(-3px)', opacity: 0.4 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          { duration: 200, easing: 'ease-out' },
        )
      }
      prevValueRef.current = kpi.value
    }
  }, [kpi.value])

  return (
    <div className={`flex flex-col gap-1 rounded-lg border border-[#E5E5E5] border-l-4 ${kpi.borderColor} bg-white shadow-sm p-4`}>
      <span className="text-[9px] uppercase tracking-[0.15em] text-[#666666] font-semibold leading-none">
        {kpi.label}
      </span>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          ref={valueRef}
          className="text-2xl font-bold font-mono tabular-nums leading-none text-[#1F1F1F]"
        >
          {kpi.value}
        </span>
      </div>
      <span className="text-[10px] text-[#666666] leading-none">{kpi.sub}</span>
    </div>
  )
}
