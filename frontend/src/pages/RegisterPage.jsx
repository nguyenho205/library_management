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
            “Gia nhập cộng đồng bạn đọc Athenaeum: Kết nối với hàng ngàn tài liệu học thuật và văn học giá trị không giới hạn.”
          </div>
          <div className="auth-neo-quote-author">
            — Đăng ký thẻ bạn đọc số Athenaeum
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
            {stage === 'verified' ? (
              <>
                <h1 className="auth-neo-form-title">Xác thực thành công</h1>
                <p className="auth-neo-form-sub">Tài khoản thành viên của bạn đã sẵn sàng sử dụng.</p>
              </>
            ) : stage === 'verify' ? (
              <>
                <h1 className="auth-neo-form-title">Nhập mã xác thực</h1>
                <p className="auth-neo-form-sub">Mã 6 chữ số đã được gửi tới <strong>{form.email}</strong></p>
              </>
            ) : (
              <>
                <h1 className="auth-neo-form-title">Đăng ký bạn đọc</h1>
                <p className="auth-neo-form-sub">Nhận thẻ thư viện số để tra cứu và mượn sách trực tuyến.</p>
              </>
            )}
          </div>

          {error && <Alert type="error">{error}</Alert>}
          {notice && <Alert type="success">{notice}</Alert>}

          {stage === 'verified' ? (
            <div>
              <div style={{ textAlign: 'center', margin: '28px 0', color: 'var(--neo-emerald-500)' }}>
                <CheckCircleIcon width={56} height={56} />
              </div>
              <Link className="btn btn-primary btn-block" to="/login" style={{ padding: '11px 16px', borderRadius: 8 }}>
                Tiến hành đăng nhập ngay
              </Link>
            </div>
          ) : stage === 'verify' ? (
            <form onSubmit={verify}>
              <div className="field">
                <label htmlFor="verificationCode" style={{ fontWeight: 600, fontSize: 13 }}>Mã xác thực (6 chữ số)</label>
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
                  style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '20px', fontWeight: 'bold', padding: '12px' }}
                />
                <div className="field-hint" style={{ fontSize: 12, marginTop: 4 }}>Mã có hiệu lực trong 10 phút kể từ lúc gửi.</div>
              </div>

              <button
                className="btn btn-primary btn-block"
                disabled={busy || code.length !== 6}
                type="submit"
                style={{ marginTop: 12, padding: '11px 16px', borderRadius: 8 }}
              >
                {busy ? 'Đang xác thực...' : 'Xác thực tài khoản'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-block"
                disabled={busy}
                onClick={resend}
                style={{ marginTop: 8, padding: '10px 16px', borderRadius: 8 }}
              >
                {busy ? 'Đang gửi...' : 'Gửi lại mã xác thực'}
              </button>

              <div className="auth-switch" style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5 }}>
                Đã có tài khoản?{' '}
                <Link to="/login" style={{ color: 'var(--neo-cobalt-600)', fontWeight: 700 }}>
                  Đăng nhập
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="fullName" style={{ fontWeight: 600, fontSize: 13 }}>Họ và tên</label>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={set('fullName')}
                  placeholder="Nguyễn Văn A"
                  required
                  autoFocus
                  style={{ borderRadius: 8, padding: '10px 14px' }}
                />
              </div>

              <div className="field">
                <label htmlFor="email" style={{ fontWeight: 600, fontSize: 13 }}>Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="nguyenvana@example.com"
                  required
                  autoComplete="email"
                  style={{ borderRadius: 8, padding: '10px 14px' }}
                />
              </div>

              <div className="field">
                <label htmlFor="password" style={{ fontWeight: 600, fontSize: 13 }}>Mật khẩu</label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                />
                <div className="field-hint" style={{ fontSize: 12, marginTop: 4 }}>Gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</div>
              </div>

              <div className="field">
                <label htmlFor="confirmPassword" style={{ fontWeight: 600, fontSize: 13 }}>Xác nhận mật khẩu</label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                disabled={busy}
                type="submit"
                style={{ marginTop: 12, padding: '11px 16px', borderRadius: 8, fontSize: 14 }}
              >
                {busy ? 'Đang gửi thông tin...' : 'Tạo thẻ bạn đọc'}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-block"
                disabled={busy || !form.email}
                onClick={() => {
                  setError('')
                  setStage('verify')
                }}
                style={{ marginTop: 8, fontSize: 13 }}
              >
                Đã đăng ký nhưng chưa nhập mã?
              </button>

              <div className="auth-switch" style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5 }}>
                Đã có thẻ thành viên?{' '}
                <Link to="/login" style={{ color: 'var(--neo-cobalt-600)', fontWeight: 700 }}>
                  Đăng nhập ngay
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
