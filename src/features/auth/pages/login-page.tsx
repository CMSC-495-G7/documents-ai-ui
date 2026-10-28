import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '../../../common/config/paths.ts'
import { signIn } from '../api/sign-in.ts'
import './login-page.css'

export function LoginPage() {
  const navigate = useNavigate()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const emailMissing = email.trim() === ''
  const passwordMissing = password === ''
  // The error shows after a submit and clears as soon as either field changes.
  const hasError = submitted && (emailMissing || passwordMissing)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (emailMissing || passwordMissing) {
      setSubmitted(true)
      ;(emailMissing ? emailRef : passwordRef).current?.focus()
      return
    }
    await signIn({ email: email.trim(), password })
    navigate(paths.chat)
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    setSubmitted(false)
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    setSubmitted(false)
  }

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="login-brand">
          <span className="login-brand-mark">
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l9 5-9 5-9-5z" />
              <path d="M3 13l9 5 9-5" />
            </svg>
          </span>
          DocumentsAI
        </div>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-heading">
            <h1>Sign in to DocumentsAI</h1>
            <p>Use your Acme work account.</p>
          </div>

          {hasError && (
            <div role="alert" className="login-alert">
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 4.3L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
              </svg>
              <span>Both fields are required.</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">Work email</label>
            <span
              className="login-input"
              data-invalid={hasError && emailMissing}
            >
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@acme.example"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                aria-invalid={hasError && emailMissing}
                aria-describedby={hasError ? 'login-field-error' : undefined}
              />
            </span>
          </div>

          <div className="login-field">
            <div className="login-label-row">
              <label htmlFor="password">Password</label>
              <a href="#">Forgot password?</a>
            </div>
            <span
              className="login-input"
              data-invalid={hasError && passwordMissing}
            >
              <input
                ref={passwordRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                aria-invalid={hasError && passwordMissing}
                aria-describedby={hasError ? 'login-field-error' : undefined}
              />
              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                </svg>
              </button>
            </span>
            {hasError && (
              <span id="login-field-error" className="login-field-error">
                Enter your email and password.
              </span>
            )}
          </div>

          <button type="submit" className="login-primary">
            Sign in
          </button>

          <div className="login-divider">or</div>

          <button
            type="button"
            className="login-sso"
            disabled
            aria-describedby="sso-later"
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 11h12v9H6z" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Continue with company SSO
            <span id="sso-later" className="login-badge">
              Coming later
            </span>
          </button>
        </form>

        <p className="login-footer">
          Need access? Ask your workspace admin for an invite.
        </p>
      </main>
    </div>
  )
}
