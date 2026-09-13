import { useLayoutEffect, useSyncExternalStore } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'frankie.theme'
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readPreference(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // System preference remains available when storage is blocked.
  }
  return 'system'
}

let preference = readPreference()
const getSnapshot = () => preference

function applyTheme() {
  const root = document.documentElement
  root.dataset.theme = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference
  const background = getComputedStyle(root).getPropertyValue('--bg').trim()
  if (background) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
}

function setTheme(next: Theme) {
  preference = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Keep the selected appearance for this tab even without persistent storage.
  }
  applyTheme()
  listeners.forEach((listener) => listener())
}

function onSystemChange() {
  if (preference === 'system') applyTheme()
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  preference = readPreference()
  applyTheme()
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    systemTheme.addEventListener('change', onSystemChange)
    window.addEventListener('storage', onStorage)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      systemTheme.removeEventListener('change', onSystemChange)
      window.removeEventListener('storage', onStorage)
    }
  }
}

/** Shared across the app and account menu; the app keeps theme tracking active on Login too. */
export function useTheme(): readonly [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot)
  useLayoutEffect(applyTheme, [])
  return [theme, setTheme]
}
