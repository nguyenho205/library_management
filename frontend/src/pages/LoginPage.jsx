import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { readError } from '../api/errors'
import { MailIcon, LockIcon, CloseIcon, BookIcon, ChevronRightIcon } from '../components/Icons'
import Alert from '../components/Alert'
import PasswordInput from '../components/PasswordInput'
import '../styles/login-page.css'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [panelOpen, setPanelOpen] = useState(false)
  const [returnTo, setReturnTo] = useState('/')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(() => {
    const msg = sessionStorage.getItem('auth_notice')
    if (msg) sessionStorage.removeItem('auth_notice')
    return msg || ''
  })
  const [busy, setBusy] = useState(false)
  const emailInput = useRef(null)
  const loginTrigger = useRef(null)

  useEffect(() => {
    if (!panelOpen) return undefined
    emailInput.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPanelOpen(false)
        loginTrigger.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [panelOpen])

  if (user) return <Navigate to="/" replace />

  const openLogin = (destination = '/') => {
    setError('')
    setReturnTo(destination)
    setPanelOpen(true)
  }

  const closeLogin = () => {
    setPanelOpen(false)
    loginTrigger.current?.focus()
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(returnTo)
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={`login-page${panelOpen ? ' login-page--panel-open' : ''}`}>
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
          <button type="button" onClick={() => openLogin('/catalog')}>Books <span className="login-navigation__chevron">⌄</span></button>
          <a href="#reading">Our reading room</a>
        </nav>
        <div className="login-navigation__actions">
          <button ref={loginTrigger} className="login-navigation__login" type="button" onClick={openLogin}>Login</button>
          <Link className="login-navigation__signup" to="/register">Sign Up</Link>
        </div>
      </header>

      <section className="login-hero" id="reading" aria-labelledby="login-hero-title">
        <div className="login-hero__copy">
          <p className="login-hero__eyebrow">Read <i /> Learn <i /> Grow</p>
          <h1 id="login-hero-title">Welcome to<br /><span>Our Library</span></h1>
          <p className="login-hero__description">Discover a world of knowledge, explore thousands of books, and start your reading journey today.</p>
          <button className="login-hero__explore" type="button" onClick={() => openLogin('/catalog')}>Explore Books <ChevronRightIcon width={18} height={18} /></button>
          <div className="login-hero__note"><span className="login-hero__note-icon"><BookIcon width={17} height={17} /></span> A quieter place to find your next great read</div>
        </div>
        <div className="login-hero__prompt">
          <span className="login-hero__prompt-rule" />
          <span>Turn the page</span>
        </div>
      </section>

      <footer className="login-page__footer"><span>Read · Learn · Grow</span><span>Find a little more wonder.</span></footer>

      <div className={`login-panel-wrap${panelOpen ? ' is-open' : ''}`} aria-hidden={!panelOpen}>
        <button className="login-panel-wrap__scrim" type="button" tabIndex={panelOpen ? 0 : -1} aria-label="Close sign in panel" onClick={closeLogin} />
        <section className="login-panel" role="dialog" aria-modal="true" aria-labelledby="login-panel-title" inert={!panelOpen}>
          <button className="login-panel__close" type="button" onClick={closeLogin} aria-label="Close sign in"><CloseIcon width={19} height={19} /></button>
          <div className="login-panel__heading">
            <span className="login-panel__mark"><BookIcon width={19} height={19} /></span>
            <p className="login-panel__eyebrow">Your next chapter awaits</p>
            <h2 id="login-panel-title">Welcome back</h2>
            <p className="login-panel__subheading">Sign in to continue your reading journey.</p>
          </div>

          {notice && <Alert type="warning">{notice}</Alert>}
          {error && <Alert type="error">{error}</Alert>}

          <form className="login-form" onSubmit={submit}>
            <label className="login-form__field" htmlFor="login-email">
              <span>Email address</span>
              <span className="login-form__input-wrap"><MailIcon width={18} height={18} /><input ref={emailInput} id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></span>
            </label>
            <div className="login-form__field">
              <span id="login-password-label">Password</span>
              <span className="login-form__input-wrap"><LockIcon width={18} height={18} /><PasswordInput id="login-password" aria-labelledby="login-password-label" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></span>
            </div>
            <div className="login-form__options"><span>Secure member access</span><Link to="/forgot-password">Forgot password?</Link></div>
            <button className="login-form__submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : <>Sign In</>}</button>
          </form>

          <p className="login-panel__register">New to the library? <Link to="/register">Create an account</Link></p>
          <p className="login-panel__privacy">Your reading journey is always yours.</p>
        </section>
      </div>
    </main>
  )
}
