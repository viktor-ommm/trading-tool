/**
 * Best-effort localStorage. Private windows, blocked site data and full quotas
 * all throw, and a tool losing its draft is never worth taking the page down.
 */

const PREFIX = 'trading-toolkit:'

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveState(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Nothing useful to do — the tool still works for this session.
  }
}
