import { describe, expect, it } from 'vitest'
import { applyTrades, tradeQuantity, type Fees, type Trade } from './ledger'

const SPOT: Fees = { buy: 0.001, sell: 0.001 }
const FREE: Fees = { buy: 0, sell: 0 }

const buy = (price: number, amount: number, unit: Trade['unit'] = 'qty'): Trade => ({
  side: 'buy',
  price,
  amount,
  unit,
})

const sell = (price: number, amount: number, unit: Trade['unit'] = 'qty'): Trade => ({
  side: 'sell',
  price,
  amount,
  unit,
})

/** Closes the position at `exit` and returns the net cash, ignoring the ledger's own maths. */
function settle(trades: Trade[], fees: Fees, exit: number): number {
  let qty = 0
  let cash = 0

  for (const t of trades) {
    const q = t.unit === 'qty' ? t.amount : t.amount / t.price
    const notional = q * t.price
    if (t.side === 'buy') {
      qty += q
      cash -= notional * (1 + fees.buy)
    } else {
      qty -= q
      cash += notional * (1 - fees.sell)
    }
  }

  return qty > 0
    ? cash + qty * exit * (1 - fees.sell)
    : cash - -qty * exit * (1 + fees.buy)
}

describe('tradeQuantity', () => {
  it('takes a unit amount as-is', () => {
    expect(tradeQuantity(buy(100, 1))).toBe(1)
  })

  it('divides a quote amount by the price', () => {
    expect(tradeQuantity(buy(100, 1500, 'quote'))).toBe(15)
    expect(tradeQuantity(buy(50, 100, 'quote'))).toBe(2)
  })

  it('ignores rows that are still being typed', () => {
    expect(tradeQuantity(buy(0, 1))).toBe(0)
    expect(tradeQuantity(buy(100, 0))).toBe(0)
    expect(tradeQuantity(buy(Number.NaN, 1))).toBe(0)
  })
})

describe('scaling in', () => {
  // Buy 1 @ 100, then 2 @ 110, spot maker fees both ways.
  const trades = [buy(100, 1), buy(110, 2)]

  it('breaks even above the fee-blind average', () => {
    const r = applyTrades(trades, SPOT)

    expect(r.state).toBe('long')
    expect(r.quantity).toBe(3)
    expect(r.netOutlay).toBeCloseTo(320.32, 10)
    expect(r.breakEven).toBeCloseTo(106.8802, 4)

    // The fee-blind average is 106.667.
    expect(r.breakEven!).toBeGreaterThan(320 / 3)
  })

  it('selling at the break-even price nets exactly zero', () => {
    const r = applyTrades(trades, SPOT)

    expect(settle(trades, SPOT, r.breakEven!)).toBeCloseTo(0, 10)
  })

  it('collapses to the plain average when fees are zero', () => {
    const r = applyTrades(trades, FREE)

    expect(r.breakEven).toBeCloseTo(320 / 3, 10)
    expect(r.feesPaid).toBe(0)
  })

  it('reads a quote-denominated amount the same as its unit equivalent', () => {
    const byUnits = applyTrades([buy(100, 1), buy(50, 2)], SPOT)
    const byCash = applyTrades([buy(100, 100, 'quote'), buy(50, 100, 'quote')], SPOT)

    expect(byCash.quantity).toBeCloseTo(byUnits.quantity, 12)
    expect(byCash.breakEven!).toBeCloseTo(byUnits.breakEven!, 12)
  })
})

describe('scaling out', () => {
  // Buy 1 @ 100, buy 2 @ 50, sell 2 @ 80 — one unit left open.
  const trades = [buy(100, 1), buy(50, 2), sell(80, 2)]

  it('drops the break-even by what the partial sell returned', () => {
    const r = applyTrades(trades, SPOT)

    expect(r.state).toBe('long')
    expect(r.quantity).toBeCloseTo(1, 12)
    expect(r.invested).toBeCloseTo(200.2, 10)
    expect(r.recovered).toBeCloseTo(159.84, 10)
    expect(r.netOutlay).toBeCloseTo(40.36, 10)
    expect(r.breakEven).toBeCloseTo(40.4004, 4)
  })

  it('selling the remainder at the break-even price nets exactly zero', () => {
    const r = applyTrades(trades, SPOT)

    expect(settle(trades, SPOT, r.breakEven!)).toBeCloseTo(0, 10)
  })

  it('counts a fee on every leg', () => {
    const r = applyTrades(trades, SPOT)

    // 0.10 + 0.10 on the buys, 0.16 on the sell.
    expect(r.feesPaid).toBeCloseTo(0.36, 10)
  })
})

describe('position states', () => {
  it('is empty with no usable rows', () => {
    expect(applyTrades([], SPOT).state).toBe('empty')
    expect(applyTrades([buy(0, 0)], SPOT).state).toBe('empty')
  })

  it('reports a closed position by its net result', () => {
    const r = applyTrades([buy(100, 1), sell(120, 1)], SPOT)

    expect(r.state).toBe('closed')
    expect(r.quantity).toBeCloseTo(0, 12)
    expect(r.breakEven).toBeNull()
    expect(r.cash).toBeCloseTo(19.78, 10)
  })

  it('calls the position free once the sells cover every buy', () => {
    const r = applyTrades([buy(100, 3), sell(400, 1)], SPOT)

    expect(r.state).toBe('free')
    expect(r.breakEven).toBeNull()
    expect(r.quantity).toBeCloseTo(2, 12)
    expect(r.netOutlay).toBeLessThan(0)
  })

  it('prices a net short as a buy-back', () => {
    const r = applyTrades([sell(100, 2), buy(90, 1)], SPOT)

    expect(r.state).toBe('short')
    expect(r.quantity).toBeCloseTo(-1, 12)
    expect(settle([sell(100, 2), buy(90, 1)], SPOT, r.breakEven!)).toBeCloseTo(0, 10)
  })
})

describe('bookkeeping', () => {
  it('keeps cash equal to recovered minus invested', () => {
    const trades = [buy(100, 1), buy(50, 2), sell(80, 2)]
    const r = applyTrades(trades, SPOT)

    expect(r.cash).toBeCloseTo(r.recovered - r.invested, 10)
    expect(r.netOutlay).toBeCloseTo(-r.cash, 10)
  })

  it('ignores half-typed rows instead of treating them as zero-priced trades', () => {
    const complete = applyTrades([buy(100, 1)], SPOT)
    const withDraft = applyTrades([buy(100, 1), buy(Number.NaN, Number.NaN)], SPOT)

    expect(withDraft.breakEven).toBeCloseTo(complete.breakEven!, 12)
  })

  it('is unaffected by the order rows are listed in', () => {
    const a = applyTrades([buy(100, 1), buy(50, 2), sell(80, 2)], SPOT)
    const b = applyTrades([sell(80, 2), buy(50, 2), buy(100, 1)], SPOT)

    expect(b.breakEven!).toBeCloseTo(a.breakEven!, 12)
  })
})
