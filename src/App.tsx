import { useState } from 'react'
import './App.css'

type Mode = 'stop-loss' | 'position-size'

interface Errors {
  risk?: string
  entryPrice?: string
  positionSize?: string
  stopPrice?: string
}

function App() {
  const [mode, setMode] = useState<Mode>('stop-loss')
  const [risk, setRisk] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [positionSize, setPositionSize] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [result, setResult] = useState<React.ReactNode>(null)

  function validate(): boolean {
    const newErrors: Errors = {}
    if (!risk || Number(risk) <= 0) newErrors.risk = 'Enter a valid risk amount'
    if (!entryPrice || Number(entryPrice) <= 0) newErrors.entryPrice = 'Enter a valid entry price'

    if (mode === 'stop-loss') {
      if (!positionSize || Number(positionSize) <= 0) newErrors.positionSize = 'Enter a valid position size'
    } else {
      if (!stopPrice || Number(stopPrice) <= 0) newErrors.stopPrice = 'Enter a valid stop price'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function calculate() {
    if (!validate()) {
      setResult(null)
      return
    }

    const r = Number(risk)
    const entry = Number(entryPrice)

    if (mode === 'stop-loss') {
      const size = Number(positionSize)
      const shares = size / entry
      const stopDistance = r / shares
      const longSL = entry - stopDistance
      const shortSL = entry + stopDistance

      setResult(
        <div className="results">
          <h2>Results</h2>
          <div className="result-row">
            <span className="result-label">Shares / Units</span>
            <span className="result-value">{shares.toFixed(4)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Stop Distance</span>
            <span className="result-value">${stopDistance.toFixed(4)} <span className="pct">({Math.round(stopDistance / entry * 100 * 100) / 100}%)</span></span>
          </div>
          <div className="result-row long">
            <span className="result-label">Long Stop-Loss</span>
            <span className="result-value">${longSL.toFixed(4)} <span className="pct">({Math.round(longSL / entry * 100 * 100) / 100}%)</span></span>
          </div>
          <div className="result-row short">
            <span className="result-label">Short Stop-Loss</span>
            <span className="result-value">${shortSL.toFixed(4)} <span className="pct">({Math.round(shortSL / entry * 100 * 100) / 100}%)</span></span>
          </div>
        </div>
      )
    } else {
      const stop = Number(stopPrice)
      const stopDistance = Math.abs(entry - stop)
      if (stopDistance === 0) {
        setErrors(prev => ({ ...prev, stopPrice: 'Stop price must differ from entry price' }))
        setResult(null)
        return
      }
      const shares = r / stopDistance
      const size = shares * entry

      setResult(
        <div className="results">
          <h2>Results</h2>
          <div className="result-row">
            <span className="result-label">Stop Distance</span>
            <span className="result-value">${stopDistance.toFixed(4)} <span className="pct">({Math.round(stopDistance / entry * 100 * 100) / 100}%)</span></span>
          </div>
          <div className="result-row">
            <span className="result-label">Shares / Units</span>
            <span className="result-value">{shares.toFixed(4)}</span>
          </div>
          <div className="result-row">
            <span className="result-label">Position Size</span>
            <span className="result-value">${size.toFixed(2)}</span>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="calculator">
      <h1>Risk Management Calculator</h1>

      <div className="mode-tabs">
        <button
          className={mode === 'stop-loss' ? 'active' : ''}
          onClick={() => { setMode('stop-loss'); setResult(null); setErrors({}) }}
        >
          Calculate Stop-Loss
        </button>
        <button
          className={mode === 'position-size' ? 'active' : ''}
          onClick={() => { setMode('position-size'); setResult(null); setErrors({}) }}
        >
          Calculate Position Size
        </button>
      </div>

      <div className="form">
        <div className="field">
          <label>Risk per Trade (USD)</label>
          <input
            type="number"
            placeholder="e.g. 100"
            value={risk}
            onChange={e => setRisk(e.target.value)}
          />
          {errors.risk && <span className="error">{errors.risk}</span>}
        </div>

        <div className="field">
          <label>Entry Price (USD)</label>
          <input
            type="number"
            placeholder="e.g. 50000"
            value={entryPrice}
            onChange={e => setEntryPrice(e.target.value)}
          />
          {errors.entryPrice && <span className="error">{errors.entryPrice}</span>}
        </div>

        {mode === 'stop-loss' ? (
          <div className="field">
            <label>Position Size (USD)</label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={positionSize}
              onChange={e => setPositionSize(e.target.value)}
            />
            {errors.positionSize && <span className="error">{errors.positionSize}</span>}
          </div>
        ) : (
          <div className="field">
            <label>Stop Price (USD)</label>
            <input
              type="number"
              placeholder="e.g. 49500"
              value={stopPrice}
              onChange={e => setStopPrice(e.target.value)}
            />
            {errors.stopPrice && <span className="error">{errors.stopPrice}</span>}
          </div>
        )}

        <button className="calc-btn" onClick={calculate}>Calculate</button>
      </div>

      {result}
    </div>
  )
}

export default App
