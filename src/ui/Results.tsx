import type { ReactNode } from 'react'

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
  tone = 'neutral',
}: {
  label: string
  value: string
  note?: string
  tone?: RowTone
}) {
  return (
    <div className={`result-row ${tone}`}>
      <span className="result-label">{label}</span>
      <span className="result-value">
        {value}
        {note && <span className="note"> ({note})</span>}
      </span>
    </div>
  )
}
