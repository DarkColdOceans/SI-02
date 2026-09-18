import type { FactoryAnalysis } from '../digitalTwin/bottleneckEngine'

interface Props {
  analysis: FactoryAnalysis
}

export function BottleneckPanel({ analysis }: Props) {
  const { line } = analysis
  const bn = line.bottleneck

  const confidencePct = bn ? Math.round(bn.confidence * 100) : 0
  const confidenceColor =
    confidencePct >= 80
      ? 'text-violet-400'
      : confidencePct >= 50
        ? 'text-amber-400'
        : 'text-slate-400'

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm p-5 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300">
          Bottleneck Intelligence
        </h3>
      </div>

      {/* Primary bottleneck */}
      <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-4">
        {bn ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[9px] uppercase tracking-widest text-slate-500">
                  Primary Bottleneck
                </div>
                <div className="text-lg font-bold text-violet-200 font-mono">
                  {bn.machineId}
                  <span className="ml-1.5 text-xs font-normal text-slate-400">
                    {bn.machineName}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-slate-500">
                  Confidence
                </div>
                <div className={`text-xl font-bold font-mono tabular-nums ${confidenceColor}`}>
                  {confidencePct}%
                </div>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-700"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic">
            No bottleneck detected — insufficient data or no constraints active.
          </div>
        )}
      </div>

      {/* Signals / Reasons */}
      {bn && bn.reasons.length > 0 && (
        <div>
          <div className="mb-2 text-[9px] uppercase tracking-widest text-slate-500 font-medium">
            Signals
          </div>
          <ul className="flex flex-col gap-1">
            {bn.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="mt-0.5 text-violet-500">›</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Machine state summaries */}
      <div className="grid grid-cols-3 gap-3">
        <MachineStateGroup
          label="Blocked"
          ids={line.blockedMachines}
          color="text-orange-400"
          bg="bg-orange-950/40 border-orange-500/30"
          emptyText="None"
        />
        <MachineStateGroup
          label="Starved"
          ids={line.starvedMachines}
          color="text-amber-400"
          bg="bg-amber-950/40 border-amber-500/30"
          emptyText="None"
        />
        <MachineStateGroup
          label="Down"
          ids={line.downMachines}
          color="text-red-400"
          bg="bg-red-950/40 border-red-500/30"
          emptyText="None"
        />
      </div>

      {/* Production loss estimate */}
      <div className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          Est. Production Loss
        </span>
        <span className={`text-sm font-bold font-mono tabular-nums ${
          line.estimatedProductionLoss > 0 ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {line.estimatedProductionLoss > 0 ? `-${line.estimatedProductionLoss.toFixed(0)}` : '0'}
          <span className="ml-0.5 text-[9px] text-slate-500">/min</span>
        </span>
      </div>
    </div>
  )
}

function MachineStateGroup({
  label,
  ids,
  color,
  bg,
  emptyText,
}: {
  label: string
  ids: string[]
  color: string
  bg: string
  emptyText: string
}) {
  return (
    <div className={`rounded-lg border p-2 ${bg}`}>
      <div className={`mb-1 text-[8px] uppercase tracking-widest font-semibold ${color}`}>
        {label}
      </div>
      {ids.length === 0 ? (
        <div className="text-[10px] text-slate-600 italic">{emptyText}</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {ids.map((id) => (
            <span
              key={id}
              className={`rounded px-1 py-0.5 text-[10px] font-mono font-bold ${color} bg-black/20`}
            >
              {id}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
