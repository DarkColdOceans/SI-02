/**
 * WhatIfPanel.tsx — What-If Scenario UI
 *
 * Inputs replaced with HTML range sliders per UX requirement.
 * All scenario values still flow into scenarioEngine.ts unchanged.
 * No simulation logic lives here.
 */

import { useEffect, useRef } from 'react'
import { MACHINE_SPECS } from '../digitalTwin/factoryModel'
import type { ScenarioSnapshot, ScenarioType } from '../digitalTwin/scenarioEngine'
import { SCENARIO_WINDOW_MINUTES } from '../digitalTwin/scenarioEngine'
import type { FactoryState, MachineId } from '../digitalTwin/types'
import { getBaselineCapacity, useWhatIf } from '../hooks/useWhatIf'

// ─── Slider config ────────────────────────────────────────────────────────────

const CAPACITY_MIN = 20
const CAPACITY_MAX = 120
const CAPACITY_STEP = 5

const DOWNTIME_MIN = 1
const DOWNTIME_MAX = 30
const DOWNTIME_STEP = 1

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface Props {
  liveState: FactoryState
  liveHistory: FactoryState[]
}

function fmt(n: number, dec = 0) { return n.toFixed(dec) }

function deltaColor(value: number, lowerIsBetter = false) {
  if (value === 0) return 'text-[#A3A3A3]'
  const good = lowerIsBetter ? value < 0 : value > 0
  return good ? 'text-emerald-700' : 'text-[#C62828]'
}

function deltaSign(value: number) {
  if (value > 0) return '+'
  return ''
}

// ─── Slider primitive ─────────────────────────────────────────────────────────

function ScenarioSlider({
  id,
  label,
  min,
  max,
  step,
  value,
  displayValue,
  minLabel,
  maxLabel,
  onChange,
}: {
  id: string
  label: string
  min: number
  max: number
  step: number
  value: number
  displayValue: string
  minLabel: string
  maxLabel: string
  onChange: (v: string) => void
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-3 w-full">
      <label htmlFor={id} className="text-xs font-semibold text-[#1F1F1F]">
        {label}
      </label>

      {/* Slider row with min/max labels inline */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-[10px] font-mono text-[#A3A3A3] w-6 text-right flex-shrink-0">
          {minLabel}
        </span>
        
        {/* Track container */}
        <div className="relative flex-1 h-6 flex items-center group">
          {/* filled portion */}
          <div
            className="absolute left-0 h-1.5 rounded-full bg-[#C62828] pointer-events-none transition-all duration-75"
            style={{ width: `${pct}%` }}
          />
          {/* unfilled portion */}
          <div
            className="absolute right-0 h-1.5 rounded-full bg-[#E5E5E5] pointer-events-none transition-all duration-75"
            style={{ width: `${100 - pct}%` }}
          />
          
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer"
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
          />
          
          {/* Thumb visual */}
          <div
            className="absolute h-4 w-4 rounded-full bg-white border-2 border-[#C62828] shadow-md pointer-events-none transition-[left] duration-75 peer-focus-visible:ring-2 peer-focus-visible:ring-[#C62828] peer-focus-visible:ring-offset-2 group-hover:scale-110 group-active:scale-95"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>

        <span className="text-[10px] font-mono text-[#A3A3A3] w-6 text-left flex-shrink-0">
          {maxLabel}
        </span>
      </div>

      {/* Current value readout directly beneath the slider track */}
      <div className="text-center mt-[-4px]">
        <span className="text-xs font-bold font-mono text-[#C62828] bg-red-50 px-2 py-0.5 rounded border border-red-100">
          {displayValue}
        </span>
      </div>
    </div>
  )
}

// ─── Snapshot column ─────────────────────────────────────────────────────────

function SnapshotColumn({
  label,
  snapshot,
  accentText,
  accentBorder,
  headerBg,
}: {
  label: string
  snapshot: ScenarioSnapshot
  accentText: string
  accentBorder: string
  headerBg: string
}) {
  const bn = snapshot.analysis.line.bottleneck
  return (
    <div className={`flex flex-col gap-0 rounded border ${accentBorder} bg-white overflow-hidden shadow-sm`}>
      <div className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${accentText} ${headerBg} border-b ${accentBorder}`}>
        {label}
      </div>
      <div className="flex flex-col divide-y divide-[#E5E5E5]">
        <Row label="Production" value={snapshot.state.totalProduction.toLocaleString()} unit="tabs" />
        <Row label="Throughput" value={fmt(snapshot.state.throughput)} unit="/min" />
        <Row label="WIP" value={snapshot.state.wip.toLocaleString()} unit="units" />
        <Row label="Utilization" value={fmt(snapshot.overallUtilization, 1)} unit="%" />
        <Row
          label="Bottleneck"
          value={bn ? bn.machineId : '—'}
          unit={bn ? bn.machineName.split(' ').slice(1).join(' ') : ''}
        />
      </div>
    </div>
  )
}

function Row({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="px-3 py-2 flex flex-col gap-0.5">
      <span className="text-[8px] uppercase tracking-wider text-[#A3A3A3]">{label}</span>
      <span className="text-[11px] font-mono font-semibold text-[#1F1F1F] leading-tight">
        {value}<span className="text-[#666666] ml-0.5 text-[9px]">{unit}</span>
      </span>
    </div>
  )
}

// ─── Impact row ──────────────────────────────────────────────────────────────

function ImpactRow({
  label,
  value,
  unit,
  lowerIsBetter,
}: {
  label: string
  value: number
  unit: string
  lowerIsBetter?: boolean
}) {
  const cls = deltaColor(value, lowerIsBetter)
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#E5E5E5] last:border-0">
      <span className="text-[10px] text-[#666666]">{label}</span>
      <span className={`text-[11px] font-mono font-bold tabular-nums ${cls}`}>
        {deltaSign(value)}{fmt(value)}{unit}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WhatIfPanel({ liveState, liveHistory }: Props) {
  const {
    form,
    result,
    error,
    isRunning,
    setMachineId,
    setScenarioType,
    setNewCapacity,
    setDowntimeDuration,
    runScenarioAction,
    clearResult,
  } = useWhatIf()

  // Animate result in
  const resultRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.animate(
        [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 300, easing: 'ease-out', fill: 'forwards' },
      )
    }
  }, [result])

  const baselineCap = getBaselineCapacity(form.machineId)
  const liveMachine = liveState.machines.find((m) => m.id === form.machineId)
  const liveCap = liveMachine?.capacityPerMinute ?? baselineCap

  // Slider numeric values
  const capacityVal = Math.max(CAPACITY_MIN, Math.min(CAPACITY_MAX, Number(form.newCapacity) || baselineCap))
  const downtimeVal = Math.max(DOWNTIME_MIN, Math.min(DOWNTIME_MAX, Number(form.downtimeDuration) || 5))

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 flex flex-col gap-5 shadow-sm">

      {/* Section title */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-[#C62828]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C62828]">
          What-If Scenario
        </h3>
        <span className="ml-auto text-[9px] font-mono text-[#A3A3A3]">
          +{SCENARIO_WINDOW_MINUTES} sim-min window
        </span>
      </div>

      {/* Config form */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.4fr] gap-5 items-start">

        {/* Machine selector */}
        <div className="flex flex-col gap-2">
          <div className="text-[9px] uppercase tracking-widest text-[#666666] font-semibold">Machine</div>
          <div className="flex flex-col gap-1">
            {MACHINE_SPECS.map((spec) => (
              <button
                key={spec.id}
                onClick={() => setMachineId(spec.id as MachineId)}
                className={`text-left rounded border px-3 py-1.5 text-xs transition-colors ${
                  form.machineId === spec.id
                    ? 'border-[#C62828] bg-red-50 text-[#C62828]'
                    : 'border-[#E5E5E5] bg-white text-[#666666] hover:border-[#D4D4D4] hover:text-[#1F1F1F]'
                }`}
              >
                <span className="font-mono font-bold">{spec.id}</span>
                <span className="text-[#A3A3A3] mx-1">—</span>
                <span>{spec.name.replace(/^M\d\s+/, '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario type */}
        <div className="flex flex-col gap-2">
          <div className="text-[9px] uppercase tracking-widest text-[#666666] font-semibold">Scenario Type</div>
          <div className="flex flex-col gap-1">
            {(['capacity', 'downtime'] as ScenarioType[]).map((t) => (
              <button
                key={t}
                onClick={() => setScenarioType(t)}
                className={`rounded border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors text-left ${
                  form.scenarioType === t
                    ? 'border-[#C62828] bg-red-50 text-[#C62828]'
                    : 'border-[#E5E5E5] bg-white text-[#666666] hover:border-[#D4D4D4] hover:text-[#1F1F1F]'
                }`}
              >
                {t === 'capacity' ? 'Capacity Change' : 'Machine Downtime'}
              </button>
            ))}
          </div>

          {/* Baseline info */}
          <div className="mt-1 rounded border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-[#666666] mb-1">
              {form.machineId} Baseline
            </div>
            <div className="text-xs font-mono font-semibold text-[#1F1F1F]">
              {baselineCap} <span className="text-[#A3A3A3] font-normal">units/min</span>
            </div>
            {liveCap !== baselineCap && (
              <div className="text-[9px] text-amber-600 mt-0.5">Live: {liveCap}/min</div>
            )}
          </div>
        </div>

        {/* Slider + actions */}
        <div className="flex flex-col gap-4">
          {form.scenarioType === 'capacity' ? (
            <ScenarioSlider
              id="capacity-slider"
              label="New Capacity"
              min={CAPACITY_MIN}
              max={CAPACITY_MAX}
              step={CAPACITY_STEP}
              value={capacityVal}
              displayValue={`${capacityVal} / min`}
              minLabel={`${CAPACITY_MIN}/min`}
              maxLabel={`${CAPACITY_MAX}/min`}
              onChange={setNewCapacity}
            />
          ) : (
            <ScenarioSlider
              id="downtime-slider"
              label="Downtime Duration"
              min={DOWNTIME_MIN}
              max={DOWNTIME_MAX}
              step={DOWNTIME_STEP}
              value={downtimeVal}
              displayValue={`${downtimeVal} min`}
              minLabel={`${DOWNTIME_MIN} min`}
              maxLabel={`${DOWNTIME_MAX} min`}
              onChange={setDowntimeDuration}
            />
          )}

          {/* Error */}
          {error && (
            <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => runScenarioAction(liveState, liveHistory)}
              disabled={isRunning}
              className="flex-1 rounded border border-transparent bg-[#C62828] py-2.5 text-xs font-bold text-white uppercase tracking-wider transition-colors hover:bg-[#8E1B1B] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isRunning ? '⟳ Running…' : '▶  Run Scenario'}
            </button>
            {result && (
              <button
                onClick={clearResult}
                className="rounded border border-[#C62828] bg-white px-4 py-2.5 text-xs font-semibold text-[#C62828] uppercase tracking-wider transition-colors hover:bg-red-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Results */}
      {result && (
        <div ref={resultRef} className="flex flex-col gap-4 border-t border-[#E5E5E5] pt-4">

          {/* Label row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-[#E5E5E5]" />
            <span className="text-[9px] uppercase tracking-widest text-[#666666] font-semibold">
              Results — +{result.windowMinutes} simulated minutes
            </span>
            <div className="flex-1 h-px bg-[#E5E5E5]" />
          </div>

          {/* Baseline vs Scenario columns */}
          <div className="grid grid-cols-2 gap-3">
            <SnapshotColumn
              label="Baseline"
              snapshot={result.baselineSnapshot}
              accentText="text-[#666666]"
              accentBorder="border-[#E5E5E5]"
              headerBg="bg-[#F7F7F7]"
            />
            <SnapshotColumn
              label="Scenario"
              snapshot={result.scenarioSnapshot}
              accentText="text-[#C62828]"
              accentBorder="border-red-200"
              headerBg="bg-red-50"
            />
          </div>

          {/* Impact summary */}
          <div className="rounded border border-[#E5E5E5] bg-[#F7F7F7] p-4">
            <div className="text-[9px] uppercase tracking-widest text-[#666666] font-semibold mb-3">
              Scenario Impact
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <div>
                <ImpactRow label="Production" value={result.delta.production} unit=" tabs" />
                <ImpactRow label="Throughput" value={result.delta.throughput} unit="/min" />
              </div>
              <div>
                <ImpactRow label="WIP" value={result.delta.wip} unit=" units" lowerIsBetter />
                <ImpactRow label="Avg Utilization" value={result.delta.overallUtilization} unit="%" />
              </div>
            </div>
            {/* Bottleneck change */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] mt-2">
              <span className="text-[9px] uppercase tracking-widest text-[#666666]">Bottleneck Change</span>
              {result.delta.bottleneckChanged ? (
                <span className="text-xs font-mono font-bold text-orange-600">
                  {result.delta.baselineBnId ?? '—'} → {result.delta.scenarioBnId ?? '—'}
                </span>
              ) : (
                <span className="text-xs font-mono text-[#666666]">
                  Unchanged ({result.delta.baselineBnId ?? '—'})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
