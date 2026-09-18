import { useState } from 'react'
import { Field } from './Field'
import { BYBIT_VIP0 } from '../lib/fees'
import type { Errors, FeeFieldName, RawInputs } from '../lib/validation'

interface FeeFieldsProps {
  inputs: RawInputs<FeeFieldName>
  errors: Errors<FeeFieldName>
  onChange: (field: FeeFieldName, value: string) => void
}

/** Collapsed by default — the Bybit defaults are right for most users. */
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
          placeholder={String(BYBIT_VIP0.perpMaker)}
          value={inputs.feeIn}
          error={errors.feeIn}
          onChange={value => onChange('feeIn', value)}
        />
        <Field
          label="Exit Fee (%)"
          placeholder={String(BYBIT_VIP0.perpMaker)}
          value={inputs.feeOut}
          error={errors.feeOut}
          onChange={value => onChange('feeOut', value)}
        />
        <p className="hint">
          Defaults are Bybit VIP 0 perpetuals, limit order (maker):{' '}
          <strong>{BYBIT_VIP0.perpMaker}%</strong>. A stop that triggers as a market order pays
          taker instead — <strong>{BYBIT_VIP0.perpTaker}%</strong>. Spot is{' '}
          <strong>{BYBIT_VIP0.spotMaker}%</strong> either way.
        </p>
      </div>
    </details>
  )
}
