/**
 * ScenarioPanel.tsx — Multi-variable Scenario Simulation UI.
 *
 * Replaces WhatIfPanel.tsx.  Allows users to compose a scenario with
 * multiple mutations, run it against the live simulation, and view
 * baseline-vs-scenario comparison results.
 */

import { useEffect, useRef } from 'react'
import type { FactoryState } from '../digitalTwin/types'
import type { ScenarioResult, ScenarioSnapshot } from '../digitalTwin/scenarioTypes'
import { BOUNDS } from '../digitalTwin/scenarioTypes'
import { useScenario } from '../hooks/useScenario'
import { MutationCard } from './scenario/MutationCard'
import { AddMutationMenu } from './scenario/AddMutationMenu'
import { ScenarioSlider } from './scenario/ScenarioSlider'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  liveState: FactoryState
  liveHistory: FactoryState[]
  onResult?: (result: ScenarioResult | null) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 0) {
  return n.toFixed(dec)
}

function deltaColor(value: number, lowerIsBetter = false) {
  if (value === 0) return 'text-[#A3A3A3]'
  const good = lowerIsBetter ? value < 0 : value > 0
  return good ? 'text-emerald-700' : 'text-[#C62828]'
}

function deltaSign(value: number) {
  if (value > 0) return '+'
  return ''
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

export function ScenarioPanel({ liveState, liveHistory, onResult }: Props) {
  const {
    scenario,
    result,
    error,
    isRunning,
    validationErrors,
    setName,
    setWindowMinutes,
    addMutation,
    updateMutation,
    removeMutation,
    clearMutations,
    runScenarioAction,
    clearResult,
    hasRawMaterialChange,
    isAtMaxMutations,
  } = useScenario()

  // Animate result in
  const resultRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.animate(
        [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 300, easing: 'ease-out', fill: 'forwards' },
      )
    }
    onResult?.(result)
  }, [result, onResult])

  const hasValidationErrors = validationErrors.length > 0
  const mutationErrorIndices = new Set(
    validationErrors.filter((e) => e.mutationIndex >= 0).map((e) => e.mutationIndex),
  )
  const canRun = scenario.mutations.length > 0 && !hasValidationErrors && !isRunning

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 flex flex-col gap-5 shadow-sm">

      {/* ── Section title ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-[#C62828]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C62828]">
          Scenario Simulation
        </h3>
        <span className="ml-auto text-[9px] font-mono text-[#A3A3A3]">
          {scenario.mutations.length} change{scenario.mutations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Scenario header: name + window ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="scenario-name" className="text-[9px] font-semibold text-[#666666] uppercase tracking-wider">
            Scenario Name
          </label>
          <input
            id="scenario-name"
            type="text"
            value={scenario.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production Stress Test"
            className="rounded border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-2 text-xs text-[#1F1F1F] placeholder:text-[#A3A3A3] focus:border-[#C62828] focus:outline-none focus:ring-1 focus:ring-[#C62828]/20 transition-colors"
          />
        </div>

        {/* Window slider */}
        <ScenarioSlider
          id="scenario-window"
          label="Simulation Window"
          min={BOUNDS.windowMinutes.min}
          max={BOUNDS.windowMinutes.max}
          step={BOUNDS.windowMinutes.step}
          value={scenario.windowMinutes}
          displayValue={`${scenario.windowMinutes} min`}
          onChange={setWindowMinutes}
        />
      </div>

      {/* ── Mutations list ──────────────────────────────────────────────── */}
      {scenario.mutations.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#666666]">
              Changes
            </span>
            {scenario.mutations.length > 1 && (
              <button
                onClick={clearMutations}
                className="text-[9px] font-semibold text-[#A3A3A3] hover:text-[#C62828] transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          {scenario.mutations.map((mutation, index) => (
            <MutationCard
              key={`${mutation.kind}-${index}`}
              mutation={mutation}
              index={index}
              onChange={updateMutation}
              onRemove={removeMutation}
              hasError={mutationErrorIndices.has(index)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {scenario.mutations.length === 0 && (
        <div className="rounded border border-dashed border-[#E5E5E5] bg-[#F7F7F7] px-4 py-6 text-center">
          <div className="text-xs text-[#A3A3A3]">No changes added yet</div>
          <div className="text-[10px] text-[#666666] mt-1">
            Add production line changes below to build a scenario
          </div>
        </div>
      )}

      {/* ── Add mutation menu ──────────────────────────────────────────── */}
      <AddMutationMenu
        onAdd={addMutation}
        hasRawMaterialChange={hasRawMaterialChange}
        disabled={isAtMaxMutations}
      />

      {/* ── Warnings ───────────────────────────────────────────────────── */}
      {result && result.warnings.length > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2">
          {result.warnings.map((w, i) => (
            <div key={i} className="text-[10px] text-amber-700">⚠ {w}</div>
          ))}
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={() => runScenarioAction(liveState, liveHistory)}
          disabled={!canRun}
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

      {/* ── Results ────────────────────────────────────────────────────── */}
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

          {/* Applied mutations summary */}
          <div className="rounded border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-2">
            <div className="text-[8px] uppercase tracking-widest text-[#666666] font-semibold mb-1">
              Applied Changes ({result.appliedMutations.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {result.appliedMutations.map((m, i) => (
                <span
                  key={i}
                  className="rounded bg-white border border-[#E5E5E5] px-2 py-0.5 text-[9px] font-mono text-[#1F1F1F]"
                >
                  {formatMutationBadge(m)}
                </span>
              ))}
            </div>
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
              label={result.scenarioName || 'Scenario'}
              snapshot={result.scenarioSnapshot}
              accentText="text-[#C62828]"
              accentBorder="border-red-200"
              headerBg="bg-red-50"
            />
          </div>

          {/* Impact summary */}
          <div className={`rounded border border-[#E5E5E5] bg-[#F7F7F7] p-4 ${result.delta.bottleneckChanged || result.delta.scenarioBnId ? 'scenario-bottleneck-callout' : ''}`}>
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
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] mt-2">
                <span className="text-[10px] text-[#666666]">Rejected Units</span>
                <span className="text-[11px] font-mono font-bold text-[#C62828]">
                  {result.delta.totalRejected > 0 ? '+' : ''}{result.delta.totalRejected}
                </span>
              </div>
            {/* Bottleneck change */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5] mt-2">
              <span className="text-[9px] uppercase tracking-widest text-[#666666]">Bottleneck Change</span>
              {result.delta.bottleneckChanged ? (
                <span className="text-xs font-mono font-bold text-orange-600">
                  {result.delta.baselineBnId ?? '—'} → {result.delta.scenarioBnId ?? '—'}
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-[#C62828]">
                  {result.delta.scenarioBnId ? `ACTIVE — ${result.delta.scenarioBnId}` : 'NONE'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Formatting helper ────────────────────────────────────────────────────────

import type { ScenarioMutation } from '../digitalTwin/scenarioTypes'

function formatMutationBadge(m: ScenarioMutation): string {
  switch (m.kind) {
    case 'rawMaterial':
      return `Raw: ${m.inputRate}/min`
    case 'capacity':
      return `${m.machineId} cap: ${m.capacityPerMinute}/min`
    case 'downtime':
      return `${m.machineId} down: ${m.durationMinutes}min`
    case 'rejectionRate':
      return `${m.machineId} rej: ${Math.round(m.rejectionRate * 100)}%`
    case 'bufferCapacity':
      return `${m.bufferId} cap: ${m.maxCapacity}`
  }
}
