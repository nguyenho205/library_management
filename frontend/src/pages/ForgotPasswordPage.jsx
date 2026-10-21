import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { readError } from '../api/errors'
import { LibraryLogo, CheckCircleIcon } from '../components/Icons'
import Alert from '../components/Alert'
import PasswordInput from '../components/PasswordInput'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [completed, setCompleted] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (sent && newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setBusy(true)
    try {
      if (!sent) {
        await authApi.forgotPassword(email)
        setSent(true)
      } else {
        await authApi.resetPassword(email, code, newPassword)
        setCompleted(true)
      }
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError('')
    setBusy(true)
    try {
      await authApi.forgotPassword(email)
      setCode('')
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
          <h1>Quên mật khẩu</h1>
          <p className="sub">
            {completed
              ? 'Mật khẩu đã được cập nhật thành công.'
              : sent
              ? `Nhập mã xác thực đã gửi tới ${email}`
              : 'Nhập email tài khoản để nhận mã khôi phục mật khẩu.'}
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {sent && !completed && (
          <Alert type="success">Đã gửi mã xác thực tới {email}. Mã có hiệu lực trong 10 phút.</Alert>
        )}
        {completed && (
          <Alert type="success">Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.</Alert>
        )}

        {completed ? (
          <div>
            <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--color-success)' }}>
              <CheckCircleIcon width={48} height={48} />
            </div>
            <Link className="btn btn-primary btn-block" to="/login">
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            {!sent ? (
              <div className="field">
                <label htmlFor="email">Email đã đăng ký</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="reset-code">Mã xác thực (6 chữ số)</label>
                  <input
                    id="reset-code"
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
                </div>

                <div className="field">
                  <label htmlFor="new-password">Mật khẩu mới</label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                  />
                  <div className="field-hint">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</div>
                </div>

                <div className="field">
                  <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                  <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>
              </>
            )}

            <button
              className="btn btn-primary btn-block"
              disabled={busy || (sent && code.length !== 6)}
              type="submit"
              style={{ marginTop: 8 }}
            >
              {busy ? 'Đang xử lý...' : sent ? 'Cập nhật mật khẩu' : 'Gửi mã xác thực'}
            </button>

            {sent && (
              <button
                type="button"
                className="btn btn-block"
                disabled={busy}
                onClick={resend}
                style={{ marginTop: 8 }}
              >
                Gửi lại mã xác thực
              </button>
            )}

            <div className="auth-switch">
              <Link to="/login">Quay lại trang đăng nhập</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
