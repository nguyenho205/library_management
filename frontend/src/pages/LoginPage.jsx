import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { readError } from '../api/errors'
import { LibraryLogo, MailIcon, KeyIcon } from '../components/Icons'
import Alert from '../components/Alert'
import PasswordInput from '../components/PasswordInput'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const returnTo = '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={returnTo} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
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
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <LibraryLogo width={32} height={32} />
          </div>
          <h1>Đăng nhập</h1>
          <p className="sub">Hệ thống quản lý tài liệu và mượn trả sách</p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Địa chỉ Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@library.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <label htmlFor="password" style={{ margin: 0 }}>Mật khẩu</label>
              <Link to="/forgot-password" style={{ fontSize: 12.5 }}>Quên mật khẩu?</Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={busy} type="submit" style={{ marginTop: 8 }}>
            {busy ? 'Đang đăng nhập...' : 'Đăng nhập vào hệ thống'}
          </button>

          <div className="auth-switch">
            Chưa có thẻ thành viên? <Link to="/register">Đăng ký tài khoản</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
