import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { readError } from '../api/errors'
import { MailIcon, LockIcon, BookIcon, UserIcon, CheckCircleIcon, ChevronRightIcon } from '../components/Icons'
import Alert from '../components/Alert'
import PasswordInput from '../components/PasswordInput'
import '../styles/login-page.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [stage, setStage] = useState('register')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (form.password !== form.confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await authApi.register(form)
      setStage('verify')
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const response = await authApi.verifyEmail(form.email, code)
      setNotice(response.message)
      setStage('verified')
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const response = await authApi.resendVerification(form.email)
      setNotice(response.message)
      setStage('verify')
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  const heading = stage === 'verified'
    ? { eyebrow: 'Welcome to the library', title: 'You’re all set', copy: 'Your reader account is ready. Sign in and find your next favorite.' }
    : stage === 'verify'
      ? { eyebrow: 'One last step', title: 'Check your email', copy: <>Enter the six-digit code sent to <strong>{form.email}</strong>.</> }
      : { eyebrow: 'Join the reading room', title: 'Create your account', copy: 'A world of books is waiting. Start your reading journey here.' }

  return (
    <main className="login-page register-page">
      <div className="login-page__backdrop" aria-hidden="true" />
      <div className="login-page__shade" aria-hidden="true" />

      <header className="login-navigation">
        <Link className="login-navigation__brand" to="/login" aria-label="Library home">
          <svg className="login-navigation__icon" width="48" height="40" viewBox="0 0 48 40" fill="none" aria-hidden="true">
            <path d="M23.5 9.2C18.1 4.7 10.7 4.4 4 6.9v22.8c7-2.5 13.6-2 19.5 2.6V9.2Z" fill="#F0C98F" />
            <path d="M24.5 9.2c5.4-4.5 12.8-4.8 19.5-2.3v22.8c-7-2.5-13.6-2-19.5 2.6V9.2Z" fill="#D7A45F" />
            <path d="m4.5 33 19.5 3 19.5-3M24 9v27M10 12v12m6-13v13m16-13v13m6-12v12" stroke="#F7E6C9" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Library</span>
        </Link>
        <nav className="login-navigation__links" aria-label="Main navigation">
          <Link to="/login">Books <span className="login-navigation__chevron">⌄</span></Link>
          <a href="#register-hero">Our reading room</a>
        </nav>
        <div className="login-navigation__actions">
          <Link className="login-navigation__login" to="/login">Login</Link>
          <span className="login-navigation__signup" aria-current="page">Sign Up</span>
        </div>
      </header>

      <section className="login-hero register-hero" id="register-hero" aria-labelledby="register-hero-title">
        <div className="login-hero__copy">
          <p className="login-hero__eyebrow">Read <i /> Learn <i /> Grow</p>
          <h1 id="register-hero-title">A world of<br /><span>stories awaits</span></h1>
          <p className="login-hero__description">Make room for new ideas, old favorites, and the books you haven’t discovered yet.</p>
          <Link className="login-hero__explore" to="/login">Back to Sign In <ChevronRightIcon width={18} height={18} /></Link>
          <div className="login-hero__note"><span className="login-hero__note-icon"><BookIcon width={17} height={17} /></span> Your next chapter starts here</div>
        </div>
        <div className="login-hero__prompt"><span className="login-hero__prompt-rule" /><span>Find your next favorite</span></div>
      </section>

      <footer className="login-page__footer"><span>Read · Learn · Grow</span><span>Find a little more wonder.</span></footer>

      <section className="login-panel register-panel" role="region" aria-labelledby="register-panel-title">
        <div className="login-panel__heading">
          <span className="login-panel__mark">{stage === 'verified' ? <CheckCircleIcon width={19} height={19} /> : <BookIcon width={19} height={19} />}</span>
          <p className="login-panel__eyebrow">{heading.eyebrow}</p>
          <h2 id="register-panel-title">{heading.title}</h2>
          <p className="login-panel__subheading">{heading.copy}</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}

        {stage === 'verified' ? (
          <div className="register-success">
            <p>Your email has been verified. You can now sign in and explore the collection.</p>
            <Link className="login-form__submit" to="/login">Continue to Sign In <ChevronRightIcon width={19} height={19} /></Link>
          </div>
        ) : stage === 'verify' ? (
          <form className="login-form" onSubmit={verify}>
            <label className="login-form__field" htmlFor="register-code">
              <span>Verification code</span>
              <span className="login-form__input-wrap"><MailIcon width={18} height={18} /><input id="register-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" required autoFocus /></span>
            </label>
            <p className="register-form__hint">The code is valid for 10 minutes.</p>
            <button className="login-form__submit" type="submit" disabled={busy || code.length !== 6}>{busy ? 'Verifying…' : <>Verify email <ChevronRightIcon width={19} height={19} /></>}</button>
            <button className="register-form__secondary" type="button" disabled={busy} onClick={resend}>{busy ? 'Sending…' : 'Resend verification code'}</button>
            <button className="register-form__back" type="button" onClick={() => { setError(''); setNotice(''); setStage('register') }}>Back to account details</button>
          </form>
        ) : (
          <form className="login-form register-form" onSubmit={submit}>
            <label className="login-form__field" htmlFor="register-name">
              <span>Full name</span>
              <span className="login-form__input-wrap"><UserIcon width={18} height={18} /><input id="register-name" value={form.fullName} onChange={set('fullName')} placeholder="Your name" autoComplete="name" required autoFocus /></span>
            </label>
            <label className="login-form__field" htmlFor="register-email">
              <span>Email address</span>
              <span className="login-form__input-wrap"><MailIcon width={18} height={18} /><input id="register-email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" required /></span>
            </label>
            <div className="login-form__field">
              <span id="register-password-label">Password</span>
              <span className="login-form__input-wrap"><LockIcon width={18} height={18} /><PasswordInput id="register-password" aria-labelledby="register-password-label" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="Create a password" required /></span>
            </div>
            <p className="register-form__hint">Use at least 8 characters with uppercase, lowercase, a number, and a symbol.</p>
            <div className="login-form__field">
              <span id="register-confirm-label">Confirm password</span>
              <span className="login-form__input-wrap"><LockIcon width={18} height={18} /><PasswordInput id="register-confirm" aria-labelledby="register-confirm-label" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Enter your password again" required /></span>
            </div>
            <button className="login-form__submit" type="submit" disabled={busy}>{busy ? 'Creating account…' : <>Create Account <ChevronRightIcon width={19} height={19} /></>}</button>
            <button className="register-form__secondary" type="button" disabled={busy || !form.email} onClick={() => { setError(''); setNotice(''); setStage('verify') }}>Already registered? Enter your code</button>
          </form>
        )}

        {stage !== 'verified' && <p className="login-panel__register">Already have an account? <Link to="/login">Sign in</Link></p>}
        <p className="login-panel__privacy">Your reading journey is always yours.</p>
      </section>
    </main>
  )
}
