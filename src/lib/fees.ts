/**
 * Default fee rates, in percent.
 *
 * Typical non-discounted rates on a major centralised exchange. They are only
 * a starting point — every form lets both legs be edited.
 */
export const DEFAULT_FEES = {
  /** Perpetual & futures, limit order. */
  perpMaker: 0.02,
  /** Perpetual & futures, market order — what a triggered stop usually pays. */
  perpTaker: 0.055,
  spotMaker: 0.1,
  spotTaker: 0.1,
} as const

/**
 * Default for both legs: a limit order pays the maker fee, and perpetuals are
 * the market this calculator is shaped for (it prices long and short symmetrically).
 */
export const DEFAULT_FEE_PCT = String(DEFAULT_FEES.perpMaker)

/** `0.02` (percent) -> `0.0002` (fraction of notional). */
export function pctToRate(pct: string | number): number {
  return Number(pct) / 100
}
