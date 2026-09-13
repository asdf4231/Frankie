import { useEffect, useState } from 'react'
import { errorMessage, getBalance, getStatus } from '../api/client'
import { formatCount, numberFormatter } from '../lib/dates'
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
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) }
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
        if (active) setError(errorMessage(e, 'System status could not be loaded. Try again later.'))
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  if (error) return <div className="status-state status-error" role="alert">Could not load status: {error}</div>
  if (!data) return <div className="status-state" role="status">Loading…</div>

  const usage = data.token_usage
  const totalTokens = usage.total_tokens ?? (usage.total_prompt_tokens + usage.total_completion_tokens)

  return (
    <div className="status-view">
      <h1>System status</h1>

      <span className="visually-hidden" role="status">{data.user?.role === 'admin' ? balLoading ? 'Checking account balance…' : balance?.available ? 'Account balance check complete.' : 'The account balance check failed. Refresh to try again.' : ''}</span>
      <div className="status-grid">
        {/* ── Vault ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">Course materials</h2>
          <div className="status-row">
            <span className="status-label">Root directory</span>
            <span className="status-value" title={data.vault.path} translate="no">
              {fmtPath(data.vault.path)}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Directory exists</span>
            <span className="status-value">
              <span className={`badge ${data.vault.exists ? 'badge-success' : 'badge-danger'}`}>
                {data.vault.exists ? 'Yes' : 'No'}
              </span>
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Raw sources directory</span>
            <span className="status-value" title={data.vault.raw_sources_dir ?? 'Not configured'} translate="no">
              {data.vault.raw_sources_dir ? fmtPath(data.vault.raw_sources_dir) : '—'}
            </span>
          </div>
        </section>

        {/* ── Wiki ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">Wiki</h2>
          <div className="status-row">
            <span className="status-label">Wiki path</span>
            <span className="status-value" title={data.wiki.path} translate="no">
              {fmtPath(data.wiki.path)}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Directory exists</span>
            <span className="status-value">
              <span className={`badge ${data.wiki.exists ? 'badge-success' : 'badge-danger'}`}>
                {data.wiki.exists ? 'Yes' : 'No'}
              </span>
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Total notes</span>
            <span className="status-value">{fmtNum(data.wiki.total_notes)}</span>
          </div>
          {data.context && <div className="status-row">
            <span className="status-label">Context / compaction threshold</span>
            <span className="status-value">{fmtNum(data.context.wiki_chars)} / {formatCount(data.context.history_compact_at, 'char')}</span>
          </div>}
        </section>

        {/* ── Today's quota ──────────────────────────────── */}
        {data.quota && (
          <section className="status-card panel">
            <h2 className="status-card-title">Today's quota</h2>
            <div className="status-row">
              <span className="status-label">Used today</span>
              <span className="status-value">{formatCount(data.quota.used_today, 'token')}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Daily limit</span>
              <span className="status-value">
                <span className={`badge ${data.quota.limited ? 'badge-warning' : 'badge-success'}`}>
                  {data.quota.limited ? formatCount(data.quota.daily_limit, 'token') : 'Unlimited (admin)'}
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
                {data.llm.api_key_set ? 'Configured' : 'Not configured'}
              </span>
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Base URL</span>
            <span className="status-value" title={data.llm.base_url} translate="no">
              {fmtPath(data.llm.base_url)}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">Default model</span>
            <span className="status-value" translate="no">{data.llm.default_model}<span translate="yes"> (multimodal)</span></span>
          </div>
          <div className="status-row">
            <span className="status-label">Reasoning model</span>
            <span className="status-value" translate="no">{data.llm.reasoning_model}</span>
          </div>
          {data.user?.role === 'admin' && (
            <>
              <div className="status-row">
                <span className="status-label">Account balance</span>
                <span className="status-value">
                  {balLoading
                    ? <span className="badge">Checking…</span>
                    : balance?.available
                      ? <span className="badge badge-success">
                          {fmtCurrency(balance.total_balance, balance.currency)}
                        </span>
                      : <span className="badge badge-danger">
                          {balance?.reason === 'api_key_not_set' ? 'Key not configured' : 'Check failed. Refresh to try again.'}
                        </span>
                  }
                </span>
              </div>
              {balance?.available && (
                <div className="status-row status-subrow">
                  <span className="status-label">Topped-up balance</span>
                  <span className="status-value">{fmtCurrency(balance.topped_up_balance, balance.currency)}</span>
                </div>
              )}
              {balance?.available && (
                <div className="status-row status-subrow">
                  <span className="status-label">Granted balance</span>
                  <span className="status-value">{fmtCurrency(balance.granted_balance, balance.currency)}</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Token usage ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">Token usage (cumulative)</h2>
          <div className="status-row">
            <span className="status-label">Total calls</span>
            <span className="status-value">{fmtNum(usage.total_calls)}</span>
          </div>
          <div className="status-row">
            <span className="status-label">Input tokens</span>
            <span className="status-value">{fmtNum(usage.total_prompt_tokens)}</span>
          </div>
          <div className="status-row">
            <span className="status-label">Output tokens</span>
            <span className="status-value">{fmtNum(usage.total_completion_tokens)}</span>
          </div>
          <div className="status-row">
            <span className="status-label">Total tokens</span>
            <span className="status-value">
              <span className="badge badge-accent">{fmtNum(totalTokens)}</span>
            </span>
          </div>
        </section>

        {/* ── By command ──────────────────────────────── */}
        {Object.keys(usage.by_command ?? {}).length > 0 && (
          <section className="status-card panel">
            <h2 className="status-card-title">By command</h2>
            {Object.entries(usage.by_command).map(([cmd, m]) => (
              <div className="status-row" key={cmd}>
                <span className="status-label" translate="no">{cmd}</span>
                <span className="status-value">
                  {formatCount(m.tokens, 'token')} · {formatCount(m.calls, 'call')}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* ── By model ──────────────────────────────── */}
        {Object.keys(usage.by_model).length > 0 && (
          <section className="status-card panel">
            <h2 className="status-card-title">By model</h2>
            {Object.entries(usage.by_model).map(([model, m]) => (
              <div className="status-row" key={model}>
                <span className="status-label" translate="no">{model}</span>
                <span className="status-value">
                  {formatCount(m.tokens, 'token')} · {formatCount(m.calls, 'call')}
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
