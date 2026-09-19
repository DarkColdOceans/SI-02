/**
 * AddMutationMenu.tsx — Dropdown menu for adding new mutations to a scenario.
 */

import { useState, useRef, useEffect } from 'react'
import type { ScenarioMutation, MutationKind } from '../../digitalTwin/scenarioTypes'
import type { MachineId, BufferId } from '../../digitalTwin/types'
import { getBaselineCapacity, getBaselineBufferCapacity } from '../../hooks/useScenario'

interface Props {
  onAdd: (mutation: ScenarioMutation) => void
  hasRawMaterialChange: boolean
  disabled: boolean
}

interface MenuOption {
  kind: MutationKind
  label: string
  icon: string
  disabledReason?: string
}

function getMenuOptions(hasRawMaterialChange: boolean): MenuOption[] {
  return [
    {
      kind: 'capacity',
      label: 'Machine Capacity',
      icon: '⚙',
    },
    {
      kind: 'downtime',
      label: 'Machine Downtime',
      icon: '⏱',
    },
    {
      kind: 'rejectionRate',
      label: 'Rejection Rate',
      icon: '✗',
    },
    {
      kind: 'rawMaterial',
      label: 'Raw Material Input',
      icon: '◆',
      disabledReason: hasRawMaterialChange ? 'Already added' : undefined,
    },
    {
      kind: 'bufferCapacity',
      label: 'Buffer Capacity',
      icon: '▥',
    },
  ]
}

/** Create a default mutation for a given kind. */
function createDefaultMutation(kind: MutationKind): ScenarioMutation {
  switch (kind) {
    case 'rawMaterial':
      return { kind: 'rawMaterial', inputRate: 120 }
    case 'capacity':
      return {
        kind: 'capacity',
        machineId: 'M3' as MachineId,
        capacityPerMinute: getBaselineCapacity('M3' as MachineId),
      }
    case 'downtime':
      return { kind: 'downtime', machineId: 'M4' as MachineId, durationMinutes: 5 }
    case 'rejectionRate':
      return { kind: 'rejectionRate', machineId: 'M5' as MachineId, rejectionRate: 0.05 }
    case 'bufferCapacity':
      return {
        kind: 'bufferCapacity',
        bufferId: 'B3' as BufferId,
        maxCapacity: getBaselineBufferCapacity('B3' as BufferId),
      }
  }
}

export function AddMutationMenu({ onAdd, hasRawMaterialChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const options = getMenuOptions(hasRawMaterialChange)

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="w-full rounded border border-dashed border-[#C62828] bg-white px-3 py-2 text-xs font-semibold text-[#C62828] uppercase tracking-wider transition-colors hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Add Change
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-[#E5E5E5] bg-white shadow-lg overflow-hidden">
          {options.map((opt) => {
            const isDisabled = !!opt.disabledReason
            return (
              <button
                key={opt.kind}
                disabled={isDisabled}
                onClick={() => {
                  onAdd(createDefaultMutation(opt.kind))
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors border-b border-[#F7F7F7] last:border-0 ${
                  isDisabled
                    ? 'text-[#D4D4D4] cursor-not-allowed'
                    : 'text-[#1F1F1F] hover:bg-red-50 hover:text-[#C62828]'
                }`}
              >
                <span className="text-[11px] w-4 text-center">{opt.icon}</span>
                <span className="font-semibold">{opt.label}</span>
                {opt.disabledReason && (
                  <span className="ml-auto text-[9px] text-[#A3A3A3] italic">{opt.disabledReason}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
