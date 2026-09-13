import { useEffect, useRef, useState } from 'react'
import { errorMessage, errorStatus, login } from '../api/client'
import Icon from '../components/Icon'
import './Login.css'

export default function Login({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<{ message: string; credentials: boolean } | null>(null)
  const userRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) userRef.current?.focus({ preventScroll: true })
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(userId.trim(), password)
      await onSuccess()
    } catch (failure) {
      const credentials = errorStatus(failure) === 401
      setError({ message: errorMessage(failure, '登录失败，请稍后重试。'), credentials })
      requestAnimationFrame(() => (credentials ? userId.trim() ? passwordRef.current : userRef.current : errorRef.current)?.focus())
    } finally { setSubmitting(false) }
  }

  return (
    <main className="login-shell">
      <div className="login-main"><div className="login-column">
        <header className="login-brand">
          <img className="login-logo" src="/xmuc-logo.svg" alt="厦门大学" />
          <h1>厦门大学课程辅助系统</h1>
          <p>动态优化课程 · <span translate="no">Frankie</span> 助教</p>
        </header>
        <form className="login-fields" onSubmit={handleSubmit} aria-busy={submitting}>
          <label htmlFor="login-user-id">学号 / 账号</label>
          <input ref={userRef} className="input input-lg" id="login-user-id" name="username" value={userId}
            onChange={(event) => setUserId(event.target.value)} autoComplete="username" spellCheck={false}
            placeholder="请输入学号或工号…" required disabled={submitting} aria-invalid={!!error?.credentials} aria-describedby={error?.credentials ? 'login-error' : undefined} />
          <label htmlFor="login-password">密码</label>
          <input ref={passwordRef} className="input input-lg" id="login-password" name="password" type="password" value={password}
            onChange={(event) => setPassword(event.target.value)} autoComplete="current-password"
            placeholder="请输入密码…" required disabled={submitting} aria-invalid={!!error?.credentials} aria-describedby={error?.credentials ? 'login-error' : undefined} />
          {error && <p ref={errorRef} className="login-error" id="login-error" role="alert" tabIndex={-1}>{error.message}</p>}
          <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
            {submitting && <Icon name="loader" size={16} className="spin" />}{submitting ? '登录中…' : '登录'}
          </button>
          <span className="visually-hidden" role="status">{submitting ? '正在登录，请稍候。' : ''}</span>
        </form>
      </div></div>
      <footer className="login-footer">厦门大学 · 动态优化课程 · <span translate="no">Frankie</span></footer>
    </main>
  )
}
