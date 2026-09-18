interface FieldProps {
  label: string
  value: string
  /** Shown under the label — what the number means, not how to type it. */
  hint?: string
  placeholder?: string
  error?: string
  onChange: (value: string) => void
}

export function Field({ label, value, hint, placeholder, error, onChange }: FieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {hint && <span className="field-hint">{hint}</span>}
      <input
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={e => onChange(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </label>
  )
}
