import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import PasswordInput from '../components/PasswordInput'
import { SettingsIcon, KeyIcon, MailIcon, UserIcon, ChevronRightIcon } from '../components/Icons'

export default function CustomerSettingsPage() {
  return (
    <div className="customer-settings-page">
      {/* Header */}
      <div className="customer-settings-head">
        <span className="settings-head-eyebrow">
          <SettingsIcon width={13} height={13} /> THIẾT LẬP TÀI KHOẢN & BẢO MẬT
        </span>
        <h1 className="settings-head-title">Trung Tâm Cài Đặt Tài Khoản</h1>
        <p className="settings-head-sub">
          Quản lý mật khẩu xác thực và cập nhật địa chỉ email nhận thông báo hạn trả sách tự động.
        </p>
      </div>

      <div className="settings-grid-layout">
        <PasswordSection />
        <EmailSection />
      </div>
    </div>
  )
}

function SettingsCard({ icon, title, subtitle, children }) {
  return (
    <div className="customer-settings-card">
      <div className="settings-card-header">
        <div className="settings-icon-circle">{icon}</div>
        <div>
          <h2 className="settings-card-title">{title}</h2>
          {subtitle && <p className="settings-card-sub">{subtitle}</p>}
        </div>
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  )
}

function PasswordSection() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' })
      return
    }
    setBusy(true)
    try {
      const res = await authApi.changePassword(form.oldPassword, form.newPassword)
      setMsg({ type: 'success', text: res.message || 'Đổi mật khẩu thành công.' })
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMsg({ type: 'error', text: readError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingsCard
      icon={<KeyIcon width={18} height={18} />}
      title="Thay Đổi Mật Khẩu"
      subtitle="Bảo vệ tài khoản bạn đọc bằng mật khẩu có độ phức tạp cao."
    >
      <form onSubmit={submit}>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        <div className="field">
          <label htmlFor="cp-old">Mật khẩu hiện tại</label>
          <PasswordInput
            id="cp-old"
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            placeholder="Nhập mật khẩu đang sử dụng"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="field">
          <label htmlFor="cp-new">Mật khẩu mới</label>
          <PasswordInput
            id="cp-new"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Tối thiểu 8 ký tự"
            required
            autoComplete="new-password"
          />
          <div className="field-hint">Gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!).</div>
        </div>

        <div className="field">
          <label htmlFor="cp-confirm">Xác nhận mật khẩu mới</label>
          <PasswordInput
            id="cp-confirm"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Nhập lại mật khẩu mới"
            required
            autoComplete="new-password"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 8 }}>
          {busy ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
        </button>
      </form>
    </SettingsCard>
  )
}

function EmailSection() {
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      if (!codeSent) {
        const res = await authApi.requestChangeEmail(newEmail)
        setMsg({
          type: 'success',
          text: (res.message || 'Đã gửi mã xác nhận.') + ' Mã có hiệu lực trong 10 phút.',
        })
        setCodeSent(true)
      } else {
        const res = await authApi.confirmChangeEmail(newEmail, code)
        setMsg({
          type: 'success',
          text: (res.message || 'Đổi email thành công.') + ' Vui lòng đăng nhập lại bằng email mới.',
        })
        setCodeSent(false)
        setCode('')
        setNewEmail('')
      }
    } catch (err) {
      setMsg({ type: 'error', text: readError(err) })
    } finally {
      setBusy(false)
    }
  }

  const resendCode = async () => {
    setMsg(null)
    setBusy(true)
    try {
      const res = await authApi.requestChangeEmail(newEmail)
      setMsg({
        type: 'success',
        text: (res.message || 'Đã gửi lại mã xác nhận.') + ' Mã có hiệu lực trong 10 phút.',
      })
      setCode('')
    } catch (err) {
      setMsg({ type: 'error', text: readError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingsCard
      icon={<MailIcon width={18} height={18} />}
      title="Cập Nhật Địa Chỉ Email"
      subtitle="Email dùng để nhận thông báo hạn trả sách và khôi phục tài khoản."
    >
      <form onSubmit={submit}>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        <div className="field">
          <label htmlFor="ne-email-input">Địa chỉ email mới</label>
          <input
            id="ne-email-input"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="emailmoi@example.com"
            required
            readOnly={codeSent}
            autoComplete="email"
          />
        </div>

        {codeSent && (
          <div className="field">
            <label htmlFor="ne-code-input">Mã xác thực (6 chữ số)</label>
            <input
              id="ne-code-input"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
              autoFocus
              style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '18px', fontWeight: 'bold' }}
            />
            <div className="field-hint">Mã xác thực đã được gửi tới {newEmail}. Có hiệu lực trong 10 phút.</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Đang xử lý...' : codeSent ? 'Xác nhận đổi email' : 'Gửi mã xác thực'}
          </button>

          {codeSent && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resendCode}
              disabled={busy}
            >
              Gửi lại mã
            </button>
          )}
        </div>
      </form>
    </SettingsCard>
  )
}

