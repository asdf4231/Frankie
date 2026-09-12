import { useState } from 'react'
import { login } from '../api/client'
import './Login.css'

export default function Login({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(userId.trim(), password)
      await onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <div className="login-main">
        <div className="login-column">
          <header className="login-brand">
            <img className="login-logo" src="/xmuc-logo.svg" alt="厦门大学" />
            <h1>厦门大学课程辅助系统</h1>
            <p>动态优化课程 · Frankie 助教</p>
          </header>

          <form className="login-fields" onSubmit={handleSubmit}>
            <label htmlFor="login-user-id">学号 / 账号</label>
            <input
              className="input input-lg"
              id="login-user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              autoComplete="username"
              placeholder="请输入学号或工号"
              aria-describedby={error ? 'login-error' : undefined}
              autoFocus
            />

            <label htmlFor="login-password">密码</label>
            <input
              className="input input-lg"
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
              aria-describedby={error ? 'login-error' : undefined}
            />

            {error && <p className="login-error" id="login-error" role="alert">{error}</p>}

            <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
              {submitting ? '登录中…' : '登录'}
            </button>
          </form>
        </div>
      </div>

      <footer className="login-footer">厦门大学 · 动态优化课程 · Frankie</footer>
    </main>
  )
}
