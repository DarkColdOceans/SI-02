import type { FactoryAnalysis } from '../digitalTwin/bottleneckEngine'

interface Props {
  analysis: FactoryAnalysis
}

export function BottleneckPanel({ analysis }: Props) {
  const { line } = analysis
  const bn = line.bottleneck
  const confidencePct = bn ? Math.round(bn.confidence * 100) : 0

  // Confidence color
  const confidenceColor =
    confidencePct >= 80 ? 'text-[#C62828]'
    : confidencePct >= 50 ? 'text-amber-600'
    : 'text-[#666666]'

  const confidenceBarColor =
    confidencePct >= 80 ? 'bg-[#C62828]'
    : confidencePct >= 50 ? 'bg-amber-500'
    : 'bg-[#A3A3A3]'

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 flex flex-col gap-4 shadow-sm">

      {/* Section title */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-[#C62828] animate-dot-slow" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C62828]">
          Bottleneck Intelligence
        </h3>
      </div>

      {/* Primary bottleneck card */}
      <div className={`rounded border p-3 status-transition ${
        bn
          ? 'border-[#C62828] bg-red-50/50 shadow-sm'
          : 'border-[#E5E5E5] bg-[#F7F7F7]'
      }`}>
        {bn ? (
          <div className="flex flex-col gap-3">
            {/* Badge row */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#C62828] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-dot-slow flex-shrink-0" />
                ⚠ Bottleneck
              </span>
            </div>

            {/* Machine identity + confidence */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-[#1F1F1F] font-mono leading-none">
                  {bn.machineId}
                </div>
                <div className="text-[11px] text-[#666666] mt-0.5 font-semibold">{bn.machineName}</div>
                <div className="text-[9px] text-[#A3A3A3] mt-1 uppercase tracking-widest">Primary Constraint</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] uppercase tracking-widest text-[#666666] mb-1">Confidence</div>
                <div className={`text-2xl font-bold font-mono tabular-nums leading-none ${confidenceColor}`}>
                  {confidencePct}%
                </div>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="h-1 w-full rounded-full bg-[#E5E5E5] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confidenceBarColor}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#A3A3A3] italic py-1">
            No bottleneck detected — run simulation or inject more ticks.
          </div>
        )}
      </div>

      {/* Signal reasons */}
      {bn && bn.reasons.length > 0 && (
        <div>
          <div className="text-[8px] uppercase tracking-widest text-[#666666] font-semibold mb-2">
            Detection Signals
          </div>
          <ul className="flex flex-col gap-1.5">
            {bn.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#C62828] font-bold leading-tight mt-0.5 flex-shrink-0">›</span>
                <span className="text-xs text-[#666666] leading-snug">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Machine state groups — light semantic colors */}
      <div className="grid grid-cols-3 gap-2">
        {/* Blocked → orange */}
        <StateGroup
          label="Blocked"
          ids={line.blockedMachines}
          textColor="text-orange-700"
          borderColor="border-orange-200"
          bgColor="bg-orange-50"
        />
        {/* Starved → blue */}
        <StateGroup
          label="Starved"
          ids={line.starvedMachines}
          textColor="text-blue-700"
          borderColor="border-blue-200"
          bgColor="bg-blue-50"
        />
        {/* Down → red */}
        <StateGroup
          label="Down"
          ids={line.downMachines}
          textColor="text-red-700"
          borderColor="border-red-200"
          bgColor="bg-red-50"
        />
      </div>

      {/* Production loss */}
      <div className="flex items-center justify-between border border-[#E5E5E5] rounded px-3 py-2 bg-[#F7F7F7]">
        <span className="text-[9px] uppercase tracking-widest text-[#666666] font-semibold">Est. Production Loss</span>
        <span className={`text-sm font-mono font-bold tabular-nums ${
          line.estimatedProductionLoss > 0 ? 'text-[#C62828]' : 'text-emerald-700'
        }`}>
          {line.estimatedProductionLoss > 0
            ? `−${line.estimatedProductionLoss.toFixed(0)}`
            : '0'
          }
          <span className="text-[9px] text-[#A3A3A3] ml-0.5">/min</span>
        </span>
      </div>
    </div>
  )
}

function StateGroup({
  label, ids, textColor, borderColor, bgColor,
}: {
  label: string
  ids: string[]
  textColor: string
  borderColor: string
  bgColor: string
}) {
  return (
    <div className={`rounded border ${borderColor} ${bgColor} p-2 status-transition`}>
      <div className={`text-[8px] uppercase tracking-widest font-bold ${textColor} mb-1.5`}>{label}</div>
      {ids.length === 0 ? (
        <span className="text-[9px] text-slate-400 italic">—</span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {ids.map((id) => (
            <span key={id} className={`text-[10px] font-mono font-bold ${textColor}`}>{id}</span>
          ))}
        </div>
      )}
    </div>
  )
}
