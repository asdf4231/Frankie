import { useEffect, useState } from 'react'
import { errorMessage, getBalance, getStatus } from '../api/client'
import { numberFormatter } from '../lib/dates'
import './Status.css'

interface StatusData {
  user?: { user_id: string; role: 'admin' | 'student' }
  vault: {
    path: string
    exists: boolean
    raw_sources_dir: string | null
  }
  wiki: {
    path: string
    exists: boolean
    total_notes: number
  }
  llm: {
    api_key_set: boolean
    base_url: string
    default_model: string
    reasoning_model: string
  }
  token_usage: {
    total_calls: number
    total_prompt_tokens: number
    total_completion_tokens: number
    total_tokens: number
    by_command: Record<string, { calls: number; tokens: number }>
    by_model: Record<string, { calls: number; tokens: number }>
  }
  quota?: {
    used_today: number
    daily_limit: number
    limited: boolean
  }
  context?: {
    window_chars: number
    wiki_chars: number
    history_compact_at: number
  }
}

interface BalanceData {
  available: boolean
  total_balance?: string
  granted_balance?: string
  topped_up_balance?: string
  currency?: string
  reason?: string
}

function fmtNum(n: number) { return numberFormatter.format(n) }

function fmtCurrency(value?: string, currency?: string) {
  if (value === undefined) return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount) || !currency) return `${value}${currency ? ` ${currency}` : ''}`
  try { return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount) }
  catch { return `${numberFormatter.format(amount)} ${currency}` }
}

function fmtPath(p: string) {
  // 截短超长路径：显示后 50 个字符
  return p.length > 48 ? '…' + p.slice(-46) : p
}

export default function Status() {
  const [data, setData]       = useState<StatusData | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [balLoading, setBalLoading] = useState(true)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    getStatus()
      .then((d) => {
        if (!active) return
        const sd = d as StatusData
        setData(sd)
        if (sd.user?.role === 'admin') {
          setBalLoading(true)
          getBalance<BalanceData>(controller.signal)
            .then((b) => {
              if (!active) return
              setBalance(b)
              setBalLoading(false)
            })
            .catch(() => {
              if (!active) return
              setBalance({ available: false, reason: 'fetch_error' })
              setBalLoading(false)
            })
        } else {
          setBalLoading(false)
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e, '无法加载系统状态，请稍后重试。'))
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  if (error) return <div className="status-state status-error" role="alert">无法加载状态：{error}</div>
  if (!data) return <div className="status-state" role="status">加载中…</div>

  const usage = data.token_usage
  const totalTokens = usage.total_tokens ?? (usage.total_prompt_tokens + usage.total_completion_tokens)

  return (
    <div className="status-view">
      <h1>系统状态</h1>

      <span className="visually-hidden" role="status">{data.user?.role === 'admin' ? balLoading ? '正在查询账户余额…' : balance?.available ? '账户余额查询完成。' : '账户余额查询失败，请稍后刷新重试。' : ''}</span>
      <div className="status-grid">
        {/* ── Vault ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">课程资料</h2>
          <div className="status-row">
            <span className="status-label">根目录</span>
            <span className="status-value" title={data.vault.path} translate="no">
              {fmtPath(data.vault.path)}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">目录存在</span>
            <span className="status-value">
              <span className={`badge ${data.vault.exists ? 'badge-success' : 'badge-danger'}`}>
                {data.vault.exists ? '是' : '否'}
              </span>
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">原始资料目录</span>
            <span className="status-value" title={data.vault.raw_sources_dir ?? '未配置'} translate="no">
              {data.vault.raw_sources_dir ? fmtPath(data.vault.raw_sources_dir) : '—'}
            </span>
          </div>
        </section>

        {/* ── Wiki ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">Wiki</h2>
          <div className="status-row">
            <span className="status-label">知识图谱路径</span>
            <span className="status-value" title={data.wiki.path} translate="no">
              {fmtPath(data.wiki.path)}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">目录存在</span>
            <span className="status-value">
              <span className={`badge ${data.wiki.exists ? 'badge-success' : 'badge-danger'}`}>
                {data.wiki.exists ? '是' : '否'}
              </span>
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">总笔记数</span>
            <span className="status-value">{fmtNum(data.wiki.total_notes)}</span>
          </div>
          {data.context && <div className="status-row">
            <span className="status-label">上下文 / 压缩阈值</span>
            <span className="status-value">{fmtNum(data.context.wiki_chars)} / {fmtNum(data.context.history_compact_at)} 字符</span>
          </div>}
        </section>

        {/* ── 今日配额 ──────────────────────────────── */}
        {data.quota && (
          <section className="status-card panel">
            <h2 className="status-card-title">今日配额</h2>
            <div className="status-row">
              <span className="status-label">今日已用</span>
              <span className="status-value">{fmtNum(data.quota.used_today)} tokens</span>
            </div>
            <div className="status-row">
              <span className="status-label">每日上限</span>
              <span className="status-value">
                <span className={`badge ${data.quota.limited ? 'badge-warning' : 'badge-success'}`}>
                  {data.quota.limited ? `${fmtNum(data.quota.daily_limit)} tokens` : '不限（管理员）'}
                </span>
              </span>
            </div>
          </section>
        )}

        {/* ── LLM ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">LLM</h2>
          <div className="status-row">
            <span className="status-label">API Key</span>
            <span className="status-value">
              <span className={`badge ${data.llm.api_key_set ? 'badge-success' : 'badge-danger'}`}>
                {data.llm.api_key_set ? '已配置' : '未配置'}
              </span>
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">接入点</span>
            <span className="status-value" title={data.llm.base_url} translate="no">
              {fmtPath(data.llm.base_url)}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">默认模型</span>
            <span className="status-value" translate="no">{data.llm.default_model}<span translate="yes">（多模态）</span></span>
          </div>
          <div className="status-row">
            <span className="status-label">推理模型</span>
            <span className="status-value" translate="no">{data.llm.reasoning_model}</span>
          </div>
          {data.user?.role === 'admin' && (
            <>
              <div className="status-row">
                <span className="status-label">账户余额</span>
                <span className="status-value">
                  {balLoading
                    ? <span className="badge">查询中…</span>
                    : balance?.available
                      ? <span className="badge badge-success">
                          {fmtCurrency(balance.total_balance, balance.currency)}
                        </span>
                      : <span className="badge badge-danger">
                          {balance?.reason === 'api_key_not_set' ? '未配置 Key' : '查询失败，请稍后刷新重试'}
                        </span>
                  }
                </span>
              </div>
              {balance?.available && (
                <div className="status-row status-subrow">
                  <span className="status-label">充值余额</span>
                  <span className="status-value">{fmtCurrency(balance.topped_up_balance, balance.currency)}</span>
                </div>
              )}
              {balance?.available && (
                <div className="status-row status-subrow">
                  <span className="status-label">赠送余额</span>
                  <span className="status-value">{fmtCurrency(balance.granted_balance, balance.currency)}</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Token 用量 ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">Token 用量（累计）</h2>
          <div className="status-row">
            <span className="status-label">总调用次数</span>
            <span className="status-value">{fmtNum(usage.total_calls)}</span>
          </div>
          <div className="status-row">
            <span className="status-label">输入 tokens</span>
            <span className="status-value">{fmtNum(usage.total_prompt_tokens)}</span>
          </div>
          <div className="status-row">
            <span className="status-label">输出 tokens</span>
            <span className="status-value">{fmtNum(usage.total_completion_tokens)}</span>
          </div>
          <div className="status-row">
            <span className="status-label">合计 tokens</span>
            <span className="status-value">
              <span className="badge badge-accent">{fmtNum(totalTokens)}</span>
            </span>
          </div>
        </section>

        {/* ── 按命令明细 ──────────────────────────────── */}
        {Object.keys(usage.by_command ?? {}).length > 0 && (
          <section className="status-card panel">
            <h2 className="status-card-title">按命令明细</h2>
            {Object.entries(usage.by_command).map(([cmd, m]) => (
              <div className="status-row" key={cmd}>
                <span className="status-label" translate="no">{cmd}</span>
                <span className="status-value">
                  {fmtNum(m.tokens)} tokens · {fmtNum(m.calls)} 次
                </span>
              </div>
            ))}
          </section>
        )}

        {/* ── 按模型明细 ──────────────────────────────── */}
        {Object.keys(usage.by_model).length > 0 && (
          <section className="status-card panel">
            <h2 className="status-card-title">按模型明细</h2>
            {Object.entries(usage.by_model).map(([model, m]) => (
              <div className="status-row" key={model}>
                <span className="status-label" translate="no">{model}</span>
                <span className="status-value">
                  {fmtNum(m.tokens)} tokens · {fmtNum(m.calls)} 次
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
