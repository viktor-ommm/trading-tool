import { useState } from 'react'
import { Field } from '../../ui/Field'
import { FeeFields } from '../../ui/FeeFields'
import { ResultGroup, ResultRow, Results } from '../../ui/Results'
import { ToolPage } from '../../ui/ToolPage'
import { money, percent, price, units } from '../../ui/format'
import { DEFAULT_FEE_PCT } from '../../lib/fees'
import { calcStopLoss, type StopLossResult, type StopLossSide } from '../../lib/risk'
import {
  readFees,
  validateStopLoss,
  type Errors,
  type RawInputs,
  type StopLossFields,
} from '../../lib/validation'
import { meta } from './meta'

type Inputs = RawInputs<StopLossFields>

const EMPTY: Inputs = {
  risk: '',
  entryPrice: '',
  positionSize: '',
  feeIn: DEFAULT_FEE_PCT,
  feeOut: DEFAULT_FEE_PCT,
}

function Side({ side, label, tone }: { side: StopLossSide; label: string; tone: 'long' | 'short' }) {
  return (
    <ResultGroup label={label}>
      <ResultRow
        label="Stop-Loss"
        value={price(side.stop)}
        note={percent(side.stopPct, true)}
        tone={tone}
      />
      <ResultRow label="Exit Fee at Stop" value={money(side.exitFee)} />
      <ResultRow
        label="Break-Even Price"
        value={price(side.breakEven)}
        note={percent(side.breakEvenPct, true)}
      />
    </ResultGroup>
  )
}

export default function StopLossCalculator() {
  const [inputs, setInputs] = useState<Inputs>(EMPTY)
  const [errors, setErrors] = useState<Errors<StopLossFields>>({})
  const [result, setResult] = useState<StopLossResult | null>(null)

  function set(field: StopLossFields) {
    return (value: string) => setInputs(prev => ({ ...prev, [field]: value }))
  }

  function calculate() {
    const found = validateStopLoss(inputs)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      setResult(null)
      return
    }

    setResult(
      calcStopLoss({
        risk: Number(inputs.risk),
        entryPrice: Number(inputs.entryPrice),
        positionSize: Number(inputs.positionSize),
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
          label="Position Size (USD)"
          placeholder="e.g. 10000"
          value={inputs.positionSize}
          error={errors.positionSize}
          onChange={set('positionSize')}
        />

        <FeeFields inputs={inputs} errors={errors} onChange={(field, value) => set(field)(value)} />

        <button className="primary-btn" onClick={calculate}>
          Calculate
        </button>
      </div>

      {result && (
        <Results>
          <ResultRow label="Shares / Units" value={units(result.shares)} />
          <ResultRow label="Entry Fee" value={money(result.entryFee)} />

          <Side side={result.long} label="Long" tone="long" />
          <Side side={result.short} label="Short" tone="short" />
        </Results>
      )}
    </ToolPage>
  )
}
