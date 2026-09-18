import { money, unitCount } from '../../ui/format'
import { isUsable, tradeQuantity, type AmountUnit, type Side } from '../../lib/ledger'
import { toTrade, type TradeRow } from './rows'

/** The other half of the amount column: units if you typed cash, cash if you typed units. */
function equivalent(row: TradeRow): string {
  // An untouched row shows nothing; a half-filled one shows that it is incomplete.
  if (row.price === '' && row.amount === '') return ''

  const trade = toTrade(row)
  if (!isUsable(trade)) return '—'

  const qty = tradeQuantity(trade)
  return row.unit === 'qty' ? money(qty * trade.price) : unitCount(qty)
}

interface TradeTableProps {
  rows: TradeRow[]
  onChange: (id: string, patch: Partial<TradeRow>) => void
  onRemove: (id: string) => void
}

export function TradeTable({ rows, onChange, onRemove }: TradeTableProps) {
  return (
    <div className="trades">
      <div className="trade-head" aria-hidden="true">
        <span>Side</span>
        <span>Price</span>
        <span>Amount</span>
        <span>Unit</span>
        <span>Equals</span>
        <span />
      </div>

      {rows.map((row, index) => (
        <div className={`trade-row ${row.side}`} key={row.id}>
          <select
            className="cell-side"
            aria-label={`Trade ${index + 1} side`}
            value={row.side}
            onChange={e => onChange(row.id, { side: e.target.value as Side })}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>

          <input
            className="cell-price"
            type="number"
            inputMode="decimal"
            placeholder="Price"
            aria-label={`Trade ${index + 1} price`}
            value={row.price}
            onChange={e => onChange(row.id, { price: e.target.value })}
          />

          <input
            className="cell-amount"
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            aria-label={`Trade ${index + 1} amount`}
            value={row.amount}
            onChange={e => onChange(row.id, { amount: e.target.value })}
          />

          <select
            className="cell-unit"
            aria-label={`Trade ${index + 1} amount unit`}
            value={row.unit}
            onChange={e => onChange(row.id, { unit: e.target.value as AmountUnit })}
          >
            <option value="qty">units</option>
            <option value="quote">$</option>
          </select>

          <span className="cell-equals">{equivalent(row)}</span>

          <button
            className="cell-remove"
            type="button"
            aria-label={`Remove trade ${index + 1}`}
            onClick={() => onRemove(row.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
