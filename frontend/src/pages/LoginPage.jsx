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
  const [notice, setNotice] = useState(() => {
    const msg = sessionStorage.getItem('auth_notice')
    if (msg) {
      sessionStorage.removeItem('auth_notice')
      return msg
    }
    return ''
  })
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={returnTo} replace />

  const submit = async (e) => {
    e.preventDefault()
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
    <div className="auth-neo-split-wrap">
      {/* Left Column: Atmospheric Library Visual & Editorial Quote */}
      <div className="auth-neo-art-side" aria-hidden="true">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LibraryLogo width={180} height={44} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#93c5fd', textTransform: 'uppercase' }}>
            DIGITAL ARCHIVE
          </span>
        </div>

        <div className="auth-neo-quote-box">
          <div className="auth-neo-quote-text">
            “Một cuốn sách thực sự giá trị sẽ khai mở tư duy, dạy ta cách quan sát thế giới với sự thông tuệ và sâu sắc hơn.”
          </div>
          <div className="auth-neo-quote-author">
            — Không Gian Thư Viện Tri Thức Athenaeum
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: 18, fontSize: 12.5, color: '#94a3b8' }}>
          <span>© 2026 Thư Viện Số Athenaeum</span>
          <span>Khám phá · Tích lũy · Khai phóng</span>
        </div>
      </div>

      {/* Right Column: Clean Modern Form */}
      <div className="auth-neo-form-side">
        <div className="auth-neo-form-box">
          <div style={{ marginBottom: 24 }}>
            <h1 className="auth-neo-form-title">Đăng nhập bạn đọc</h1>
            <p className="auth-neo-form-sub">Chào mừng bạn quay lại với không gian thư viện số.</p>
          </div>

          {notice && <Alert type="warning">{notice}</Alert>}
          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="email" style={{ fontWeight: 600, fontSize: 13 }}>Địa chỉ Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@library.com"
                required
                autoFocus
                autoComplete="email"
                style={{ borderRadius: 8, padding: '10px 14px' }}
              />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label htmlFor="password" style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Mật khẩu</label>
                <Link to="/forgot-password" style={{ fontSize: 12.5, color: 'var(--neo-cobalt-600)', fontWeight: 600 }}>
                  Quên mật khẩu?
                </Link>
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

            <button
              className="btn btn-primary btn-block"
              disabled={busy}
              type="submit"
              style={{ marginTop: 12, padding: '11px 16px', borderRadius: 8, fontSize: 14 }}
            >
              {busy ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
            </button>

            <div className="auth-switch" style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5 }}>
              Chưa có thẻ thành viên?{' '}
              <Link to="/register" style={{ color: 'var(--neo-cobalt-600)', fontWeight: 700 }}>
                Đăng ký tài khoản bạn đọc
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
