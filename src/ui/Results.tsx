import { useId, useState, type ReactNode } from 'react'
import { Icon } from './icons'

export type RowTone = 'neutral' | 'long' | 'short' | 'total'

export function Results({ title = 'Results', children }: { title?: string; children: ReactNode }) {
  return (
    <section className="results">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/** A labelled band of rows, for splitting a long result list into readable parts. */
export function ResultGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="result-group">
      <h3>{label}</h3>
      {children}
    </div>
  )
}

export function ResultRow({
  label,
  value,
  note,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  /** Parenthetical after the value, e.g. a percentage. */
  note?: string
  /** What the number means. Hidden behind an (i) so the table stays scannable. */
  hint?: string
  tone?: RowTone
}) {
  const [open, setOpen] = useState(false)
  const hintId = useId()

  return (
    <div className={`result-row ${tone}`}>
      <span className="result-label">
        <span className="result-label-line">
          {label}
          {hint && (
            <button
              type="button"
              className="hint-toggle"
              aria-label={`What does ${label} mean?`}
              aria-expanded={open}
              aria-controls={hintId}
              onClick={() => setOpen(value => !value)}
            >
              <Icon name="info" size={15} />
            </button>
          )}
        </span>
        {hint && open && (
          <span className="result-hint" id={hintId}>
            {hint}
          </span>
        )}
      </span>
      <span className="result-value">
        {value}
        {note && <span className="note"> ({note})</span>}
      </span>
    </div>
  )
}
