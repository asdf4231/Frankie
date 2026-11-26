import { useId, type ReactNode } from 'react'
import Icon from '../Icon'

export default function LabParameters({ onReset, children }: { onReset: () => void; children: ReactNode }) {
  const titleId = useId()
  return (
    <section className="tools-panel panel" aria-labelledby={titleId}>
      <div className="tools-panel-header">
        <h2 id={titleId} className="panel-title">Parameters</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
          <Icon name="refresh" size={14} /> Reset
        </button>
      </div>
      {children}
    </section>
  )
}
