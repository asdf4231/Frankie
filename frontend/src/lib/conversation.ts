/**
 * The open conversation: its messages and streaming state, kept outside React so a reply
 * keeps arriving while other views are open and so URL changes are handled in one place.
 *
 * The chat view renders this store; the sidebar and header drive it through the exported
 * actions. Only `syncRoute` reads the URL.
 */

import { useSyncExternalStore } from 'react'
import { CHAT_URL, getHistorySession, type AttachmentRef, type MessageStatus, type StoredMessage } from '../api/client'
import { resolveReferenceCached } from './cache'
import { getRoute, navigate, viewForRelPath, type Route } from './router'
import { refreshSessions, touchSession } from './sessions'
import { streamChat, type AgentStatusEvent, type DoneEvent, type SessionEvent, type StreamHandle } from './sse'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: MessageStatus
  error?: string
  streaming?: boolean
  attachments?: AttachmentRef[]
}

export interface ConversationState {
  /** Session whose messages are shown; undefined for a chat that has not been sent yet. */
  sessionId?: string
  topic: string
  messages: Message[]
  /** A reply is being generated. */
  busy: boolean
  agentStatus: string
  sessionLoading: boolean
  loadError: string
  referenceError: string
  /** Bumped whenever the composer should take focus. */
  focusRequest: number
}

// Every key is listed, including the optional one, so spreading EMPTY over the old state clears it.
const EMPTY: ConversationState = {
  sessionId: undefined,
  topic: '新对话',
  messages: [],
  busy: false,
  agentStatus: '',
  sessionLoading: false,
  loadError: '',
  referenceError: '',
  focusRequest: 0,
}

let state = EMPTY
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const snapshot = () => state

function set(patch: Partial<ConversationState>) {
  state = { ...state, ...patch }
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
let pendingUserMsgId: string | null = null
let activeAgentCallId: string | null = null
/** Session whose last reply was stopped in the browser; the server may still be finishing it. */
let cancelledSessionId: string | undefined
/** Session created while another view was open, so the chat history entry still lacks its id. */
let urlPendingSessionId: string | undefined
let msgCounter = 0
const uid = () => `m${++msgCounter}`

const restoreMessage = (message: StoredMessage): Message => {
  const interrupted = message.role === 'assistant' && message.status === 'running'
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    attachments: message.attachments,
    status: interrupted ? 'failed' : message.status,
    error: message.error
      || (interrupted ? '回复因页面刷新或连接中断而中断。' : undefined)
      || (message.status === 'failed' ? '回复生成失败。' : undefined),
  }
}

function stopStream() {
  stream?.abort()
  stream = null
}

function clear() {
  revision += 1
  stopStream()
  pendingUserMsgId = null
  activeAgentCallId = null
  urlPendingSessionId = undefined
  set({ ...EMPTY, focusRequest: state.focusRequest })
}

/** Replace the last message when it is the reply still being generated. */
function finishReply(patch: Partial<Message>, onlyIfRunning: boolean): Message[] {
  const last = state.messages[state.messages.length - 1]
  if (last?.role !== 'assistant' || (onlyIfRunning && last.status !== 'running')) return state.messages
  return [...state.messages.slice(0, -1), { ...last, ...patch }]
}

function failReply(error: Error) {
  const messages = finishReply({ error: error.message, status: 'failed', streaming: false }, true)
  pendingUserMsgId = null
  activeAgentCallId = null
  stream = null
  set({ messages, busy: false, agentStatus: '' })
}

const handlers = {
  onSession(event: SessionEvent) {
    const created = state.sessionId === undefined
    set({ sessionId: event.session_id, topic: event.topic || '新会话' })
    touchSession({ session_id: event.session_id, topic: event.topic })
    if (!created) return
    const route = getRoute()
    if (route.view === 'chat' && !route.session) navigate({ view: 'chat', session: event.session_id }, { replace: true })
    else urlPendingSessionId = event.session_id
  },
  onChunk(text: string) {
    const last = state.messages[state.messages.length - 1]
    if (last?.role !== 'assistant' || !last.streaming || last.status !== 'running') return
    set({ agentStatus: '', messages: [...state.messages.slice(0, -1), { ...last, content: last.content + text }] })
  },
  onAgentStatus(event: AgentStatusEvent) {
    if (event.status === 'running') {
      activeAgentCallId = event.call_id
      set({
        agentStatus: event.name === 'search_wiki'
          ? `正在检索：${event.query ?? ''}`
          : event.name === 'read_wiki_page'
            ? `正在读取：${event.path ?? ''}`
            : `正在执行：${event.name}`,
      })
    } else if (activeAgentCallId === event.call_id) {
      activeAgentCallId = null
      set({ agentStatus: '' })
    }
  },
  onAttachments(attachments: AttachmentRef[]) {
    const id = pendingUserMsgId
    if (!id) return
    set({ messages: state.messages.map((message) => (message.id === id ? { ...message, attachments } : message)) })
  },
  onDone(event: DoneEvent) {
    const last = state.messages[state.messages.length - 1]
    const error = event.status === 'failed' ? last?.error || '回复生成失败。' : last?.error
    const messages = finishReply({ error, status: event.status, streaming: false }, false)
    pendingUserMsgId = null
    activeAgentCallId = null
    stream = null
    set({ messages, busy: false, agentStatus: '' })
    void refreshSessions()
  },
  onError(error: Error) {
    failReply(error)
  },
}

// ── Actions ─────────────────────────────────────────────────────

/** Drop the open conversation (sign-out). */
export function resetConversation() {
  clear()
}

/** Start an empty chat and focus the composer. Callers navigate to `?view=chat` themselves. */
export function newChat() {
  clear()
  set({ focusRequest: state.focusRequest + 1 })
}

async function openSession(sessionId: string) {
  clear()
  const current = revision
  set({ sessionId, sessionLoading: true })
  try {
    const { session } = await getHistorySession(sessionId)
    if (current !== revision) return
    set({ topic: session.topic || '新会话', messages: session.messages.map(restoreMessage), sessionLoading: false })
  } catch (error) {
    if (current !== revision) return
    set({ sessionLoading: false, loadError: error instanceof Error ? error.message : String(error) })
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
  void openSession(route.session)
}

export async function sendMessage(text: string, files: File[]) {
  const trimmed = text.trim()
  if (!trimmed || state.busy || state.sessionLoading) return
  const current = ++revision
  stopStream()

  const userMsg: Message = { id: uid(), role: 'user', content: trimmed, status: 'completed' }
  const assistantMsg: Message = { id: uid(), role: 'assistant', content: '', status: 'running', streaming: true }
  pendingUserMsgId = userMsg.id
  activeAgentCallId = null
  set({ messages: [...state.messages, userMsg, assistantMsg], busy: true, agentStatus: '正在准备检索', referenceError: '' })

  // Browser abort is not a server acknowledgement. Queue the next message
  // until the previous turn has actually released this session.
  const sessionId = state.sessionId
  if (sessionId && cancelledSessionId === sessionId) {
    set({ agentStatus: '正在等待上一条回复停止' })
    try {
      while (current === revision) {
        const { session } = await getHistorySession(sessionId)
        if (current !== revision) return
        if (!session.messages.some((message) => message.status === 'running')) {
          cancelledSessionId = undefined
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    } catch (error) {
      if (current === revision) failReply(error as Error)
      return
    }
    if (current !== revision) return
    set({ agentStatus: '正在准备检索' })
  }

  const form = new FormData()
  form.append('message', trimmed)
  if (sessionId) form.append('session_id', sessionId)
  files.forEach((file) => form.append('files', file, file.name))
  stream = streamChat(CHAT_URL, { body: form }, handlers)
}

export function stopGeneration() {
  revision += 1
  cancelledSessionId = state.sessionId
  stopStream()
  const messages = finishReply({ status: 'cancelled', streaming: false }, true)
  pendingUserMsgId = null
  activeAgentCallId = null
  set({ messages, busy: false, agentStatus: '' })
}

/** Open a cited course page in the library. */
export function openReference(target: string) {
  set({ referenceError: '' })
  resolveReferenceCached(target)
    .then((page) => navigate({ view: viewForRelPath(page.rel_path), file: page.abs_path }))
    .catch((error: unknown) => set({ referenceError: error instanceof Error ? error.message : String(error) }))
}
