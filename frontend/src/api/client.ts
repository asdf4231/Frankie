/**
 * Frankie API 客户端
 * 封装所有后端接口调用，集中管理 endpoint 和请求格式
 */

const BASE = '/api'

/* ── 认证 ────────────────────────────────────────────────
 * 认证头注入点：当前为 dev provider（X-Frankie-User 请求头）。
 * 学校统一认证接入时，老师把这里替换为 SSO ticket 的注入方式，
 * 后端 auth.py 对应替换校验逻辑，其余代码均不用动。
 */
export const AUTH_USER_KEY = 'frankie-user'

export function authHeaders(): Record<string, string> {
  const uid = localStorage.getItem(AUTH_USER_KEY)?.trim()
  return uid ? { 'X-Frankie-User': uid } : {}
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
  })
  if (!resp.ok) throw await errorDetail(resp, path)
  return resp.json()
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const resp = await fetch(url.toString(), { headers: { ...authHeaders() } })
  if (!resp.ok) throw await errorDetail(resp, path)
  return resp.json()
}

// ── 认证 ────────────────────────────────────────────────
export interface AuthMe {
  user_id: string
  display_name: string
  role: 'admin' | 'student'
}

export const getAuthMe = () => get<AuthMe>('/auth/me')

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
