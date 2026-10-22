import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { configApi } from '../api/config'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import ConfirmModal from '../components/ConfirmModal'
import { SettingsIcon, KeyIcon, MailIcon, ShieldIcon, AlertCircleIcon } from '../components/Icons'
import PasswordInput from '../components/PasswordInput'

export default function SettingsPage({ adminMode = false }) {
  const { can } = useAuth()
  const showConfig = adminMode && can('CONFIG_VIEW')

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{showConfig ? 'Cài đặt quản trị' : 'Tài khoản của tôi'}</h1>
        </div>
      </div>

      <div className="settings-grid">
        {showConfig && <MaintenanceSection />}
        <PasswordSection />
        <EmailSection />
      </div>
    </>
  )
}

function SectionCard({ icon, title, hint, children }) {
  return (
    <div className="settings-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-brand-surface)',
            color: 'var(--color-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
      </div>
      {hint && <p style={{ marginTop: 6, marginBottom: 16 }}>{hint}</p>}
      {children}
    </div>
  )
}

function MaintenanceSection() {
  const { can } = useAuth()
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    configApi.get()
      .then(setConfig)
      .catch((e) => setError(readError(e)))
  }, [])

  const handleToggleClick = () => {
    if (!config?.maintenanceMode) {
      setConfirmOpen(true)
    } else {
      executeToggle()
    }
  }

  const executeToggle = async () => {
    setConfirmOpen(false)
    setBusy(true)
    setError('')
    try {
      setConfig(await configApi.setMaintenance(!config.maintenanceMode))
    } catch (e) {
      setError(readError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard
      icon={<ShieldIcon width={17} height={17} />}
      title="Chế độ bảo trì hệ thống"
    >
      {error && <Alert type="error">{error}</Alert>}

      {config && (
        <div
          className={`circulation-slip ${config.maintenanceMode ? 'slip-danger' : 'slip-primary'}`}
          style={{ marginBottom: 0 }}
        >
          <div className="slip-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className={`badge ${config.maintenanceMode ? 'badge-danger' : 'badge-ok'}`}>
                <span className="badge-dot" />
                {config.maintenanceMode ? 'Hệ thống đang bảo trì' : 'Hệ thống hoạt động bình thường'}
              </span>
            </div>
            <div className="slip-meta">
              {config.updatedAt
                ? `Cập nhật lần gần nhất bởi: ${config.updatedBy}`
                : 'Chưa có lịch sử thay đổi cấu hình'}
            </div>
          </div>
          <button
            className={`btn ${config.maintenanceMode ? 'btn-primary' : 'btn-danger'}`}
            onClick={handleToggleClick}
            disabled={busy || !can('CONFIG_UPDATE')}
            type="button"
          >
            {busy
              ? 'Đang xử lý...'
              : config.maintenanceMode
              ? 'Tắt chế độ bảo trì'
              : 'Bật chế độ bảo trì'}
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Xác nhận bật chế độ bảo trì"
        message="Bật chế độ bảo trì sẽ tạm thời ngắt quyền truy cập của tất cả độc giả và thành viên khác. Bạn có chắc chắn muốn tiến hành bảo trì hệ thống ngay bây giờ?"
        confirmLabel="Bật bảo trì hệ thống"
        isDanger={true}
        busy={busy}
        onConfirm={executeToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </SectionCard>
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
    <SectionCard
      icon={<KeyIcon width={17} height={17} />}
      title="Thay đổi mật khẩu đăng nhập"
    >
      <form onSubmit={submit}>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        <div className="field">
          <label htmlFor="old-pass">Mật khẩu hiện tại</label>
          <PasswordInput
            id="old-pass"
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            placeholder="Nhập mật khẩu đang dùng"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="field">
          <label htmlFor="new-pass">Mật khẩu mới</label>
          <PasswordInput
            id="new-pass"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="Tối thiểu 8 ký tự"
            required
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label htmlFor="confirm-new-pass">Xác nhận mật khẩu mới</label>
          <PasswordInput
            id="confirm-new-pass"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Nhập lại mật khẩu mới"
            required
            autoComplete="new-password"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </button>
      </form>
    </SectionCard>
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
    <SectionCard
      icon={<MailIcon width={17} height={17} />}
      title="Đổi địa chỉ email tài khoản"
    >
      <form onSubmit={submit}>
        {msg && <Alert type={msg.type}>{msg.text}</Alert>}

        <div className="field">
          <label htmlFor="ne-input">Địa chỉ email mới</label>
          <input
            id="ne-input"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="newemail@example.com"
            required
            readOnly={codeSent}
            autoComplete="email"
          />
        </div>

        {codeSent && (
          <div className="field">
            <label htmlFor="email-code">Mã xác thực 6 chữ số</label>
            <input
              id="email-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
              style={{
                maxWidth: 200,
                textAlign: 'center',
                letterSpacing: '0.2em',
                fontSize: 16,
                fontWeight: 'bold',
              }}
            />
          </div>
        )}

        <div className="button-row">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={busy || (codeSent && code.length !== 6)}
          >
            {busy
              ? 'Đang xử lý...'
              : codeSent
              ? 'Xác nhận đổi email'
              : 'Gửi mã xác nhận'}
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
    </SectionCard>
  )
}
