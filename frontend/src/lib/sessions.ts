/**
 * The signed-in user's chat sessions, shared by the sidebar list and the conversation.
 */

import { useSyncExternalStore } from 'react'
import { deleteHistory, errorMessage, getHistory, renameHistory, type SessionSummary } from '../api/client'

/** `null` until the first load completes. */
let sessions: SessionSummary[] | null = null
let loadError = ''
let inflight: Promise<void> | null = null
let generation = 0
let refreshQueued = false
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const snapshot = () => sessions

export function useSessions(): SessionSummary[] | null {
  return useSyncExternalStore(subscribe, snapshot)
}

export function useSessionsError(): string {
  return useSyncExternalStore(subscribe, () => loadError)
}

export function refreshSessions(): Promise<void> {
  if (inflight) { refreshQueued = true; return inflight }
  const current = generation
  if (loadError) { loadError = ''; emit() }
  const request = getHistory()
    .then(({ sessions: next }) => {
      if (current !== generation) return
      sessions = next
      loadError = ''
      emit()
    })
    .catch((error: unknown) => {
      if (current !== generation) return
      loadError = errorMessage(error, 'The conversation history could not be loaded. Try again.')
      emit()
    })
    .finally(() => {
      if (inflight === request) {
        inflight = null
        if (refreshQueued) { refreshQueued = false; void refreshSessions() }
      }
    })
  inflight = request
  return request
}

/** Forget everything (sign-out); a load still in flight is ignored when it lands. */
export function resetSessions() {
  generation += 1
  inflight = null
  sessions = null
  refreshQueued = false
  loadError = ''
  emit()
}

/** A refresh that was queried before a local change would overwrite it when it lands: discard
 * it and say whether a fresh one is needed. */
function discardInflight(): boolean {
  if (!inflight) return false
  generation += 1
  inflight = null
  return true
}

export async function renameSession(sessionId: string, topic: string) {
  await renameHistory(sessionId, topic)
  discardInflight()
  await refreshSessions()
}

export async function removeSession(sessionId: string) {
  await deleteHistory(sessionId)
  forgetSession(sessionId)
}

export function forgetSession(sessionId: string) {
  const refetch = discardInflight()
  if (sessions) {
    sessions = sessions.filter((session) => session.session_id !== sessionId)
    emit()
  }
  if (refetch) void refreshSessions()
}
