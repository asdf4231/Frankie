/**
 * Frankie API 客户端
 * 封装所有后端接口调用，集中管理 endpoint 和请求格式
 */

const BASE = '/api'

/* ── 认证 ────────────────────────────────────────────────
 * 生产环境中默认依赖 cookie 会话；本地开发时保留 X-Frankie-User 头兜底。
 */
export const AUTH_USER_KEY = 'frankie-user'

export function authHeaders(): Record<string, string> {
  const uid = localStorage.getItem(AUTH_USER_KEY)?.trim()
  const headers: Record<string, string> = {}
  if (uid) headers['X-Frankie-User'] = uid
  return headers
}

async function errorDetail(resp: Response, path: string): Promise<Error> {
  try {
    const d = await resp.json()
    if (d?.detail) return new Error(String(d.detail))
  } catch { /* 非 JSON 错误体 */ }
  return new Error(`API ${path} failed: ${resp.status}`)
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  if (!resp.ok) throw await errorDetail(resp, path)
  return resp.json()
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const resp = await fetch(url.toString(), { headers: { ...authHeaders() }, credentials: 'include' })
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
  const data = (await resp.json()) as AuthMe
  localStorage.setItem(AUTH_USER_KEY, data.user_id)
  return data
}

export const logout = async () => {
  const resp = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: { ...authHeaders() },
    credentials: 'include',
  })
  if (!resp.ok) throw await errorDetail(resp, '/auth/logout')
  localStorage.removeItem(AUTH_USER_KEY)
}

export const changePassword = async (old_password: string, new_password: string) => {
  const resp = await fetch(`${BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
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

export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export const getHistory = () => get<{ sessions: SessionSummary[] }>('/history')
export const getHistorySession = (sessionId: string) =>
  get<{ session: { messages: StoredMessage[] } }>(`/history/${encodeURIComponent(sessionId)}`)
export const saveHistory = (history: StoredMessage[], sessionId?: string) =>
  post<{ session_id: string }>('/history/save', { history, session_id: sessionId })

// ── 状态 ────────────────────────────────────────────────
export const getStatus = () => get('/status')

// ── 文件树 ────────────────────────────────────────────
export const getSources = (layer: 'personal' | 'course' = 'personal') =>
  get('/sources', { layer })
export const getWiki = () => get('/wiki')
export const getFile = (path: string) => get('/file', { path })

// ── 上传 ────────────────────────────────────────────────
export async function uploadSourceFile(file: File, layer: 'personal' | 'course' = 'personal') {
  const url = new URL(`${BASE}/upload`, window.location.origin)
  url.searchParams.set('filename', file.name)
  url.searchParams.set('layer', layer)
  const resp = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', ...authHeaders() },
    body: file,
  })
  if (!resp.ok) throw await errorDetail(resp, '/upload')
  return resp.json()
}

// ── 配置 ────────────────────────────────────────────────
export const getSettings = () => get('/settings')
export const saveSettings = (data: unknown) => post('/settings', data)

// ── Ingest ────────────────────────────────────────────
export const ingestPath = (path: string, options?: { recursive?: boolean; force?: boolean }) =>
  post('/ingest', { path, ...options })

export const ingestSharedPath = (path: string, options?: { recursive?: boolean; force?: boolean }) =>
  post('/admin/ingest-shared', { path, ...options })

// SSE 接口（/api/chat, /api/query, /api/lint）通过 useSSE hook 直接调用，不在此封装
export const CHAT_URL = `${BASE}/chat`
export const QUERY_URL = `${BASE}/query`
export const LINT_URL = `${BASE}/lint`
export const SAVE_URL = `${BASE}/save`
