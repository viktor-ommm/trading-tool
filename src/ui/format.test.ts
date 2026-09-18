import { describe, expect, it } from 'vitest'
import { money, percent, price, units } from './format'

describe('money', () => {
  it('always shows two decimals with thousands separators', () => {
    expect(money(9617.2312)).toBe('$9,617.23')
    expect(money(2)).toBe('$2.00')
    expect(money(0)).toBe('$0.00')
  })
})

describe('price', () => {
  it('keeps up to four decimals but drops trailing zeros', () => {
    expect(price(50_020.004)).toBe('$50,020.004')
    expect(price(49_500)).toBe('$49,500.00')
    expect(price(0.1234)).toBe('$0.1234')
  })
})

describe('percent', () => {
  it('renders a ratio as a percentage', () => {
    expect(percent(0.01)).toBe('1%')
    expect(percent(0.0125)).toBe('1.25%')
  })

  it('signs the value only when asked', () => {
    expect(percent(0.0004, true)).toBe('+0.04%')
    expect(percent(-0.0004, true)).toBe('-0.04%')
    expect(percent(0.0004)).toBe('0.04%')
  })
})

describe('units', () => {
  it('keeps fractional share counts readable', () => {
    expect(units(0.2)).toBe('0.2')
    expect(units(0.1861425)).toBe('0.186143')
  })
})
