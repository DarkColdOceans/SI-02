/**
 * WhatIfPanel.tsx
 *
 * What-If Scenario panel for the digital-twin dashboard.
 *
 * Renders:
 *  1. Scenario configuration form (machine, type, value)
 *  2. Run / Clear buttons
 *  3. Baseline vs Scenario side-by-side comparison (when result is available)
 *  4. Scenario Impact delta summary
 *
 * Completely isolated from the live simulation — receives liveState +
 * liveHistory as read-only inputs and never writes back to them.
 */

import { useEffect, useRef } from 'react'
import { MACHINE_SPECS } from '../digitalTwin/factoryModel'
import type { ScenarioResult, ScenarioSnapshot } from '../digitalTwin/scenarioEngine'
import { SCENARIO_WINDOW_MINUTES } from '../digitalTwin/scenarioEngine'
import type { FactoryState, MachineId } from '../digitalTwin/types'
import { getBaselineCapacity, useWhatIf } from '../hooks/useWhatIf'
import type { ScenarioType } from '../digitalTwin/scenarioEngine'

interface Props {
  liveState: FactoryState
  /** Rolling history from the live simulation (read-only) */
  liveHistory: FactoryState[]
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  return n.toFixed(decimals)
}

function deltaClass(value: number, lowerIsBetter = false): string {
  if (value === 0) return 'text-slate-400'
  const positive = lowerIsBetter ? value < 0 : value > 0
  return positive ? 'text-emerald-400' : 'text-red-400'
}

function deltaSign(value: number): string {
  if (value > 0) return '+'
  if (value < 0) return ''
  return '±'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SnapshotColumn({
  label,
  snapshot,
  accent,
}: {
  label: string
  snapshot: ScenarioSnapshot
  accent: string
}) {
  const bn = snapshot.analysis.line.bottleneck
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0">
      <div className={`text-[9px] font-bold uppercase tracking-widest ${accent} mb-1`}>
        {label}
      </div>
      <MetricRow label="Production" value={`${snapshot.state.totalProduction.toLocaleString()} tabs`} />
      <MetricRow label="Throughput" value={`${fmt(snapshot.state.throughput)}/min`} />
      <MetricRow label="WIP" value={`${snapshot.state.wip.toLocaleString()} units`} />
      <MetricRow label="Utilization" value={`${fmt(snapshot.overallUtilization, 1)}%`} />
      <MetricRow
        label="Bottleneck"
        value={bn ? `${bn.machineId} · ${bn.machineName.split(' ').slice(1).join(' ')}` : '—'}
      />
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-[11px] font-mono font-semibold text-slate-200 leading-tight truncate">
        {value}
      </span>
    </div>
  )
}

function DeltaRow({
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
  const cls = deltaClass(value, lowerIsBetter)
  const sign = deltaSign(value)
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/60 last:border-0">
      <span className="text-[10px] text-slate-400">{label}</span>
      <span className={`text-[11px] font-mono font-bold tabular-nums ${cls}`}>
        {sign}{fmt(value)}{unit}
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

  // Animate result appearance
  const resultRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 350, easing: 'ease-out', fill: 'forwards' },
      )
    }
  }, [result])

  const baselineCap = getBaselineCapacity(form.machineId)
  const liveMachine = liveState.machines.find((m) => m.id === form.machineId)
  const liveCap = liveMachine?.capacityPerMinute ?? baselineCap

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-5 flex flex-col gap-5">

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-cyan-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-300">
          What-If Scenario
        </h3>
        <span className="ml-auto text-[9px] text-slate-500 font-mono">
          +{SCENARIO_WINDOW_MINUTES} sim-min window
        </span>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Machine selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
            Machine
          </label>
          <select
            value={form.machineId}
            onChange={(e) => setMachineId(e.target.value as MachineId)}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-600 transition-colors"
          >
            {MACHINE_SPECS.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.id} · {spec.name.split(' ').slice(1).join(' ')} ({spec.capacityPerMinute}/min)
              </option>
            ))}
          </select>
        </div>

        {/* Scenario type */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
            Scenario
          </label>
          <div className="flex gap-2">
            {(['capacity', 'downtime'] as ScenarioType[]).map((t) => (
              <button
                key={t}
                onClick={() => setScenarioType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  form.scenarioType === t
                    ? 'border-cyan-600 bg-cyan-900/50 text-cyan-200'
                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                {t === 'capacity' ? 'Capacity Change' : 'Downtime'}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional value input */}
        {form.scenarioType === 'capacity' ? (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
              New Capacity (units/min)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                step={1}
                value={form.newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-600 transition-colors font-mono"
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>Baseline (spec): {baselineCap}/min</span>
              {liveCap !== baselineCap && (
                <span className="text-amber-500">Live: {liveCap}/min</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-widest text-slate-500 font-medium">
              Downtime Duration (sim minutes)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.downtimeDuration}
              onChange={(e) => setDowntimeDuration(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-600 transition-colors font-mono"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-700/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => runScenarioAction(liveState, liveHistory)}
            disabled={isRunning}
            className="flex-1 rounded-lg border border-cyan-700/60 bg-cyan-900/40 px-3 py-2.5 text-xs font-bold text-cyan-200 uppercase tracking-wider transition-all duration-200 hover:bg-cyan-800/60 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {isRunning ? '⟳ Running…' : '▶ Run Scenario'}
          </button>
          {result && (
            <button
              onClick={clearResult}
              className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider transition-all duration-200 hover:bg-slate-700/50 active:scale-95"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Comparison results ────────────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="flex flex-col gap-4">

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[9px] uppercase tracking-widest text-slate-600">
              Results · +{result.windowMinutes} sim-min
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Side-by-side columns */}
          <ComparisonColumns result={result} />

          {/* Impact table */}
          <ImpactTable result={result} />
        </div>
      )}
    </div>
  )
}

// ─── Comparison columns ───────────────────────────────────────────────────────

function ComparisonColumns({ result }: { result: ScenarioResult }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-3">
        <SnapshotColumn
          label="Baseline"
          snapshot={result.baselineSnapshot}
          accent="text-slate-400"
        />
      </div>
      <div className="rounded-xl border border-cyan-700/40 bg-cyan-950/20 p-3">
        <SnapshotColumn
          label="Scenario"
          snapshot={result.scenarioSnapshot}
          accent="text-cyan-400"
        />
      </div>
    </div>
  )
}

// ─── Impact table ─────────────────────────────────────────────────────────────

function ImpactTable({ result }: { result: ScenarioResult }) {
  const { delta } = result
  const { baselineBnId, scenarioBnId, bottleneckChanged } = delta

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-3 flex flex-col gap-0.5">
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
        Scenario Impact
      </div>
      <DeltaRow label="Production" value={delta.production} unit=" tabs" />
      <DeltaRow label="Throughput" value={delta.throughput} unit="/min" />
      <DeltaRow label="WIP" value={delta.wip} unit=" units" lowerIsBetter />
      <DeltaRow label="Avg Utilization" value={delta.overallUtilization} unit="%" />

      {/* Bottleneck change row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-slate-400">Bottleneck</span>
        {bottleneckChanged ? (
          <span className="text-[10px] font-mono font-bold text-amber-400">
            {baselineBnId ?? '—'} → {scenarioBnId ?? '—'}
          </span>
        ) : (
          <span className="text-[10px] font-mono font-semibold text-slate-500">
            unchanged ({baselineBnId ?? '—'})
          </span>
        )}
      </div>
    </div>
  )
}
