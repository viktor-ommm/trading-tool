/**
 * Pure risk-management maths, shared by the stop-loss and position-size tools.
 * No React, no formatting decisions — the UI renders these numbers.
 *
 * Fees are taken as fractions of notional (0.0002 for 0.02%) and charged on
 * both legs: entry at the entry price, exit at the exit price. "Risk" always
 * means the total loss including both fees, never the price move alone.
 */

export interface Fees {
  /** Fee rate paid entering the position. */
  entry: number
  /** Fee rate paid exiting it — a stop that fills as a market order pays taker. */
  exit: number
}

export type Direction = 'long' | 'short'

/* ---------------------------------------------------------------- break-even */

/**
 * Price at which the round trip nets exactly zero after both fees.
 *
 * Long:  q·B·(1 − exit) = q·E·(1 + entry)
 * Short: q·E·(1 − entry) = q·B·(1 + exit)
 *
 * Independent of size — fees are proportional, so quantity cancels out.
 */
export function breakEvenPrice(entryPrice: number, fees: Fees, direction: Direction): number {
  return direction === 'long'
    ? (entryPrice * (1 + fees.entry)) / (1 - fees.exit)
    : (entryPrice * (1 - fees.entry)) / (1 + fees.exit)
}

/* ------------------------------------------------------------ position sizing */

export interface PositionSizeInput {
  /** Total the trade may lose, fees included. */
  risk: number
  entryPrice: number
  stopPrice: number
  fees: Fees
}

export interface PositionSizeResult {
  /** Inferred from the stop sitting below (long) or above (short) the entry. */
  direction: Direction
  stopDistance: number
  /** Stop distance as a share of entry price, e.g. 0.01 for 1%. */
  stopDistancePct: number
  shares: number
  /** Notional size of the position, in quote currency. */
  positionSize: number
  entryFee: number
  /** Fee paid closing at the stop price. */
  exitFee: number
  totalFees: number
  /** Price move alone, before fees. */
  priceLoss: number
  /** Price move plus both fees — equals the requested risk. */
  lossAtStop: number
  breakEven: number
  /** Signed move from entry to break-even, e.g. 0.0004 for +0.04%. */
  breakEvenPct: number
}

/**
 * Entry and stop are fixed; size is what gives way. Solving
 *
 *   risk = q·|E − S| + q·E·entryFee + q·S·exitFee
 *
 * for q keeps the loss at the stop equal to the risk budget *after* fees.
 */
export function calcPositionSize({
  risk,
  entryPrice,
  stopPrice,
  fees,
}: PositionSizeInput): PositionSizeResult {
  const direction: Direction = stopPrice < entryPrice ? 'long' : 'short'
  const stopDistance = Math.abs(entryPrice - stopPrice)

  const lossPerUnit = stopDistance + entryPrice * fees.entry + stopPrice * fees.exit
  const shares = risk / lossPerUnit

  const positionSize = shares * entryPrice
  const entryFee = positionSize * fees.entry
  const exitFee = shares * stopPrice * fees.exit
  const priceLoss = shares * stopDistance
  const breakEven = breakEvenPrice(entryPrice, fees, direction)

  return {
    direction,
    stopDistance,
    stopDistancePct: stopDistance / entryPrice,
    shares,
    positionSize,
    entryFee,
    exitFee,
    totalFees: entryFee + exitFee,
    priceLoss,
    lossAtStop: priceLoss + entryFee + exitFee,
    breakEven,
    breakEvenPct: (breakEven - entryPrice) / entryPrice,
  }
}

/* ----------------------------------------------------------------- stop-loss */

export interface StopLossInput {
  /** Total the trade may lose, fees included. */
  risk: number
  entryPrice: number
  /** Notional size of the position, in quote currency. */
  positionSize: number
  fees: Fees
}

export interface StopLossSide {
  stop: number
  stopDistance: number
  /** Signed move from entry to the stop, e.g. -0.01 for a long stop 1% below. */
  stopPct: number
  exitFee: number
  breakEven: number
  breakEvenPct: number
}

export interface StopLossResult {
  shares: number
  entryFee: number
  long: StopLossSide
  short: StopLossSide
}

/**
 * Size is fixed; the stop moves closer to entry to leave room for the fees.
 *
 *   long:  risk = q·(E − SL) + q·E·entryFee + q·SL·exitFee
 *   short: risk = q·(SL − E) + q·E·entryFee + q·SL·exitFee
 *
 * Solved for SL on each side. The two are not symmetric around the entry: the
 * exit fee is charged on the exit price, which differs between the sides.
 */
export function calcStopLoss({ risk, entryPrice, positionSize, fees }: StopLossInput): StopLossResult {
  const shares = positionSize / entryPrice
  const entryFee = positionSize * fees.entry

  const longStop = (positionSize * (1 + fees.entry) - risk) / (shares * (1 - fees.exit))
  const shortStop = (risk + positionSize * (1 - fees.entry)) / (shares * (1 + fees.exit))

  return {
    shares,
    entryFee,
    long: side(longStop, entryPrice, shares, fees, 'long'),
    short: side(shortStop, entryPrice, shares, fees, 'short'),
  }
}

function side(
  stop: number,
  entryPrice: number,
  shares: number,
  fees: Fees,
  direction: Direction,
): StopLossSide {
  const breakEven = breakEvenPrice(entryPrice, fees, direction)

  return {
    stop,
    stopDistance: Math.abs(entryPrice - stop),
    stopPct: (stop - entryPrice) / entryPrice,
    exitFee: shares * stop * fees.exit,
    breakEven,
    breakEvenPct: (breakEven - entryPrice) / entryPrice,
  }
}

/**
 * Below this, fees alone eat the whole budget and no stop can sit outside the
 * entry. Round-trip fee measured at the entry price.
 */
export function minimumRisk(positionSize: number, fees: Fees): number {
  return positionSize * (fees.entry + fees.exit)
}
