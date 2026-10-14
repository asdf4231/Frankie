import type { ReactNode } from 'react'

export default function ParamControl({ name, label, min, max, step, decimals, value, onChange }: {
  name: string
  label: ReactNode
  min: number
  max: number
  step: number
  decimals: number
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="control-group">
      <div className="control-heading">
        <label htmlFor={`lab-${name}`}>{label}</label>
        <span className="control-value">{value.toFixed(decimals)}</span>
      </div>
      <input
        className="control-slider"
        id={`lab-${name}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
