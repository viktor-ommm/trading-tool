import { describe, expect, it } from 'vitest'
import {
  breakEvenPrice,
  calcPositionSize,
  calcStopLoss,
  minimumRisk,
  type Fees,
} from './risk'

const MAKER: Fees = { entry: 0.0002, exit: 0.0002 }
const MAKER_TAKER: Fees = { entry: 0.0002, exit: 0.00055 }
const FREE: Fees = { entry: 0, exit: 0 }

/**
 * Recomputes the realised loss from first principles, deliberately not reusing
 * the maths under test: buy in, sell out, pay a fee on each notional.
 */
function realisedLoss(
  shares: number,
  entryPrice: number,
  exitPrice: number,
  fees: Fees,
  direction: 'long' | 'short',
): number {
  const move = direction === 'long' ? entryPrice - exitPrice : exitPrice - entryPrice
  return shares * move + shares * entryPrice * fees.entry + shares * exitPrice * fees.exit
}

describe('calcPositionSize', () => {
  it('loses exactly the risk budget at the stop, fees included (long)', () => {
    const r = calcPositionSize({ risk: 100, entryPrice: 50_000, stopPrice: 49_500, fees: MAKER })

    expect(r.direction).toBe('long')
    expect(realisedLoss(r.shares, 50_000, 49_500, MAKER, 'long')).toBeCloseTo(100, 10)
    expect(r.lossAtStop).toBeCloseTo(100, 10)
  })

  it('loses exactly the risk budget at the stop, fees included (short)', () => {
    const r = calcPositionSize({ risk: 100, entryPrice: 50_000, stopPrice: 50_500, fees: MAKER })

    expect(r.direction).toBe('short')
    expect(realisedLoss(r.shares, 50_000, 50_500, MAKER, 'short')).toBeCloseTo(100, 10)
    expect(r.lossAtStop).toBeCloseTo(100, 10)
  })

  it('holds when the exit is a taker fill', () => {
    const r = calcPositionSize({
      risk: 100,
      entryPrice: 50_000,
      stopPrice: 49_500,
      fees: MAKER_TAKER,
    })

    expect(realisedLoss(r.shares, 50_000, 49_500, MAKER_TAKER, 'long')).toBeCloseTo(100, 10)
  })

  it('reduces to risk / stop distance when fees are zero', () => {
    const r = calcPositionSize({ risk: 100, entryPrice: 50_000, stopPrice: 49_500, fees: FREE })

    expect(r.shares).toBeCloseTo(100 / 500, 12)
    expect(r.positionSize).toBeCloseTo(10_000, 8)
    expect(r.totalFees).toBe(0)
  })

  it('sizes smaller than a fee-blind calculator would', () => {
    const withFees = calcPositionSize({
      risk: 100,
      entryPrice: 50_000,
      stopPrice: 49_500,
      fees: MAKER,
    })
    const withoutFees = calcPositionSize({
      risk: 100,
      entryPrice: 50_000,
      stopPrice: 49_500,
      fees: FREE,
    })

    expect(withFees.positionSize).toBeLessThan(withoutFees.positionSize)
  })

  it('splits the loss into price move plus both fees', () => {
    const r = calcPositionSize({ risk: 100, entryPrice: 50_000, stopPrice: 49_500, fees: MAKER })

    expect(r.priceLoss + r.entryFee + r.exitFee).toBeCloseTo(r.lossAtStop, 10)
    expect(r.totalFees).toBeCloseTo(r.entryFee + r.exitFee, 10)
    expect(r.entryFee).toBeCloseTo(r.positionSize * MAKER.entry, 10)
    expect(r.exitFee).toBeCloseTo(r.shares * 49_500 * MAKER.exit, 10)
  })

  it('reports the stop distance as a share of entry', () => {
    const r = calcPositionSize({ risk: 100, entryPrice: 50_000, stopPrice: 49_500, fees: MAKER })

    expect(r.stopDistance).toBe(500)
    expect(r.stopDistancePct).toBeCloseTo(0.01, 12)
  })
})

describe('calcStopLoss', () => {
  const INPUT = { risk: 100, entryPrice: 50_000, positionSize: 10_000, fees: MAKER }

  it('puts the long stop where the loss equals the risk budget', () => {
    const r = calcStopLoss(INPUT)

    expect(realisedLoss(r.shares, 50_000, r.long.stop, MAKER, 'long')).toBeCloseTo(100, 10)
  })

  it('puts the short stop where the loss equals the risk budget', () => {
    const r = calcStopLoss(INPUT)

    expect(realisedLoss(r.shares, 50_000, r.short.stop, MAKER, 'short')).toBeCloseTo(100, 10)
  })

  it('keeps both stops closer to entry than a fee-blind calculator would', () => {
    const withFees = calcStopLoss(INPUT)
    const withoutFees = calcStopLoss({ ...INPUT, fees: FREE })

    expect(withFees.long.stop).toBeGreaterThan(withoutFees.long.stop)
    expect(withFees.short.stop).toBeLessThan(withoutFees.short.stop)
  })

  it('is symmetric around entry only when fees are zero', () => {
    const free = calcStopLoss({ ...INPUT, fees: FREE })
    expect(free.long.stop).toBeCloseTo(49_500, 8)
    expect(free.short.stop).toBeCloseTo(50_500, 8)

    // The exit fee is charged on the exit price, which differs per side.
    const paid = calcStopLoss(INPUT)
    expect(paid.long.stopDistance).not.toBeCloseTo(paid.short.stopDistance, 6)
  })

  it('signs the stop percentage by side', () => {
    const r = calcStopLoss(INPUT)

    expect(r.long.stopPct).toBeLessThan(0)
    expect(r.short.stopPct).toBeGreaterThan(0)
  })

  it('charges the entry fee on the given notional', () => {
    const r = calcStopLoss(INPUT)

    expect(r.shares).toBeCloseTo(0.2, 12)
    expect(r.entryFee).toBeCloseTo(10_000 * MAKER.entry, 10)
  })
})

describe('round trip between the two tools', () => {
  it('position size -> stop-loss returns the original stop', () => {
    const sized = calcPositionSize({
      risk: 100,
      entryPrice: 50_000,
      stopPrice: 49_500,
      fees: MAKER,
    })

    const stops = calcStopLoss({
      risk: 100,
      entryPrice: 50_000,
      positionSize: sized.positionSize,
      fees: MAKER,
    })

    expect(stops.long.stop).toBeCloseTo(49_500, 6)
  })
})

describe('breakEvenPrice', () => {
  it('nets zero on a long round trip', () => {
    const b = breakEvenPrice(50_000, MAKER, 'long')
    const shares = 0.2
    const pnl = shares * b - shares * 50_000 - shares * 50_000 * MAKER.entry - shares * b * MAKER.exit

    expect(pnl).toBeCloseTo(0, 10)
    expect(b).toBeGreaterThan(50_000)
  })

  it('nets zero on a short round trip', () => {
    const b = breakEvenPrice(50_000, MAKER, 'short')
    const shares = 0.2
    const pnl = shares * 50_000 - shares * b - shares * 50_000 * MAKER.entry - shares * b * MAKER.exit

    expect(pnl).toBeCloseTo(0, 10)
    expect(b).toBeLessThan(50_000)
  })

  it('is the entry price when there are no fees', () => {
    expect(breakEvenPrice(50_000, FREE, 'long')).toBe(50_000)
    expect(breakEvenPrice(50_000, FREE, 'short')).toBe(50_000)
  })

  it('does not depend on position size', () => {
    const small = calcPositionSize({ risk: 10, entryPrice: 50_000, stopPrice: 49_500, fees: MAKER })
    const large = calcPositionSize({
      risk: 10_000,
      entryPrice: 50_000,
      stopPrice: 49_500,
      fees: MAKER,
    })

    expect(small.breakEven).toBeCloseTo(large.breakEven, 10)
  })

  it('moves further from entry as the exit fee grows', () => {
    const maker = breakEvenPrice(50_000, MAKER, 'long')
    const taker = breakEvenPrice(50_000, MAKER_TAKER, 'long')

    expect(taker).toBeGreaterThan(maker)
  })
})

describe('minimumRisk', () => {
  it('is the round-trip fee measured at the entry price', () => {
    expect(minimumRisk(10_000, MAKER)).toBeCloseTo(4, 10)
    expect(minimumRisk(10_000, FREE)).toBe(0)
  })

  it('marks the budget at which a stop can no longer sit outside entry', () => {
    const floor = minimumRisk(10_000, MAKER)
    const justAbove = calcStopLoss({
      risk: floor + 1,
      entryPrice: 50_000,
      positionSize: 10_000,
      fees: MAKER,
    })

    expect(justAbove.long.stop).toBeLessThan(50_000)
    expect(justAbove.short.stop).toBeGreaterThan(50_000)

    // At the floor exactly, there is no room left for any price move.
    const atFloor = calcStopLoss({
      risk: floor,
      entryPrice: 50_000,
      positionSize: 10_000,
      fees: MAKER,
    })

    expect(atFloor.long.stop).toBeCloseTo(50_000, 6)
  })
})
