/**
 * The signed-in user's chat sessions, shared by the sidebar list and the conversation.
 */

import { useSyncExternalStore } from 'react'
import { deleteHistory, getHistory, renameHistory, type SessionSummary } from '../api/client'
import { localIso } from './dates'

/** `null` until the first load completes. */
let sessions: SessionSummary[] | null = null
let inflight: Promise<void> | null = null
let generation = 0
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

export function refreshSessions(): Promise<void> {
  if (inflight) return inflight
  const current = generation
  const request = getHistory()
    .then(({ sessions: next }) => {
      if (current !== generation) return
      sessions = next
      emit()
    })
    .catch(() => {})
    .finally(() => {
      if (inflight === request) inflight = null
    })
  inflight = request
  return request
}

/** Forget everything (sign-out); a load still in flight is ignored when it lands. */
export function resetSessions() {
  generation += 1
  inflight = null
  sessions = null
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

/** Put a session at the top of the list: one just created by the stream, or one that received a message. */
export function touchSession(entry: Pick<SessionSummary, 'session_id' | 'topic'>) {
  const refetch = discardInflight()
  const now = localIso()
  const existing = sessions?.find((session) => session.session_id === entry.session_id)
  const next: SessionSummary = existing
    ? { ...existing, topic: entry.topic ?? existing.topic, updated_at: now }
    : { session_id: entry.session_id, topic: entry.topic, created_at: now, updated_at: now, message_count: 0 }
  sessions = [next, ...(sessions ?? []).filter((session) => session.session_id !== entry.session_id)]
  emit()
  if (refetch) void refreshSessions()
}

export async function renameSession(sessionId: string, topic: string) {
  await renameHistory(sessionId, topic)
  const refetch = discardInflight()
  if (sessions) {
    sessions = sessions.map((session) => (session.session_id === sessionId ? { ...session, topic } : session))
    emit()
  }
  if (refetch) void refreshSessions()
}

export async function removeSession(sessionId: string) {
  await deleteHistory(sessionId)
  const refetch = discardInflight()
  if (sessions) {
    sessions = sessions.filter((session) => session.session_id !== sessionId)
    emit()
  }
  if (refetch) void refreshSessions()
}
