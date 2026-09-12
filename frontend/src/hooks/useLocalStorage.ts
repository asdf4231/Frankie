import { useCallback, useState } from 'react'

/** State mirrored to localStorage. Storage failures (private mode, quota) fall back to memory only. */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })
  const set = useCallback((next: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // storage unavailable; keep the in-memory value
    }
    setValue(next)
  }, [key])
  return [value, set]
}
