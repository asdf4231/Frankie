/**
 * Frankie API 客户端
 * 封装所有后端接口调用，集中管理 endpoint 和请求格式
 */

const BASE = '/api'

export class SafeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeError'
  }
}

class ApiError extends SafeError {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function errorDetail(resp: Response, path: string): Promise<Error> {
  // Do not surface response bodies: backend failures can contain filesystem paths or provider details.
  if (path === '/auth/login' && resp.status === 401) return new ApiError('Incorrect account or password. Check your details and try again.', resp.status)
  if (path === '/auth/change-password') {
    if (resp.status === 401) return new ApiError('The current password is incorrect. Try again.', resp.status)
    if (resp.status === 400 || resp.status === 422) return new ApiError('The new password must be at least 8 characters. Try again.', resp.status)
  }
  if (resp.status === 401) return new ApiError('Your session has expired. Sign in again.', resp.status)
  if (resp.status === 403) return new ApiError("You don't have permission to do this.", resp.status)
  if (resp.status === 404) return new ApiError("The content you requested wasn't found. It may have been moved or deleted.", resp.status)
  if (resp.status === 409) return new ApiError('The page is out of date. Refresh and try again.', resp.status)
  if (resp.status === 413) return new ApiError('The upload is too large. Remove some attachments and try again.', resp.status)
  if (resp.status === 422) return new ApiError('The request was invalid. Check your input and try again.', resp.status)
  if (resp.status === 429) return new ApiError('Too many requests. Try again in a moment.', resp.status)
  return new ApiError('The service is temporarily unavailable. Try again later.', resp.status)
}

export function errorMessage(error: unknown, fallback = 'The request failed. Try again.'): string {
  if (error instanceof SafeError) return error.message
  if (error instanceof DOMException && error.name === 'AbortError') return ''
  if (error instanceof TypeError) return 'The network request failed. Check your connection and try again.'
  return fallback
}

export function errorStatus(error: unknown): number | undefined {
  return error instanceof ApiError ? error.status : undefined
}

async function get<T>(path: string, params?: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const resp = await fetch(url.toString(), { credentials: 'include', signal })
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

export const getHistory = (limit = 100) => get<{ sessions: SessionSummary[] }>('/history', { limit: String(limit) })
export const getHistorySession = (sessionId: string) =>
  get<{ session: HistorySession }>(`/history/${encodeURIComponent(sessionId)}`)
export const renameHistory = (sessionId: string, topic: string) =>
  request<{ ok: boolean }>(`/history/${encodeURIComponent(sessionId)}`, 'PATCH', { topic })
export const deleteHistory = (sessionId: string) =>
  request<{ ok: boolean }>(`/history/${encodeURIComponent(sessionId)}`, 'DELETE')

// ── 学习情况（管理员） ───────────────────────────────────
export interface StudentOverview {
  user_id: string
  display_name: string
  session_count: number
  question_count: number
  last_active_at: string | null
}

export interface LearningSession extends SessionSummary {
  user_id: string
  turns: {
    turn_id: string
    user_text: string
    assistant_text: string
    attachments: AttachmentRef[]
    status: MessageStatus
    error: string | null
    started_at: string
    finished_at: string | null
  }[]
}

export interface ClassSummary {
  id: string
  created_at: string
  window_start: string | null
  window_end: string
  question_count: number
  student_count: number
  content: string
}

const studentPath = (userId: string) => `/admin/students/${encodeURIComponent(userId)}`
export const getStudents = () => get<{ students: StudentOverview[] }>('/admin/students')
export const getStudentSessions = (userId: string, offset: number) =>
  get<{ sessions: SessionSummary[] }>(`${studentPath(userId)}/sessions`, { offset: String(offset) })
export const getStudentSession = (userId: string, sessionId: string) =>
  get<{ session: LearningSession }>(`${studentPath(userId)}/sessions/${encodeURIComponent(sessionId)}`)
export const getStudentAttachmentUrl = (userId: string, name: string) =>
  `${BASE}${studentPath(userId)}/attachments/${encodeURIComponent(name)}`
export const getClassSummaries = () => get<{ summaries: ClassSummary[] }>('/admin/summaries')
export const generateClassSummary = async () => {
  const resp = await fetch(`${BASE}/admin/summaries`, { method: 'POST', credentials: 'include' })
  if (!resp.ok) throw await errorDetail(resp, '/admin/summaries')
  return resp.json() as Promise<{ summary: ClassSummary }>
}

// ── 状态 ────────────────────────────────────────────────
export const getStatus = () => get('/status')
export const getSettings = <T>(signal?: AbortSignal) => get<T>('/settings', undefined, signal)
export const getBalance = <T>(signal?: AbortSignal) => get<T>('/balance', undefined, signal)

// ── 课程资料 ────────────────────────────────────────────
export interface SourceFile {
  path: string
  abs_path: string
  title?: string
  search_text?: string
}

export interface WikiFile {
  rel_path: string
  abs_path: string
  title: string
  date: string
  tags: string[]
  search_text?: string
}

export interface DocumentHeading {
  line: number
  level: number
  title: string
  anchor: string
  heading_path: string
}

export interface CourseDocument {
  path: string
  content: string
  headings: DocumentHeading[]
}

export interface ResolvedWikiReference {
  abs_path: string
  title: string
  rel_path: string
  anchor: string
  heading_path: string
}

export const getSources = () => get<{ files: SourceFile[]; root?: string }>('/sources')
export const getWiki = () => get<{ files: WikiFile[] }>('/wiki')
export const getFile = (path: string, signal: AbortSignal) => get<CourseDocument>('/file', { path }, signal)
export const resolveWiki = (title: string, source?: string) =>
  get<ResolvedWikiReference>('/wiki/resolve', {
    title, ...(source ? { source } : {}),
  })

// SSE 聊天接口由 lib/sse.ts 直接请求，不在此封装
export const CHAT_URL = `${BASE}/chat`
