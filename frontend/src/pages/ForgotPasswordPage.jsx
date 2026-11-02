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
            “Bảo mật tài khoản là chìa khóa gìn giữ hành trình đọc và bảo vệ tài liệu tri thức của bạn.”
          </div>
          <div className="auth-neo-quote-author">
            — Khôi phục tài khoản bạn đọc Athenaeum
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
            <h1 className="auth-neo-form-title">Khôi phục mật khẩu</h1>
            <p className="auth-neo-form-sub">
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
              <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--neo-emerald-500)' }}>
                <CheckCircleIcon width={56} height={56} />
              </div>
              <Link className="btn btn-primary btn-block" to="/login" style={{ padding: '11px 16px', borderRadius: 8 }}>
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              {!sent ? (
                <div className="field">
                  <label htmlFor="email" style={{ fontWeight: 600, fontSize: 13 }}>Email đã đăng ký</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                    style={{ borderRadius: 8, padding: '10px 14px' }}
                  />
                </div>
              ) : (
                <>
                  <div className="field">
                    <label htmlFor="reset-code" style={{ fontWeight: 600, fontSize: 13 }}>Mã xác thực (6 chữ số)</label>
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
                      style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '20px', fontWeight: 'bold', padding: '12px' }}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="new-password" style={{ fontWeight: 600, fontSize: 13 }}>Mật khẩu mới</label>
                    <PasswordInput
                      id="new-password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      required
                    />
                    <div className="field-hint" style={{ fontSize: 12, marginTop: 4 }}>Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</div>
                  </div>

                  <div className="field">
                    <label htmlFor="confirm-password" style={{ fontWeight: 600, fontSize: 13 }}>Xác nhận mật khẩu mới</label>
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
                style={{ marginTop: 12, padding: '11px 16px', borderRadius: 8, fontSize: 14 }}
              >
                {busy ? 'Đang xử lý...' : sent ? 'Cập nhật mật khẩu' : 'Gửi mã xác thực'}
              </button>

              {sent && (
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  disabled={busy}
                  onClick={resend}
                  style={{ marginTop: 8, padding: '10px 16px', borderRadius: 8 }}
                >
                  Gửi lại mã xác thực
                </button>
              )}

              <div className="auth-switch" style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5 }}>
                <Link to="/login" style={{ color: 'var(--neo-cobalt-600)', fontWeight: 700 }}>
                  Quay lại trang đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
