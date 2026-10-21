import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { readError } from '../api/errors'
import { LibraryLogo, CheckCircleIcon } from '../components/Icons'
import Alert from '../components/Alert'
import PasswordInput from '../components/PasswordInput'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [stage, setStage] = useState('register') // 'register' | 'verify' | 'verified'
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
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

  const verify = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await authApi.verifyEmail(form.email, code)
      setNotice(res.message)
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
      const res = await authApi.resendVerification(form.email)
      setNotice(res.message)
      setStage('verify')
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
          {stage === 'verified' ? (
            <>
              <h1>Xác thực thành công</h1>
              <p className="sub">Tài khoản thành viên của bạn đã sẵn sàng sử dụng.</p>
            </>
          ) : stage === 'verify' ? (
            <>
              <h1>Nhập mã xác thực</h1>
              <p className="sub">Mã 6 chữ số đã được gửi tới {form.email}</p>
            </>
          ) : (
            <>
              <h1>Đăng ký thành viên</h1>
              <p className="sub">Nhận thẻ thư viện để tra cứu và mượn sách trực tuyến</p>
            </>
          )}
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}

        {stage === 'verified' ? (
          <div>
            <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--color-success)' }}>
              <CheckCircleIcon width={48} height={48} />
            </div>
            <Link className="btn btn-primary btn-block" to="/login">
              Tiến hành đăng nhập
            </Link>
          </div>
        ) : stage === 'verify' ? (
          <form onSubmit={verify}>
            <div className="field">
              <label htmlFor="verificationCode">Mã xác thực (6 chữ số)</label>
              <input
                id="verificationCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                autoFocus
                style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '18px', fontWeight: 'bold' }}
              />
              <div className="field-hint">Mã có hiệu lực trong 10 phút kể từ lúc gửi.</div>
            </div>

            <button
              className="btn btn-primary btn-block"
              disabled={busy || code.length !== 6}
              type="submit"
              style={{ marginTop: 8 }}
            >
              {busy ? 'Đang xác thực...' : 'Xác thực email'}
            </button>

            <button
              type="button"
              className="btn btn-block"
              disabled={busy}
              onClick={resend}
              style={{ marginTop: 8 }}
            >
              {busy ? 'Đang gửi...' : 'Gửi lại mã xác thực'}
            </button>

            <div className="auth-switch">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                id="fullName"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Nguyễn Văn A"
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="nguyenvana@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Mật khẩu</label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Tối thiểu 8 ký tự"
                required
              />
              <div className="field-hint">Gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!).</div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>

            <button className="btn btn-primary btn-block" disabled={busy} type="submit" style={{ marginTop: 8 }}>
              {busy ? 'Đang gửi thông tin...' : 'Tạo tài khoản'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-block"
              disabled={busy || !form.email}
              onClick={() => {
                setError('')
                setStage('verify')
              }}
              style={{ marginTop: 6 }}
            >
              Đã đăng ký nhưng chưa nhập mã?
            </button>

            <div className="auth-switch">
              Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
