import { useState } from 'react'
import { Field } from './Field'
import { DEFAULT_FEES } from '../lib/fees'
import type { Errors, FeeFieldName, RawInputs } from '../lib/validation'

interface FeeFieldsProps {
  inputs: RawInputs<FeeFieldName>
  errors: Errors<FeeFieldName>
  onChange: (field: FeeFieldName, value: string) => void
}

/** Collapsed by default — the preset rates are right for most users. */
export function FeeFields({ inputs, errors, onChange }: FeeFieldsProps) {
  const [open, setOpen] = useState(false)
  const hasError = Boolean(errors.feeIn ?? errors.feeOut)

  return (
    <details className="fees" open={open || hasError} onToggle={e => setOpen(e.currentTarget.open)}>
      <summary>
        Fees
        <span className="fees-current">
          {inputs.feeIn || '0'}% in · {inputs.feeOut || '0'}% out
        </span>
      </summary>

      <div className="fees-body">
        <Field
          label="Entry Fee (%)"
          placeholder={String(DEFAULT_FEES.perpMaker)}
          value={inputs.feeIn}
          error={errors.feeIn}
          onChange={value => onChange('feeIn', value)}
        />
        <Field
          label="Exit Fee (%)"
          placeholder={String(DEFAULT_FEES.perpMaker)}
          value={inputs.feeOut}
          error={errors.feeOut}
          onChange={value => onChange('feeOut', value)}
        />
        <p className="hint">
          Defaults are perpetuals on a limit (maker) order:{' '}
          <strong>{DEFAULT_FEES.perpMaker}%</strong>. A stop that triggers as a market order pays
          taker instead — <strong>{DEFAULT_FEES.perpTaker}%</strong>. Spot is typically{' '}
          <strong>{DEFAULT_FEES.spotMaker}%</strong> either way. Check your own rates and edit.
        </p>
      </div>
    </details>
  )
}
