/**
 * Frankie API 客户端
 * 封装所有后端接口调用，集中管理 endpoint 和请求格式
 */

const BASE = '/api'

async function errorDetail(resp: Response, path: string): Promise<Error> {
  try {
    const d = await resp.json()
    if (d?.detail) return new Error(String(d.detail))
  } catch { /* 非 JSON 错误体 */ }
  return new Error(`API ${path} failed: ${resp.status}`)
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const resp = await fetch(url.toString(), { credentials: 'include' })
  if (!resp.ok) throw await errorDetail(resp, path)
  return resp.json()
}

async function request<T>(path: string, method: 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!resp.ok) throw await errorDetail(resp, path)
  return resp.json()
}

// ── 认证 ────────────────────────────────────────────────
export interface AuthMe {
  user_id: string
  display_name: string
  role: 'admin' | 'student'
  must_change_password?: boolean
}

export const login = async (user_id: string, password: string): Promise<AuthMe> => {
  const resp = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user_id, password }),
  })
  if (!resp.ok) throw await errorDetail(resp, '/auth/login')
  return resp.json() as Promise<AuthMe>
}

export const logout = async () => {
  const resp = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!resp.ok) throw await errorDetail(resp, '/auth/logout')
}

export const changePassword = async (old_password: string, new_password: string) => {
  const resp = await fetch(`${BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ old_password, new_password }),
  })
  if (!resp.ok) throw await errorDetail(resp, '/auth/change-password')
  return resp.json()
}

export const getAuthMe = () => get<AuthMe>('/auth/me')

export interface SessionSummary {
  session_id: string
  topic: string | null
  created_at: string
  updated_at: string
  message_count: number
}

export interface AttachmentRef {
  id: string // 服务端存储文件名（uuid + 扩展名）
  name: string // 原始文件名
}

export type MessageStatus = 'completed' | 'failed' | 'cancelled' | 'running'

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: AttachmentRef[]
  status: MessageStatus
  error?: string
}

export interface HistorySession {
  session_id: string
  user_id: string
  topic: string | null
  messages: StoredMessage[]
}

/** 附件访问地址（经鉴权接口返回，浏览器自动携带 cookie）。 */
export const getAttachmentUrl = (id: string) => `/api/attachments/${encodeURIComponent(id)}`

export const getHistory = () => get<{ sessions: SessionSummary[] }>('/history')
export const getHistorySession = (sessionId: string) =>
  get<{ session: HistorySession }>(`/history/${encodeURIComponent(sessionId)}`)
export const renameHistory = (sessionId: string, topic: string) =>
  request<{ ok: boolean }>(`/history/${encodeURIComponent(sessionId)}`, 'PATCH', { topic })
export const deleteHistory = (sessionId: string) =>
  request<{ ok: boolean }>(`/history/${encodeURIComponent(sessionId)}`, 'DELETE')

// ── 状态 ────────────────────────────────────────────────
export const getStatus = () => get('/status')

// ── 文件树 ────────────────────────────────────────────
export const getSources = (layer: 'course' = 'course') => get('/sources', { layer })
export const getWiki = () => get('/wiki')

// SSE 接口（/api/chat, /api/query, /api/lint）通过 useSSE hook 直接调用，不在此封装
export const CHAT_URL = `${BASE}/chat`
export const QUERY_URL = `${BASE}/query`
export const LINT_URL = `${BASE}/lint`
export const SAVE_URL = `${BASE}/save`
