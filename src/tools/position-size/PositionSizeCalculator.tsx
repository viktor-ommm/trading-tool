import { useState } from 'react'
import { Field } from '../../ui/Field'
import { FeeFields } from '../../ui/FeeFields'
import { ResultGroup, ResultRow, Results } from '../../ui/Results'
import { ToolPage } from '../../ui/ToolPage'
import { money, percent, price, units } from '../../ui/format'
import { DEFAULT_FEE_PCT } from '../../lib/fees'
import { calcPositionSize, type PositionSizeResult } from '../../lib/risk'
import {
  readFees,
  validatePositionSize,
  type Errors,
  type PositionSizeFields,
  type RawInputs,
} from '../../lib/validation'
import { meta } from './meta'

type Inputs = RawInputs<PositionSizeFields>

const EMPTY: Inputs = {
  risk: '',
  entryPrice: '',
  stopPrice: '',
  feeIn: DEFAULT_FEE_PCT,
  feeOut: DEFAULT_FEE_PCT,
}

export default function PositionSizeCalculator() {
  const [inputs, setInputs] = useState<Inputs>(EMPTY)
  const [errors, setErrors] = useState<Errors<PositionSizeFields>>({})
  const [result, setResult] = useState<PositionSizeResult | null>(null)

  function set(field: PositionSizeFields) {
    return (value: string) => setInputs(prev => ({ ...prev, [field]: value }))
  }

  function calculate() {
    const found = validatePositionSize(inputs)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      setResult(null)
      return
    }

    setResult(
      calcPositionSize({
        risk: Number(inputs.risk),
        entryPrice: Number(inputs.entryPrice),
        stopPrice: Number(inputs.stopPrice),
        fees: readFees(inputs),
      }),
    )
  }

  return (
    <ToolPage title={meta.title} summary={meta.summary}>
      <div className="form">
        <Field
          label="Risk per Trade (USD)"
          hint="Total loss at the stop, fees included."
          placeholder="e.g. 100"
          value={inputs.risk}
          error={errors.risk}
          onChange={set('risk')}
        />
        <Field
          label="Entry Price (USD)"
          placeholder="e.g. 50000"
          value={inputs.entryPrice}
          error={errors.entryPrice}
          onChange={set('entryPrice')}
        />
        <Field
          label="Stop Price (USD)"
          hint="Below entry for a long, above it for a short."
          placeholder="e.g. 49500"
          value={inputs.stopPrice}
          error={errors.stopPrice}
          onChange={set('stopPrice')}
        />

        <FeeFields inputs={inputs} errors={errors} onChange={(field, value) => set(field)(value)} />

        <button className="primary-btn" onClick={calculate}>
          Calculate
        </button>
      </div>

      {result && (
        <Results>
          <ResultRow
            label="Direction"
            value={result.direction === 'long' ? 'Long' : 'Short'}
            tone={result.direction}
          />
          <ResultRow
            label="Stop Distance"
            value={price(result.stopDistance)}
            note={percent(result.stopDistancePct)}
          />
          <ResultRow label="Shares / Units" value={units(result.shares)} />
          <ResultRow label="Position Size" value={money(result.positionSize)} />
          <ResultRow
            label="Break-Even Price"
            value={price(result.breakEven)}
            note={percent(result.breakEvenPct, true)}
          />

          <ResultGroup label="Loss at stop">
            <ResultRow label="Price Move" value={money(result.priceLoss)} />
            <ResultRow label="Entry Fee" value={money(result.entryFee)} />
            <ResultRow label="Exit Fee" value={money(result.exitFee)} />
            <ResultRow label="Total" value={money(result.lossAtStop)} tone="total" />
          </ResultGroup>
        </Results>
      )}
    </ToolPage>
  )
}
