/** Display formatting shared by every tool. */

/** A cash amount — fees, losses, notional size. Always two decimals. */
export function money(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** A price level. Keeps up to four decimals, drops trailing zeros. */
export function price(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`
}

export function units(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

/** `0.0125` -> `1.25%`. Pass `signed` to force a leading + or -. */
export function percent(ratio: number, signed = false): string {
  const pct = ratio * 100
  const sign = signed && pct > 0 ? '+' : ''
  return `${sign}${pct.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`
}
