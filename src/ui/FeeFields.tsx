import { useState, type ReactNode } from 'react'
import { Field } from './Field'
import { DEFAULT_FEES } from '../lib/fees'
import type { Errors, FeeFieldName, RawInputs } from '../lib/validation'

export interface FeeLabels {
  in: string
  out: string
  /** Short forms for the collapsed summary line. */
  inShort: string
  outShort: string
}

const ENTRY_EXIT: FeeLabels = {
  in: 'Entry Fee (%)',
  out: 'Exit Fee (%)',
  inShort: 'in',
  outShort: 'out',
}

const DEFAULT_HINT = (
  <>
    Defaults are perpetuals on a limit (maker) order: <strong>{DEFAULT_FEES.perpMaker}%</strong>. A
    stop that triggers as a market order pays taker instead —{' '}
    <strong>{DEFAULT_FEES.perpTaker}%</strong>. Spot is typically{' '}
    <strong>{DEFAULT_FEES.spotMaker}%</strong> either way. Check your own rates and edit.
  </>
)

interface FeeFieldsProps {
  inputs: RawInputs<FeeFieldName>
  errors: Errors<FeeFieldName>
  onChange: (field: FeeFieldName, value: string) => void
  labels?: FeeLabels
  hint?: ReactNode
  placeholder?: string
}

/** Collapsed by default — the preset rates are right for most users. */
export function FeeFields({
  inputs,
  errors,
  onChange,
  labels = ENTRY_EXIT,
  hint = DEFAULT_HINT,
  placeholder = String(DEFAULT_FEES.perpMaker),
}: FeeFieldsProps) {
  const [open, setOpen] = useState(false)
  const hasError = Boolean(errors.feeIn ?? errors.feeOut)

  return (
    <details className="fees" open={open || hasError} onToggle={e => setOpen(e.currentTarget.open)}>
      <summary>
        Fees
        <span className="fees-current">
          {inputs.feeIn || '0'}% {labels.inShort} · {inputs.feeOut || '0'}% {labels.outShort}
        </span>
      </summary>

      <div className="fees-body">
        <Field
          label={labels.in}
          placeholder={placeholder}
          value={inputs.feeIn}
          error={errors.feeIn}
          onChange={value => onChange('feeIn', value)}
        />
        <Field
          label={labels.out}
          placeholder={placeholder}
          value={inputs.feeOut}
          error={errors.feeOut}
          onChange={value => onChange('feeOut', value)}
        />
        <p className="hint">{hint}</p>
      </div>
    </details>
  )
}
