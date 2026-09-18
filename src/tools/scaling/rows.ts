import type { AmountUnit, Side, Trade } from '../../lib/ledger'

/** One editable line of the ledger. Strings, because the inputs are text until parsed. */
export interface TradeRow {
  /** Stable across edits and reorders, so React keeps input focus on delete. */
  id: string
  side: Side
  price: string
  amount: string
  unit: AmountUnit
}

export function newRow(): TradeRow {
  return { id: crypto.randomUUID(), side: 'buy', price: '', amount: '', unit: 'qty' }
}

export function toTrade(row: TradeRow): Trade {
  return { side: row.side, price: Number(row.price), amount: Number(row.amount), unit: row.unit }
}
