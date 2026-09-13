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
      setError({ message: errorMessage(failure, 'Sign-in failed. Try again later.'), credentials })
      requestAnimationFrame(() => (credentials ? userId.trim() ? passwordRef.current : userRef.current : errorRef.current)?.focus())
    } finally { setSubmitting(false) }
  }

  return (
    <main className="login-shell">
      <div className="login-main"><div className="login-column">
        <header className="login-brand">
          <img className="login-logo" src="/xmuc-logo.svg" alt="Xiamen University" />
          <h1>Frankie, Your AI Teaching Assistant</h1>
          <p>For the Dynamic Optimization course</p>
        </header>
        <form className="login-fields" onSubmit={handleSubmit} aria-busy={submitting}>
          <label htmlFor="login-user-id">Student ID / Account</label>
          <input ref={userRef} className="input input-lg" id="login-user-id" name="username" value={userId}
            onChange={(event) => setUserId(event.target.value)} autoComplete="username" spellCheck={false}
            placeholder="Enter your student ID or staff ID…" required disabled={submitting} aria-invalid={!!error?.credentials} aria-describedby={error?.credentials ? 'login-error' : undefined} />
          <label htmlFor="login-password">Password</label>
          <input ref={passwordRef} className="input input-lg" id="login-password" name="password" type="password" value={password}
            onChange={(event) => setPassword(event.target.value)} autoComplete="current-password"
            placeholder="Enter your password…" required disabled={submitting} aria-invalid={!!error?.credentials} aria-describedby={error?.credentials ? 'login-error' : undefined} />
          {error && <p ref={errorRef} className="login-error" id="login-error" role="alert" tabIndex={-1}>{error.message}</p>}
          <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
            {submitting && <Icon name="loader" size={16} className="spin" />}{submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <span className="visually-hidden" role="status">{submitting ? 'Signing in. Please wait.' : ''}</span>
        </form>
      </div></div>
      <footer className="login-footer">Xiamen University · Dynamic Optimization · <span translate="no">Frankie</span></footer>
    </main>
  )
}
