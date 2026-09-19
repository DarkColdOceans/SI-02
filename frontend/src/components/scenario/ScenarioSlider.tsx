/**
 * ScenarioSlider.tsx — Shared slider primitive for scenario editors.
 * Renders a styled range input with track visualization and value readout.
 */

interface Props {
  id: string
  label: string
  min: number
  max: number
  step: number
  value: number
  displayValue: string
  onChange: (value: number) => void
}

export function ScenarioSlider({ id, label, min, max, step, value, displayValue, onChange }: Props) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[9px] font-semibold text-[#666666] uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[10px] font-bold font-mono text-[#C62828] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
          {displayValue}
        </span>
      </div>

      {/* Slider row */}
      <div className="relative flex items-center h-5 group">
        {/* filled portion */}
        <div
          className="absolute left-0 h-1 rounded-full bg-[#C62828] pointer-events-none transition-all duration-75"
          style={{ width: `${pct}%` }}
        />
        {/* unfilled portion */}
        <div
          className="absolute right-0 h-1 rounded-full bg-[#E5E5E5] pointer-events-none transition-all duration-75"
          style={{ width: `${100 - pct}%` }}
        />

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />

        {/* Thumb visual */}
        <div
          className="absolute h-3.5 w-3.5 rounded-full bg-white border-2 border-[#C62828] shadow-md pointer-events-none transition-[left] duration-75 peer-focus-visible:ring-2 peer-focus-visible:ring-[#C62828] peer-focus-visible:ring-offset-1 group-hover:scale-110 group-active:scale-95"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono text-[#A3A3A3]">{min}</span>
        <span className="text-[8px] font-mono text-[#A3A3A3]">{max}</span>
      </div>
    </div>
  )
}
