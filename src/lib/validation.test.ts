import { describe, expect, it } from 'vitest'
import {
  readFees,
  validatePositionSize,
  validateStopLoss,
  type PositionSizeFields,
  type RawInputs,
  type StopLossFields,
} from './validation'

const stopLoss = (over: Partial<RawInputs<StopLossFields>> = {}): RawInputs<StopLossFields> => ({
  risk: '100',
  entryPrice: '50000',
  positionSize: '10000',
  feeIn: '0.02',
  feeOut: '0.02',
  ...over,
})

const positionSize = (
  over: Partial<RawInputs<PositionSizeFields>> = {},
): RawInputs<PositionSizeFields> => ({
  risk: '100',
  entryPrice: '50000',
  stopPrice: '49500',
  feeIn: '0.02',
  feeOut: '0.02',
  ...over,
})

describe('validateStopLoss', () => {
  it('accepts a complete form', () => {
    expect(validateStopLoss(stopLoss())).toEqual({})
  })

  it.each([
    ['empty', ''],
    ['zero', '0'],
    ['negative', '-5'],
    ['blank', '   '],
    ['not a number', 'abc'],
  ])('rejects a %s risk', (_label, risk) => {
    expect(validateStopLoss(stopLoss({ risk })).risk).toBeTruthy()
  })

  it('rejects a zero position size', () => {
    expect(validateStopLoss(stopLoss({ positionSize: '0' })).positionSize).toBeTruthy()
  })

  it('rejects a risk that the round-trip fee would swallow', () => {
    // 10000 notional at 0.02% + 0.02% costs 4.00 in fees alone.
    expect(validateStopLoss(stopLoss({ risk: '3' })).risk).toContain('4.00')
    expect(validateStopLoss(stopLoss({ risk: '4' })).risk).toBeTruthy()
    expect(validateStopLoss(stopLoss({ risk: '4.01' }))).toEqual({})
  })

  it('skips the fee floor check while other fields are still invalid', () => {
    const errors = validateStopLoss(stopLoss({ risk: '3', entryPrice: '' }))

    expect(errors.entryPrice).toBeTruthy()
    expect(errors.risk).toBeUndefined()
  })

  it('allows zero fees, so the floor is zero too', () => {
    expect(validateStopLoss(stopLoss({ feeIn: '0', feeOut: '0', risk: '0.01' }))).toEqual({})
  })
})

describe('validatePositionSize', () => {
  it('accepts a complete form', () => {
    expect(validatePositionSize(positionSize())).toEqual({})
  })

  it('accepts a stop above entry as a short', () => {
    expect(validatePositionSize(positionSize({ stopPrice: '50500' }))).toEqual({})
  })

  it('rejects a stop equal to entry', () => {
    expect(validatePositionSize(positionSize({ stopPrice: '50000' })).stopPrice).toBe(
      'Stop price must differ from entry price',
    )
  })

  it('rejects a non-positive stop', () => {
    expect(validatePositionSize(positionSize({ stopPrice: '0' })).stopPrice).toBeTruthy()
    expect(validatePositionSize(positionSize({ stopPrice: '' })).stopPrice).toBeTruthy()
  })
})

describe('fee fields', () => {
  it.each([
    ['empty', ''],
    ['not a number', 'abc'],
    ['negative', '-0.01'],
    ['100 percent', '100'],
    ['above 100 percent', '150'],
  ])('rejects a %s fee on either leg', (_label, fee) => {
    expect(validateStopLoss(stopLoss({ feeIn: fee })).feeIn).toBeTruthy()
    expect(validateStopLoss(stopLoss({ feeOut: fee })).feeOut).toBeTruthy()
    expect(validatePositionSize(positionSize({ feeIn: fee })).feeIn).toBeTruthy()
    expect(validatePositionSize(positionSize({ feeOut: fee })).feeOut).toBeTruthy()
  })

  it('accepts a zero fee', () => {
    expect(validatePositionSize(positionSize({ feeIn: '0', feeOut: '0' }))).toEqual({})
  })
})

describe('readFees', () => {
  it('converts percentages to fractions of notional', () => {
    expect(readFees({ feeIn: '0.02', feeOut: '0.055' })).toEqual({
      entry: 0.0002,
      exit: 0.00055,
    })
  })
})
