/**
 * Exchange fee defaults.
 *
 * Source: Bybit "Bybit Trading Fee Structure" help-center article, VIP 0 row,
 * read 2026-09-18 (article last updated 2026-09-02).
 */
export const BYBIT_VIP0 = {
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
export const DEFAULT_FEE_PCT = String(BYBIT_VIP0.perpMaker)

/** `0.02` (percent) -> `0.0002` (fraction of notional). */
export function pctToRate(pct: string | number): number {
  return Number(pct) / 100
}
