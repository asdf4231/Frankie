/**
 * The open conversation: its messages and streaming state, kept outside React so a reply
 * keeps arriving while other views are open and so URL changes are handled in one place.
 *
 * The chat view renders this store; the sidebar and header drive it through the exported
 * actions. Route changes detach observers without stopping server-owned replies.
 */

import { useSyncExternalStore } from 'react'
import { conversationEventsUrl, errorMessage, errorStatus, getAttachmentUrl, getHistorySession, replyEventsUrl, stopChat, submitChat, updateHistoryThinking, type AttachmentRef, type ConversationEvent, type HistorySession, type MessageStatus, type ReplyEvent, type StoredMessage, type ThinkingLevel } from '../api/client'
import { getRoute, navigate, type Route } from './router'
import { forgetSession, refreshSessions, setSessionTopic } from './sessions'
import { subscribeEvents, type StreamHandle } from './sse'
import { clearChatPosition, SAVE_CHAT_POSITION_EVENT } from './chatPosition'

export interface Message {
  id: string
  turnId?: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  reasoningSeconds?: number
  reasoningActive?: boolean
  status: MessageStatus
  error?: string
  streaming?: boolean
  attachments?: AttachmentRef[]
}

export interface ComposerRequest {
  id: number
  text: string
}

export interface ConversationState {
  /** Changes only when switching conversations, not when a new session gets its server ID. */
  viewKey: number
  /** One-time reveal of a locally submitted question. */
  questionRequest: number
  /** Session whose messages are shown; undefined for a chat that has not been sent yet. */
  sessionId?: string
  topic: string
  thinking: ThinkingLevel
  messages: Message[]
  /** A reply is being generated. */
  busy: boolean
  /** The open conversation is being deleted. */
  deleting: boolean
  agentStatus: string
  sessionLoading: boolean
  loadError: string
  /** Bumped whenever the composer should take focus. */
  focusRequest: number
  /** One-shot replacement handed to the mounted composer. */
  composerRequest?: ComposerRequest
}

// Every key is listed, including the optional one, so spreading EMPTY over the old state clears it.
const EMPTY: ConversationState = {
  viewKey: 0,
  questionRequest: 0,
  sessionId: undefined,
  topic: 'New chat',
  thinking: 'low',
  messages: [],
  busy: false,
  deleting: false,
  agentStatus: '',
  sessionLoading: false,
  loadError: '',
  focusRequest: 0,
  composerRequest: undefined,
}

let state = EMPTY
let deletingSessionId: string | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const snapshot = () => state

function set(patch: Partial<Omit<ConversationState, 'deleting'>>) {
  state = { ...state, ...patch }
  state.deleting = deletingSessionId !== undefined && state.sessionId === deletingSessionId
  emit()
}

export function useConversation(): ConversationState {
  return useSyncExternalStore(subscribe, snapshot)
}

export const getConversation = () => state

// ── Internal bookkeeping (not rendered) ─────────────────────────
let stream: StreamHandle | null = null
/** Bumped whenever the shown conversation changes; async work started earlier checks it. */
let revision = 0
let observedTurnId: string | undefined
let observersPaused = false
let pending: { stop: boolean } | undefined
let historyLoad: AbortController | undefined
let syncAgain = false
let accountId: string | undefined
let accountRevision = 0
const deletedSessions = new Set<string>()
const pendingThinking = new Map<string, ThinkingLevel>()
let thinkingWrites = Promise.resolve()
/** Session created while another view was open, so the chat history entry still lacks its id. */
let urlPendingSessionId: string | undefined
let msgCounter = 0
let composerRequestCounter = 0
const uid = () => `m${++msgCounter}`

const restoreMessage = (message: StoredMessage): Message => ({
  id: message.id,
  turnId: message.turn_id,
  role: message.role,
  content: message.content,
  reasoning: message.reasoning,
  reasoningSeconds: message.reasoning_seconds,
  reasoningActive: message.reasoning_active ?? message.status === 'running',
  attachments: message.attachments,
  status: message.status,
  streaming: message.role === 'assistant' && message.status === 'running',
  error: message.status === 'failed' ? 'The reply could not be generated. Please try again.' : undefined,
})

function detach() {
  stream?.abort()
  stream = null
  observedTurnId = undefined
}

function clear() {
  window.dispatchEvent(new Event(SAVE_CHAT_POSITION_EVENT))
  revision += 1
  detach()
  historyLoad?.abort()
  historyLoad = undefined
  pending = undefined
  syncAgain = false
  urlPendingSessionId = undefined
  set({ ...EMPTY, viewKey: state.viewKey + 1, focusRequest: state.focusRequest })
}

function deletedSession(sessionId: string) {
  deletedSessions.add(sessionId)
  forgetSession(sessionId)
  if (state.sessionId === sessionId) {
    clear()
    const route = getRoute()
    if (route.view === 'chat' && route.session === sessionId) {
      navigate({ view: 'chat', sidebarSearch: route.sidebarSearch }, { replace: true })
    }
  }
  if (accountId) clearChatPosition(accountId, sessionId)
}

function observe(sessionId: string, turnId: string) {
  if (observersPaused) return
  if (observedTurnId === turnId && stream) return
  detach()
  observedTurnId = turnId
  const current = revision
  stream = subscribeEvents<ReplyEvent>(replyEventsUrl(sessionId, turnId), (event) => {
    if (current !== revision || observedTurnId !== turnId) return true
    const terminal = event.status !== 'running'
    const progress = event.agent_status
    const agentStatus = !progress ? '' : progress.name === 'search_wiki'
      ? `Searching: ${progress.query ?? ''}…`
      : progress.name === 'read_wiki_page' ? `Reading: ${progress.path ?? ''}…` : `Running: ${progress.name}…`
    set({
      messages: state.messages.map((message) => message.id !== `a-${turnId}` ? message : {
        ...message, content: event.reset ? event.text : message.content + event.text,
        reasoning: event.reasoning_reset ? event.reasoning : (message.reasoning ?? '') + event.reasoning,
        reasoningSeconds: event.reasoning_seconds, reasoningActive: event.reasoning_active,
        status: event.status, streaming: !terminal,
        error: event.status === 'failed' ? 'The reply could not be generated. Please try again.' : undefined,
      }),
      busy: !terminal, agentStatus, loadError: '',
    })
    if (terminal) {
      observedTurnId = undefined
      stream = null
      void refreshSessions()
    }
    return terminal
  }, (error) => {
    if (current !== revision) return
    if (errorStatus(error) === 404) deletedSession(sessionId)
    else set({ loadError: errorMessage(error, 'Live updates are unavailable. Reconnecting…') })
  })
}

function applySession(session: HistorySession) {
  // A history request can finish after a newer SSE chunk. Never roll live text
  // or a terminal status back to an earlier persisted snapshot.
  const currentMessages = new Map(state.messages.map((message) => [message.id, message]))
  const messages = session.messages.map((stored) => {
    const live = currentMessages.get(stored.id)
    if (live && stored.status === 'running' &&
        (observedTurnId === stored.turn_id || live.status !== 'running')) return live
    if (live && live.content === stored.content && live.reasoning === stored.reasoning &&
        live.reasoningSeconds === stored.reasoning_seconds && live.status === stored.status &&
        JSON.stringify(live.attachments ?? []) === JSON.stringify(stored.attachments ?? [])) return live
    return restoreMessage(stored)
  })
  const running = messages.findLast((message) => message.role === 'assistant' && message.status === 'running')
  set({
    topic: session.topic || 'New chat',
    thinking: pendingThinking.get(session.session_id) ?? session.thinking_level,
    messages, busy: !!running, sessionLoading: false, loadError: '',
    agentStatus: running ? state.agentStatus : '',
  })
  if (running?.turnId) observe(session.session_id, running.turnId)
  else detach()
}

// ── Actions ─────────────────────────────────────────────────────

/** Drop the open conversation (sign-out). */
export function resetConversation() {
  clear()
  pendingThinking.clear()
  accountId = undefined
  accountRevision += 1
  deletedSessions.clear()
}

/** Start an empty chat and focus the composer. Callers navigate to `?view=chat` themselves. */
export function newChat() {
  clear()
  set({ focusRequest: state.focusRequest + 1 })
}

interface QuoteDraft {
  text: string
  source: string
}

function quoteInputPrefill({ text, source }: QuoteDraft): string {
  const block = text.trim().split('\n').map((line) => `> ${line}`).join('\n')
  const attribution = source ? `Quoted from “${source}”` : 'Quoted from course materials'
  return `${block}\n\n${attribution}\n\n`
}

/** Start a fresh chat with a quote and hand its prefill to the mounted composer. */
export function startQuotedChat(quote: QuoteDraft) {
  clear()
  set({
    focusRequest: state.focusRequest + 1,
    composerRequest: { id: ++composerRequestCounter, text: quoteInputPrefill(quote) },
  })
}

/** Acknowledge only the request the composer actually applied. */
export function consumeComposerRequest(id: number) {
  if (state.composerRequest?.id === id) set({ composerRequest: undefined })
}

function persistThinking(sessionId: string, thinking: ThinkingLevel) {
  const owner = accountRevision
  pendingThinking.set(sessionId, thinking)
  thinkingWrites = thinkingWrites.then(async () => {
    if (owner !== accountRevision) return
    let failure: unknown
    try {
      await updateHistoryThinking(sessionId, thinking)
    } catch (error) {
      failure = error
    } finally {
      if (pendingThinking.get(sessionId) === thinking) pendingThinking.delete(sessionId)
    }
    if (failure && owner === accountRevision && state.sessionId === sessionId && state.thinking === thinking) {
      set({ loadError: errorMessage(failure, 'The thinking level could not be saved. Check your connection and try again.') })
      void reconcileConversation()
    }
  })
}

/** Change the open conversation's default reasoning level and persist it when it has an ID. */
export function setConversationThinking(thinking: ThinkingLevel) {
  if (thinking === state.thinking || state.sessionLoading || state.deleting) return
  const sessionId = state.sessionId
  set({ thinking, loadError: '' })
  if (sessionId) persistThinking(sessionId, thinking)
}

export async function reconcileConversation() {
  const sessionId = state.sessionId
  if (!sessionId) return
  if (historyLoad || pending) { syncAgain = true; return }
  const current = revision
  const request = new AbortController()
  historyLoad = request
  try {
    const { session } = await getHistorySession(sessionId, request.signal)
    if (current !== revision || request.signal.aborted) return
    applySession(session)
  } catch (error) {
    if (current !== revision || request.signal.aborted) return
    if (errorStatus(error) === 404) deletedSession(sessionId)
    else set({ sessionLoading: false, loadError: errorMessage(error, 'The conversation could not be loaded. Check your connection and try again.') })
  } finally {
    if (historyLoad === request) {
      historyLoad = undefined
      if (syncAgain) { syncAgain = false; void reconcileConversation() }
    }
  }
}

function openSession(sessionId: string) {
  clear()
  set({ sessionId, sessionLoading: true })
  void reconcileConversation()
}

/** Visible tabs observe updates; hidden tabs reconcile when they become visible. */
export function startConversationSync(userId: string) {
  accountId = userId
  const currentAccount = accountRevision
  let disposed = false
  let updates: StreamHandle | undefined
  const sync = () => {
    void refreshSessions()
    void reconcileConversation()
  }
  const connect = () => subscribeEvents<ConversationEvent>(conversationEventsUrl, (event) => {
    if (accountRevision !== currentAccount) return true
    if (event.type === 'sync') { set({ loadError: '' }); sync() }
    else if (event.kind === 'renamed') {
      setSessionTopic(event.session_id, event.topic)
      if (event.session_id === state.sessionId) set({ topic: event.topic })
    } else {
      if (event.kind === 'deleted') deletedSession(event.session_id)
      else if (event.session_id === state.sessionId) void reconcileConversation()
      void refreshSessions()
    }
  }, (error) => {
    if (accountRevision !== currentAccount) return
    const unauthorized = errorStatus(error) === 401 || errorStatus(error) === 403
    if (unauthorized) detach()
    set({ loadError: unauthorized ? errorMessage(error) : 'Live conversation updates are unavailable. Reconnecting…' })
  })
  const suspend = () => {
    observersPaused = true
    updates?.abort()
    updates = undefined
    detach()
  }
  const resume = () => {
    if (disposed || document.visibilityState === 'hidden' || updates) return
    observersPaused = false
    sync()
    updates = connect()
    const running = state.messages.findLast((message) => message.role === 'assistant' && message.status === 'running')
    if (state.sessionId && running?.turnId) observe(state.sessionId, running.turnId)
  }
  const visibility = () => { if (document.visibilityState === 'hidden') suspend(); else resume() }
  const online = () => { suspend(); resume() }
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('pagehide', suspend)
  window.addEventListener('pageshow', resume)
  window.addEventListener('online', online)

  // Loading history must not wait for an SSE connection to get a browser slot.
  if (document.visibilityState === 'hidden') { suspend(); sync() }
  else resume()
  return () => {
    disposed = true
    suspend()
    document.removeEventListener('visibilitychange', visibility)
    window.removeEventListener('pagehide', suspend)
    window.removeEventListener('pageshow', resume)
    window.removeEventListener('online', online)
  }
}

/** Keep the conversation in step with the URL; a no-op while another view is open. */
export function syncRoute(route: Route) {
  if (route.view !== 'chat') return
  if (route.session === state.sessionId) return
  if (!route.session) {
    if (state.sessionId && urlPendingSessionId === state.sessionId) {
      // Back to the entry this chat was started from: give it the id it has since received.
      urlPendingSessionId = undefined
      navigate({ view: 'chat', session: state.sessionId }, { replace: true })
      return
    }
    clear()
    return
  }
  if (deletedSessions.has(route.session)) {
    navigate({ view: 'chat', sidebarSearch: route.sidebarSearch }, { replace: true })
    return
  }
  openSession(route.session)
}

export async function sendMessage(text: string, files: File[], editTurnId?: string) {
  const trimmed = text.trim()
  if (!trimmed || state.busy || state.sessionLoading || state.deleting) return
  const thinking = state.thinking
  const current = ++revision
  const owner = accountRevision
  detach()
  historyLoad?.abort()
  historyLoad = undefined
  const submission = { stop: false }
  pending = submission
  const previous = state.messages
  // A resent question replaces itself and every turn after it in this tab.
  const editIndex = editTurnId
    ? previous.findIndex((message) => message.role === 'user' && message.turnId === editTurnId)
    : -1
  const base = editIndex === -1 ? previous : previous.slice(0, editIndex)
  const userMsg: Message = { id: uid(), role: 'user', content: trimmed, status: 'completed' }
  const assistantMsg: Message = { id: uid(), role: 'assistant', content: '', status: 'running', streaming: true, reasoningActive: true }
  set({ messages: [...base, userMsg, assistantMsg], busy: true, agentStatus: 'Preparing…', loadError: '', questionRequest: state.questionRequest + 1 })

  const sessionId = state.sessionId
  const form = new FormData()
  form.append('message', trimmed)
  if (sessionId) form.append('session_id', sessionId)
  form.append('thinking', thinking)
  if (editTurnId) form.append('edit_turn_id', editTurnId)
  files.forEach((file) => form.append('files', file, file.name))
  try {
    const accepted = await submitChat(form)
    if (owner !== accountRevision) return
    void refreshSessions()
    if (deletedSessions.has(accepted.session_id)) {
      if (current === revision) clear()
      return
    }
    if (current === revision) {
      pending = undefined
      const latestThinking = state.thinking
      set({
        sessionId: accepted.session_id, topic: accepted.topic,
        messages: state.messages.map((message) => message.id === userMsg.id
          ? { ...message, id: `u-${accepted.turn_id}`, turnId: accepted.turn_id, attachments: accepted.attachments }
          : message.id === assistantMsg.id ? { ...message, id: `a-${accepted.turn_id}`, turnId: accepted.turn_id } : message),
      })
      if (!sessionId) {
        const route = getRoute()
        if (route.view === 'chat' && !route.session) navigate({ ...route, session: accepted.session_id }, { replace: true })
        else urlPendingSessionId = accepted.session_id
        if (latestThinking !== thinking) persistThinking(accepted.session_id, latestThinking)
      }
      observe(accepted.session_id, accepted.turn_id)
    }
    if (submission.stop) {
      try {
        const { session } = await stopChat(accepted.session_id, accepted.turn_id)
        if (current === revision) applySession(session)
      } catch (error) {
        if (current === revision) set({ loadError: errorMessage(error, 'The reply could not be stopped. Try again.') })
      }
    }
  } catch (error) {
    if (current !== revision || owner !== accountRevision) return
    pending = undefined
    if (errorStatus(error) === 404 && sessionId) deletedSession(sessionId)
    else if (errorStatus(error) === 409 && sessionId) {
      set({ messages: previous, agentStatus: '' })
      await reconcileConversation()
    } else {
      set({ busy: false, agentStatus: '', messages: [...base, userMsg, {
        ...assistantMsg, status: 'failed', streaming: false,
        error: errorMessage(error, 'The question could not be submitted. Check the conversation history before sending again.'),
      }] })
      // A server rejection (quota, invalid upload, …) created no turn, so the local failure stays
      // visible. Only a network error leaves it unknown whether the question arrived: reload then,
      // which replaces the local pair with whatever the server has.
      if (sessionId && errorStatus(error) === undefined) void reconcileConversation()
    }
  } finally {
    if (current === revision && syncAgain) { syncAgain = false; void reconcileConversation() }
  }
}

/**
 * Resend a stored question, unchanged (regenerate) or with edited text. The question
 * replaces itself and every turn after it; its attachments are re-downloaded and re-uploaded.
 * A question that never reached the server (no turnId) is simply sent as a new turn.
 */
export async function resendMessage(message: Pick<Message, 'turnId' | 'content' | 'attachments'>, text?: string): Promise<void> {
  if (state.busy || state.sessionLoading || state.deleting) return
  const content = (text ?? message.content).trim()
  if (!content) return
  let files: File[]
  try {
    files = await Promise.all((message.attachments ?? []).map(async (attachment) => {
      const response = await fetch(getAttachmentUrl(attachment.id))
      if (!response.ok) throw new Error(String(response.status))
      return new File([await response.blob()], attachment.name)
    }))
  } catch {
    set({ loadError: 'The attachments for this question could not be loaded. Send it again with the files.' })
    return
  }
  await sendMessage(content, files, message.turnId)
}

export function stopGeneration() {
  if (pending) { pending.stop = true; set({ agentStatus: 'Stopping…' }); return }
  const sessionId = state.sessionId
  const turnId = observedTurnId
  if (!sessionId || !turnId || !state.busy) return
  const current = revision
  set({ agentStatus: 'Stopping…' })
  void stopChat(sessionId, turnId).then(({ session }) => {
    if (current === revision) applySession(session)
  }).catch((error: unknown) => {
    if (current !== revision) return
    if (errorStatus(error) === 404) deletedSession(sessionId)
    else set({ loadError: errorMessage(error, 'The reply could not be stopped. Try again.') })
  })
}

export async function deleteConversation(sessionId: string, remove: () => Promise<void>) {
  const owner = accountRevision
  deletingSessionId = sessionId
  set({})
  try {
    await remove()
    if (owner === accountRevision) deletedSession(sessionId)
  } finally {
    if (deletingSessionId === sessionId) deletingSessionId = undefined
    if (owner === accountRevision) set({})
  }
}
