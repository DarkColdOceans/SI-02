/**
 * MutationCard.tsx — Wrapper card for individual mutation editors.
 * Renders the mutation kind label, the appropriate editor component,
 * and a remove button.
 */

import type { ScenarioMutation, MutationKind } from '../../digitalTwin/scenarioTypes'
import { CapacityEditor } from './CapacityEditor'
import { DowntimeEditor } from './DowntimeEditor'
import { RejectionRateEditor } from './RejectionRateEditor'
import { RawMaterialEditor } from './RawMaterialEditor'
import { BufferCapacityEditor } from './BufferCapacityEditor'

interface Props {
  mutation: ScenarioMutation
  index: number
  onChange: (index: number, mutation: ScenarioMutation) => void
  onRemove: (index: number) => void
  hasError: boolean
}

const KIND_LABELS: Record<MutationKind, string> = {
  rawMaterial: 'Raw Material Input',
  capacity: 'Machine Capacity',
  downtime: 'Machine Downtime',
  rejectionRate: 'Rejection Rate',
  bufferCapacity: 'Buffer Capacity',
}

const KIND_ICONS: Record<MutationKind, string> = {
  rawMaterial: '◆',
  capacity: '⚙',
  downtime: '⏱',
  rejectionRate: '✗',
  bufferCapacity: '▥',
}

export function MutationCard({ mutation, index, onChange, onRemove, hasError }: Props) {
  const label = KIND_LABELS[mutation.kind]
  const icon = KIND_ICONS[mutation.kind]

  const borderClass = hasError
    ? 'border-red-400 bg-red-50/50'
    : 'border-[#E5E5E5] bg-white'

  return (
    <div className={`rounded-lg border ${borderClass} p-3 flex flex-col gap-2 shadow-sm transition-colors`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#C62828]">{icon}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#666666]">
            #{index + 1} {label}
          </span>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="rounded p-1 text-[10px] text-[#A3A3A3] hover:text-[#C62828] hover:bg-red-50 transition-colors"
          aria-label={`Remove change #${index + 1}`}
          title="Remove this change"
        >
          ✕
        </button>
      </div>

      {/* Editor */}
      {mutation.kind === 'rawMaterial' && (
        <RawMaterialEditor
          mutation={mutation}
          onChange={(m) => onChange(index, m)}
        />
      )}
      {mutation.kind === 'capacity' && (
        <CapacityEditor
          mutation={mutation}
          onChange={(m) => onChange(index, m)}
        />
      )}
      {mutation.kind === 'downtime' && (
        <DowntimeEditor
          mutation={mutation}
          onChange={(m) => onChange(index, m)}
        />
      )}
      {mutation.kind === 'rejectionRate' && (
        <RejectionRateEditor
          mutation={mutation}
          onChange={(m) => onChange(index, m)}
        />
      )}
      {mutation.kind === 'bufferCapacity' && (
        <BufferCapacityEditor
          mutation={mutation}
          onChange={(m) => onChange(index, m)}
        />
      )}
    </div>
  )
}
