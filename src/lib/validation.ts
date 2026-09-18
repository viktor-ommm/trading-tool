import { minimumRisk, type Fees } from './risk'
import { pctToRate } from './fees'

export type Errors<K extends string> = Partial<Record<K, string>>
export type RawInputs<K extends string> = Record<K, string>

export type FeeFieldName = 'feeIn' | 'feeOut'
export type StopLossFields = 'risk' | 'entryPrice' | 'positionSize' | FeeFieldName
export type PositionSizeFields = 'risk' | 'entryPrice' | 'stopPrice' | FeeFieldName

function isPositive(value: string): boolean {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) && n > 0
}

/** Fees may be zero (rebates and promos exist), but not negative or absurd. */
function feeError(value: string): string | undefined {
  const n = Number(value)
  if (value.trim() === '' || !Number.isFinite(n)) return 'Enter a fee percentage'
  if (n < 0) return 'Fee cannot be negative'
  if (n >= 100) return 'Fee must be below 100%'
  return undefined
}

function checkFees(inputs: RawInputs<FeeFieldName>, errors: Errors<FeeFieldName>): void {
  const feeIn = feeError(inputs.feeIn)
  const feeOut = feeError(inputs.feeOut)
  if (feeIn) errors.feeIn = feeIn
  if (feeOut) errors.feeOut = feeOut
}

/** For tools whose only form-level rules are the two fee fields. */
export function validateFees(inputs: RawInputs<FeeFieldName>): Errors<FeeFieldName> {
  const errors: Errors<FeeFieldName> = {}
  checkFees(inputs, errors)
  return errors
}

export function readFees(inputs: RawInputs<FeeFieldName>): Fees {
  return { entry: pctToRate(inputs.feeIn), exit: pctToRate(inputs.feeOut) }
}

/** Empty object means valid. */
export function validateStopLoss(inputs: RawInputs<StopLossFields>): Errors<StopLossFields> {
  const errors: Errors<StopLossFields> = {}

  if (!isPositive(inputs.risk)) errors.risk = 'Enter a valid risk amount'
  if (!isPositive(inputs.entryPrice)) errors.entryPrice = 'Enter a valid entry price'
  if (!isPositive(inputs.positionSize)) errors.positionSize = 'Enter a valid position size'
  checkFees(inputs, errors)

  if (Object.keys(errors).length > 0) return errors

  // A budget smaller than the round trip leaves no room for a price move at all.
  const floor = minimumRisk(Number(inputs.positionSize), readFees(inputs))
  if (Number(inputs.risk) <= floor) {
    errors.risk = `Risk must exceed the round-trip fee on this size (${floor.toFixed(2)})`
  }

  return errors
}

/** Empty object means valid. */
export function validatePositionSize(inputs: RawInputs<PositionSizeFields>): Errors<PositionSizeFields> {
  const errors: Errors<PositionSizeFields> = {}

  if (!isPositive(inputs.risk)) errors.risk = 'Enter a valid risk amount'
  if (!isPositive(inputs.entryPrice)) errors.entryPrice = 'Enter a valid entry price'

  if (!isPositive(inputs.stopPrice)) {
    errors.stopPrice = 'Enter a valid stop price'
  } else if (Number(inputs.stopPrice) === Number(inputs.entryPrice)) {
    errors.stopPrice = 'Stop price must differ from entry price'
  }

  checkFees(inputs, errors)

  return errors
}
