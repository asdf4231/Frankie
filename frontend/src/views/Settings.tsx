/**
 * Settings — 密码修改，以及管理员只读配置视图。
 *
 * 敏感配置值由服务端掩码后展示。
 */

import { useEffect, useState } from 'react'
import { changePassword, type AuthMe } from '../api/client'
import './Settings.css'

interface EnvPair {
  key: string
  value: string
  sensitive: boolean
}

interface SettingsData {
  toml: Record<string, unknown>
  env: EnvPair[]
  summary: {
    vault_path: string
    wiki_dir: string
    raw_sources_dir: string
    default_model: string
    reasoning_model: string
    api_key_masked: string
    base_url: string
  }
}

// ── 递归渲染 TOML 对象 ────────────────────────────────────

function TomlSection({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="toml-section">
      {Object.entries(data).map(([key, val]) => {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          return (
            <div key={key} className="toml-group">
              <div className="toml-group-header">[{key}]</div>
              <TomlSection data={val as Record<string, unknown>} />
            </div>
          )
        }
        const display = Array.isArray(val)
          ? val.join(', ') || '—'
          : val === '' || val === null || val === undefined
            ? '—'
            : String(val)
        return (
          <div key={key} className="toml-row">
            <span className="toml-key">{key}</span>
            <span className="toml-val" title={display}>{display}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────

const API_KEY_NAME = 'DEEPSEEK_API_KEY'

function AdminSettings({ data }: { data: SettingsData }) {
  const hasToml = Object.keys(data.toml).length > 0
  const apiKeyPair = data.env.find((pair) => pair.key === API_KEY_NAME)
  const env = apiKeyPair
    ? data.env
    : [{ key: API_KEY_NAME, value: data.summary.api_key_masked, sensitive: true }, ...data.env]
  const hasApiKey = Boolean(data.summary.api_key_masked || apiKeyPair?.value)

  return (
    <>
      <section className="settings-panel panel" aria-labelledby="settings-config-title">
        <div className="settings-panel-heading">
          <h2 id="settings-config-title">配置</h2>
          <span className="settings-source">config/settings.toml</span>
          <span className="badge">只读</span>
        </div>
        {hasToml
          ? <TomlSection data={data.toml} />
          : <p className="settings-empty">未找到 settings.toml 文件</p>}
      </section>

      <section className="settings-panel panel" aria-labelledby="settings-env-title">
        <div className="settings-panel-heading">
          <h2 id="settings-env-title">环境变量</h2>
          <span className="settings-source">.env</span>
          <span className="badge">只读</span>
        </div>
        <p className="settings-caption">敏感字段中段已隐藏</p>
        <div className="settings-env-list">
          {env.map((pair) => (
            <div className="settings-env-entry" key={pair.key}>
              <div className="toml-row">
                <span className="toml-key">{pair.key}</span>
                <span className="toml-val" title={pair.value || '未配置'}>
                  {pair.value || '—'}
                </span>
              </div>
              {pair.key === API_KEY_NAME && !hasApiKey && (
                <p className="settings-key-hint">未配置 API Key，LLM 对话功能不可用。</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default function Settings({ me }: { me: AuthMe }) {
  const [data, setData] = useState<SettingsData | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(me.role === 'admin')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (me.role !== 'admin') return

    let active = true
    const controller = new AbortController()

    fetch('/api/settings', { credentials: 'include', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<SettingsData>
      })
      .then((settings) => {
        if (active) setData(settings)
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) return
        setConfigError(error instanceof Error ? error.message : '加载失败')
      })
      .finally(() => {
        if (active) setConfigLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [me.role])

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordSubmitting(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      await changePassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      setPasswordSuccess('密码修改成功')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '密码修改失败')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div className="settings-view">
      <div className="settings-content">
        <h1>设置</h1>

        <div className="settings-sections">
          <section className="settings-panel panel" aria-labelledby="settings-security-title">
            <h2 id="settings-security-title">账号与安全</h2>
            <form className="settings-password-form" onSubmit={handlePasswordSubmit}>
              <label htmlFor="settings-old-password">原密码</label>
              <input
                className="input"
                id="settings-old-password"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                disabled={passwordSubmitting}
              />

              <label htmlFor="settings-new-password">新密码（至少 8 位）</label>
              <input
                className="input"
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={passwordSubmitting}
              />

              <div className="settings-password-actions">
                <button className="btn btn-primary" type="submit" disabled={passwordSubmitting}>
                  {passwordSubmitting ? '修改中…' : '修改密码'}
                </button>
                {passwordError && <p className="settings-feedback is-error" role="alert">{passwordError}</p>}
                {passwordSuccess && <p className="settings-feedback is-success" role="status">{passwordSuccess}</p>}
              </div>
            </form>
          </section>

          {me.role === 'admin' && configLoading && (
            <p className="settings-config-state" role="status">正在加载配置…</p>
          )}
          {me.role === 'admin' && configError && (
            <p className="settings-config-state is-error" role="alert">无法加载配置：{configError}</p>
          )}
          {me.role === 'admin' && data && !configLoading && !configError && <AdminSettings data={data} />}
        </div>
      </div>
    </div>
  )
}
