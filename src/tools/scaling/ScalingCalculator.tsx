import { useEffect, useMemo, useState } from 'react'
import { FeeFields, type FeeLabels } from '../../ui/FeeFields'
import { ResultRow, Results } from '../../ui/Results'
import { ToolPage } from '../../ui/ToolPage'
import { money, percent, price, unitCount, units } from '../../ui/format'
import { DEFAULT_FEES } from '../../lib/fees'
import { applyTrades, type LedgerResult } from '../../lib/ledger'
import { loadState, saveState } from '../../lib/storage'
import { pctToRate } from '../../lib/fees'
import { validateFees, type Errors, type FeeFieldName, type RawInputs } from '../../lib/validation'
import { TradeTable } from './TradeTable'
import { newRow, toTrade, type TradeRow } from './rows'
import { meta } from './meta'

const STORAGE_KEY = 'scaling'
const SPOT = String(DEFAULT_FEES.spotMaker)

const FEE_LABELS: FeeLabels = {
  in: 'Buy Fee (%)',
  out: 'Sell Fee (%)',
  inShort: 'buy',
  outShort: 'sell',
}

const FEE_HINT = (
  <>
    Defaults are spot on a limit (maker) order: <strong>{DEFAULT_FEES.spotMaker}%</strong> each way.
    Perpetuals are cheaper — <strong>{DEFAULT_FEES.perpMaker}%</strong> maker,{' '}
    <strong>{DEFAULT_FEES.perpTaker}%</strong> taker. Check your own rates and edit.
  </>
)

interface Saved {
  rows: TradeRow[]
  fees: RawInputs<FeeFieldName>
}

function initialState(): Saved {
  const fallback: Saved = { rows: [newRow()], fees: { feeIn: SPOT, feeOut: SPOT } }
  const saved = loadState<Saved>(STORAGE_KEY, fallback)

  // Storage can hold anything an older version wrote, or nothing at all.
  if (!Array.isArray(saved.rows) || saved.rows.length === 0) return fallback
  if (!saved.fees || typeof saved.fees.feeIn !== 'string') return fallback

  return saved
}

export default function ScalingCalculator() {
  const [{ rows, fees }, setState] = useState<Saved>(initialState)
  // Clearing is destructive and one click away, so it asks in place first.
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    saveState(STORAGE_KEY, { rows, fees })
  }, [rows, fees])

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])

  const errors: Errors<FeeFieldName> = validateFees(fees)

  const result: LedgerResult = useMemo(() => {
    if (Object.keys(errors).length > 0) {
      return applyTrades([], { buy: 0, sell: 0 })
    }
    return applyTrades(rows.map(toTrade), {
      buy: pctToRate(fees.feeIn),
      sell: pctToRate(fees.feeOut),
    })
    // `errors` is derived from `fees`, so it needs no separate entry here.
  }, [rows, fees, errors])

  function patchRow(id: string, patch: Partial<TradeRow>) {
    setState(prev => ({
      ...prev,
      rows: prev.rows.map(row => (row.id === id ? { ...row, ...patch } : row)),
    }))
  }

  function removeRow(id: string) {
    setState(prev => {
      const rest = prev.rows.filter(row => row.id !== id)
      return { ...prev, rows: rest.length > 0 ? rest : [newRow()] }
    })
  }

  function addRow() {
    setState(prev => ({ ...prev, rows: [...prev.rows, newRow()] }))
  }

  function clearAll() {
    const hasData = rows.some(row => row.price !== '' || row.amount !== '')

    if (hasData && !armed) {
      setArmed(true)
      return
    }

    setArmed(false)
    setState(prev => ({ ...prev, rows: [newRow()] }))
  }

  return (
    <ToolPage title={meta.title} summary={meta.summary} wide>
      <TradeTable rows={rows} onChange={patchRow} onRemove={removeRow} />

      <div className="trade-actions">
        <button type="button" className="ghost-btn" onClick={addRow}>
          + Add trade
        </button>
        <button
          type="button"
          className={armed ? 'ghost-btn danger armed' : 'ghost-btn danger'}
          onClick={clearAll}
        >
          {armed ? 'Confirm clear' : 'Clear all'}
        </button>
      </div>

      <FeeFields
        inputs={fees}
        errors={errors}
        onChange={(field, value) =>
          setState(prev => ({ ...prev, fees: { ...prev.fees, [field]: value } }))
        }
        labels={FEE_LABELS}
        hint={FEE_HINT}
        placeholder={SPOT}
      />

      <Headline result={result} />

      {result.state !== 'empty' && (
        <Results title="Position">
          <ResultRow
            label="Open Quantity"
            hint="Units you still hold — everything bought, minus everything sold. Negative means you have sold more than you bought and are net short."
            value={units(result.quantity)}
          />
          {result.costBasis !== null && (
            <ResultRow
              label="Net Cost Basis"
              hint="What each open unit has cost you on average, after the buy fees and after whatever the sells already gave back. The break-even price is this plus the fee you will pay on the way out."
              value={price(result.costBasis)}
            />
          )}
          <ResultRow
            label="Invested"
            hint="Cash that has left your account on buys, their fees included. It never goes down — a sell is counted on the line below, not subtracted from here."
            value={money(result.invested)}
          />
          <ResultRow
            label="Recovered"
            hint="Cash the sells have put back, after their fees. Zero until you sell something."
            value={money(result.recovered)}
          />
          {result.netOutlay >= 0 ? (
            <ResultRow
              label="Net Outlay"
              hint="Invested minus recovered — the money still tied up in this position. Selling what is open at the break-even price returns exactly this much."
              value={money(result.netOutlay)}
              tone="total"
            />
          ) : (
            <ResultRow
              label="Net Surplus"
              hint="The sells have already returned more than every buy cost. You are up this much with the open units still in hand."
              value={money(-result.netOutlay)}
              tone="total"
            />
          )}
          <ResultRow
            label="Fees Paid"
            hint="What the exchange has taken across every trade so far. The fee on the exit you have not made yet is not in here — it is priced into the break-even instead."
            value={money(result.feesPaid)}
          />
        </Results>
      )}
    </ToolPage>
  )
}

function Headline({ result }: { result: LedgerResult }) {
  if (result.state === 'empty') {
    return <p className="headline-empty">Add a trade to see where you break even.</p>
  }

  if (result.state === 'closed') {
    const profit = result.cash >= 0
    return (
      <section className={`headline ${profit ? 'long' : 'short'}`}>
        <span className="headline-label">Position closed — net result</span>
        <span className="headline-value">
          {profit ? '+' : '−'}
          {money(Math.abs(result.cash))}
        </span>
      </section>
    )
  }

  if (result.state === 'free') {
    return (
      <section className="headline long">
        <span className="headline-label">Break-even price</span>
        <span className="headline-value">Already free</span>
        <span className="headline-note">
          The sells returned everything that went in. Whatever is still open is profit at any price.
        </span>
      </section>
    )
  }

  const short = result.state === 'short'

  return (
    <section className="headline">
      <span className="headline-label">
        {short
          ? `Break-even price — buy back ${unitCount(-result.quantity)} at`
          : `Break-even price — sell ${unitCount(result.quantity)} at`}
      </span>
      <span className="headline-value">{price(result.breakEven!)}</span>
      {result.costBasis !== null && (
        <span className="headline-note">
          {percent(result.breakEven! / result.costBasis - 1)} above cost basis — that gap is the
          sell-side fee.
        </span>
      )}
    </section>
  )
}
