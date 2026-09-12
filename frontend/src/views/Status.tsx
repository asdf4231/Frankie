import { useEffect, useState } from 'react'
import { getStatus } from '../api/client'
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

function fmtNum(n: number) {
  return n.toLocaleString('zh-CN')
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
          fetch('/api/balance', { credentials: 'include', signal: controller.signal })
            .then((r) => r.ok ? r.json() as Promise<BalanceData> : Promise.reject(r.status))
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
        if (active) setError(e instanceof Error ? e.message : String(e))
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

      <div className="status-grid">
        {/* ── Vault ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">课程资料</h2>
          <div className="status-row">
            <span className="status-label">根目录</span>
            <span className="status-value" title={data.vault.path}>
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
            <span className="status-value" title={data.vault.raw_sources_dir ?? '未配置'}>
              {data.vault.raw_sources_dir ? fmtPath(data.vault.raw_sources_dir) : '—'}
            </span>
          </div>
        </section>

        {/* ── Wiki ──────────────────────────────── */}
        <section className="status-card panel">
          <h2 className="status-card-title">Wiki</h2>
          <div className="status-row">
            <span className="status-label">知识图谱路径</span>
            <span className="status-value" title={data.wiki.path}>
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
            <span className="status-value" title={data.llm.base_url}>
              {fmtPath(data.llm.base_url)}
            </span>
          </div>
          <div className="status-row">
            <span className="status-label">默认模型</span>
            <span className="status-value">{data.llm.default_model}（多模态）</span>
          </div>
          <div className="status-row">
            <span className="status-label">推理模型</span>
            <span className="status-value">{data.llm.reasoning_model}</span>
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
                          {balance.total_balance} {balance.currency}
                        </span>
                      : <span className="badge badge-danger" title={balance?.reason}>
                          {balance?.reason === 'api_key_not_set' ? '未配置 Key' : '查询失败'}
                        </span>
                  }
                </span>
              </div>
              {balance?.available && (
                <div className="status-row status-subrow">
                  <span className="status-label">充值余额</span>
                  <span className="status-value">{balance.topped_up_balance} {balance.currency}</span>
                </div>
              )}
              {balance?.available && (
                <div className="status-row status-subrow">
                  <span className="status-label">赠送余额</span>
                  <span className="status-value">{balance.granted_balance} {balance.currency}</span>
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
                <span className="status-label">{cmd}</span>
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
                <span className="status-label">{model}</span>
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
