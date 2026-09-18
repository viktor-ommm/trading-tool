/**
 * A ledger of buys and sells on one instrument, reduced to a cash flow.
 *
 * Everything is derived from two running totals — net quantity held and net
 * cash — which is what makes partial sells, averaging down and going net short
 * fall out of the same three lines instead of needing special cases.
 *
 * No React, no formatting decisions.
 */

export type Side = 'buy' | 'sell'

/** How the amount column is entered: in units of the asset, or in quote currency. */
export type AmountUnit = 'qty' | 'quote'

export interface Trade {
  side: Side
  price: number
  amount: number
  unit: AmountUnit
}

export interface Fees {
  /** Fee rate paid on a buy, as a fraction of notional. */
  buy: number
  /** Fee rate paid on a sell. */
  sell: number
}

export type LedgerState =
  /** Nothing usable entered yet. */
  | 'empty'
  /** Holding units, still out of pocket — `breakEven` is the price to sell at. */
  | 'long'
  /** Holding units, and the sells already returned every penny. */
  | 'free'
  /** Net short — `breakEven` is the price to buy back at. */
  | 'short'
  /** Bought and sold the same amount; nothing left open. */
  | 'closed'

export interface LedgerResult {
  state: LedgerState
  /** Net units held. Negative means net short. */
  quantity: number
  /** Net cash flow. Negative means money is still out. */
  cash: number
  /** `-cash`. Positive while the position is still underwater. */
  netOutlay: number
  /** Cash spent on buys, fees included. */
  invested: number
  /** Cash returned by sells, fees deducted. */
  recovered: number
  feesPaid: number
  /** Net outlay per open unit, before the exit fee. Null unless state is `long`. */
  costBasis: number | null
  /** Price that closes the position flat. Null unless state is `long` or `short`. */
  breakEven: number | null
}

/**
 * Units this trade moves. A quote-denominated amount is the notional — the fee
 * is charged on top of it, the way a limit order with a total works.
 */
export function tradeQuantity(trade: Trade): number {
  if (!isUsable(trade)) return 0
  return trade.unit === 'qty' ? trade.amount : trade.amount / trade.price
}

/** Rows still being typed are skipped rather than treated as zero-priced trades. */
export function isUsable(trade: Trade): boolean {
  return (
    Number.isFinite(trade.price) &&
    Number.isFinite(trade.amount) &&
    trade.price > 0 &&
    trade.amount > 0
  )
}

export function applyTrades(trades: Trade[], fees: Fees): LedgerResult {
  let quantity = 0
  let cash = 0
  let invested = 0
  let recovered = 0
  let feesPaid = 0

  for (const trade of trades) {
    const units = tradeQuantity(trade)
    if (units === 0) continue

    const notional = units * trade.price

    if (trade.side === 'buy') {
      const fee = notional * fees.buy
      quantity += units
      cash -= notional + fee
      invested += notional + fee
      feesPaid += fee
    } else {
      const fee = notional * fees.sell
      quantity -= units
      cash += notional - fee
      recovered += notional - fee
      feesPaid += fee
    }
  }

  const netOutlay = -cash

  return {
    ...resolve(quantity, cash, netOutlay, fees),
    quantity,
    cash,
    netOutlay,
    invested,
    recovered,
    feesPaid,
  }
}

function resolve(
  quantity: number,
  cash: number,
  netOutlay: number,
  fees: Fees,
): Pick<LedgerResult, 'state' | 'costBasis' | 'breakEven'> {
  const flat = Math.abs(quantity) < 1e-12

  if (flat && cash === 0) return { state: 'empty', costBasis: null, breakEven: null }
  if (flat) return { state: 'closed', costBasis: null, breakEven: null }

  if (quantity > 0) {
    // Sells already covered the buys: whatever is left costs nothing to hold.
    if (netOutlay <= 0) return { state: 'free', costBasis: null, breakEven: null }

    return {
      state: 'long',
      costBasis: netOutlay / quantity,
      breakEven: netOutlay / (quantity * (1 - fees.sell)),
    }
  }

  // Net short: the buy-back has to fit inside the cash the sells brought in.
  if (cash <= 0) return { state: 'free', costBasis: null, breakEven: null }

  return {
    state: 'short',
    costBasis: null,
    breakEven: cash / (-quantity * (1 + fees.buy)),
  }
}
