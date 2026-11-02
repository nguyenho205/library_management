import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { membersApi } from '../api/members'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import Skeleton from '../components/Skeleton'
import {
  UserIcon,
  MailIcon,
  CalendarIcon,
  ShieldIcon,
  CheckCircleIcon,
  EditIcon,
  KeyIcon,
  ChevronRightIcon,
  ClockIcon,
} from '../components/Icons'

export default function ProfilePage({ adminMode = false }) {
  const { user, isAdmin, updateUser } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    address: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Tải thông tin hồ sơ người dùng hiện tại
  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')

    membersApi
      .getProfile()
      .then((data) => {
        if (!mounted) return
        setProfile(data)
        setForm({
          fullName: data.fullName || '',
          dateOfBirth: data.dateOfBirth || '',
          phone: data.phone || '',
          address: data.address || '',
        })
        if (data.fullName && user && user.fullName !== data.fullName) {
          updateUser({ fullName: data.fullName })
        }
      })
      .catch((err) => {
        if (!mounted) return
        setError(readError(err) || 'Không thể tải thông tin hồ sơ cá nhân.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.fullName.trim()) {
      setError('Họ và tên không được để trống.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth : null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      }

      const updated = await membersApi.updateProfile(payload)
      setProfile(updated)
      setForm({
        fullName: updated.fullName || '',
        dateOfBirth: updated.dateOfBirth || '',
        phone: updated.phone || '',
        address: updated.address || '',
      })
      updateUser({ fullName: updated.fullName })
      setSuccess('Cập nhật thông tin cá nhân thành công!')
      setIsEditing(false)
    } catch (err) {
      setError(readError(err) || 'Có lỗi xảy ra khi lưu thông tin.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '',
        dateOfBirth: profile.dateOfBirth || '',
        phone: profile.phone || '',
        address: profile.address || '',
      })
    }
    setError('')
    setSuccess('')
    setIsEditing(false)
  }

  const userInitial = form.fullName
    ? form.fullName.trim().charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U'

  const settingsLink = adminMode ? '/admin/settings' : '/account'

  if (loading) {
    return (
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 0' }}>
        <Skeleton rows={6} />
      </div>
    )
  }

  if (!adminMode) {
    return (
      <div className="profile-page-container" style={{ maxWidth: 1040, margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, background: 'var(--neo-paper-100)', color: 'var(--neo-cobalt-600)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            <UserIcon width={13} height={13} /> Hồ Sơ Định Danh Bạn Đọc
          </div>
          <h1 style={{ fontFamily: 'var(--neo-font-editorial)', fontSize: 32, fontWeight: 700, margin: '0 0 6px', color: 'var(--neo-ink-950)' }}>
            Thông Tin Cá Nhân & Thẻ Thư Viện
          </h1>
          <p style={{ margin: 0, color: 'var(--neo-text-muted)', fontSize: 14 }}>
            Quản lý thông tin định danh, quyền hạn bạn đọc và bảo mật tài khoản thư viện.
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div className="profile-neo-layout">
          {/* Left Column: Digital Member Pass Card & Security Snapshot */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Digital Reader Pass */}
            <div className="profile-member-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>
                  ATHENAEUM READER PASS
                </span>
                <span className="badge badge-ok" style={{ fontSize: 10, padding: '2px 8px' }}>
                  {profile?.enabled ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
                </span>
              </div>

              <div className="profile-card-chip" />

              <div className="profile-card-id-text">
                #{profile?.id ? String(profile.id).padStart(6, '0') : '000001'}
              </div>

              <div className="profile-card-user-info">
                <div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Chủ thẻ bạn đọc
                  </div>
                  <div style={{ fontFamily: 'var(--neo-font-display)', fontWeight: 700, fontSize: 16, color: '#ffffff' }}>
                    {profile?.fullName || user?.email}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Hạn mức
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#fde68a' }}>
                    02 cuốn / 10 ngày
                  </div>
                </div>
              </div>
            </div>

            {/* Account Quick Security Card */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--neo-border-paper)',
                borderRadius: '20px',
                padding: '22px',
                boxShadow: 'var(--neo-shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '10px',
                    backgroundColor: 'var(--neo-paper-100)',
                    color: 'var(--neo-cobalt-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyIcon width={16} height={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--neo-ink-950)' }}>
                  Bảo mật & Mật khẩu
                </h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--neo-text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
                Thay đổi mật khẩu đăng nhập định kỳ và xác thực email để nhận thông báo hạn trả sách.
              </p>
              <Link
                to="/account"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'space-between', fontSize: 13 }}
              >
                <span>Đến Cài đặt tài khoản</span>
                <ChevronRightIcon width={14} height={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: Personal Information Form */}
          <div className="profile-form-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                borderBottom: '1px solid var(--neo-border-paper)',
                paddingBottom: 14,
              }}
            >
              <div>
                <h2 style={{ fontFamily: 'var(--neo-font-editorial)', fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: 'var(--neo-ink-950)' }}>
                  Chi tiết thông tin cá nhân
                </h2>
                <span style={{ fontSize: 12.5, color: 'var(--neo-text-light)' }}>
                  {isEditing ? 'Đang bật chế độ chỉnh sửa thông tin' : 'Chế độ xem thông tin định danh'}
                </span>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsEditing(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <EditIcon width={14} height={14} />
                  <span>Chỉnh sửa</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="p-fullname" style={{ fontWeight: 600, fontSize: 13 }}>
                  Họ và tên <span style={{ color: 'var(--neo-coral-600)' }}>*</span>
                </label>
                <input
                  id="p-fullname"
                  value={form.fullName}
                  onChange={setField('fullName')}
                  placeholder="Nhập họ và tên đầy đủ..."
                  disabled={!isEditing || saving}
                  required
                  style={{ borderRadius: 8, padding: '10px 14px' }}
                />
                <div className="field-hint" style={{ fontSize: 12, marginTop: 4 }}>
                  Tên hiển thị công khai trên thẻ bạn đọc, phiếu mượn và thanh điều hướng.
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="p-dob" style={{ fontWeight: 600, fontSize: 13 }}>Ngày sinh</label>
                  <input
                    id="p-dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={setField('dateOfBirth')}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={!isEditing || saving}
                    style={{ borderRadius: 8, padding: '10px 14px' }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="p-phone" style={{ fontWeight: 600, fontSize: 13 }}>Số điện thoại</label>
                  <input
                    id="p-phone"
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="Ví dụ: 0912345678"
                    disabled={!isEditing || saving}
                    style={{ borderRadius: 8, padding: '10px 14px' }}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="p-address" style={{ fontWeight: 600, fontSize: 13 }}>Địa chỉ liên hệ</label>
                <textarea
                  id="p-address"
                  rows="3"
                  value={form.address}
                  onChange={setField('address')}
                  placeholder="Nhập địa chỉ nhận tài liệu hoặc liên hệ..."
                  disabled={!isEditing || saving}
                  style={{ borderRadius: 8, padding: '10px 14px' }}
                />
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label htmlFor="p-email" style={{ fontWeight: 600, fontSize: 13 }}>Địa chỉ Email tài khoản</label>
                <input
                  id="p-email"
                  value={profile?.email || user?.email || ''}
                  readOnly
                  disabled
                  style={{ backgroundColor: 'var(--neo-paper-100)', cursor: 'not-allowed', borderRadius: 8, padding: '10px 14px' }}
                />
                <div className="field-hint" style={{ fontSize: 12, marginTop: 4 }}>
                  Email được dùng để đăng nhập và nhận thông báo nhắc hạn. Quản lý tại mục{' '}
                  <Link to="/account" style={{ color: 'var(--neo-cobalt-600)', fontWeight: 600 }}>
                    Cài đặt tài khoản
                  </Link>
                  .
                </div>
              </div>

              {isEditing && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--neo-border-paper)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Huỷ bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // ADMIN MODE: KEEP ADMIN PROFILE UNCHANGED
  // =========================================================================
  return (
    <div className="profile-page-container" style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserIcon width={24} height={24} style={{ color: 'var(--color-brand)' }} />
            <span>Hồ sơ người dùng</span>
          </h1>
          <p className="page-subhead" style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: 13.5 }}>
            Quản lý thông tin định danh cá nhân, chi tiết liên hệ và bảo mật tài khoản thư viện.
          </p>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Hero Profile Identity Card */}
      <div
        className="profile-hero-card"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'var(--color-brand)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)',
              border: '3px solid #ffffff',
            }}
          >
            {userInitial}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {profile?.fullName || 'Chưa cập nhật họ tên'}
              </h2>
              <span
                className={`badge ${isAdmin ? 'badge-info' : 'badge-neutral'}`}
                style={{ fontSize: 11.5, padding: '3px 9px' }}
              >
                {isAdmin ? 'Thủ thư hệ thống' : 'Bạn đọc thư viện'}
              </span>
              {profile?.enabled && (
                <span className="badge badge-ok" style={{ fontSize: 11, padding: '2px 8px' }}>
                  <CheckCircleIcon width={12} height={12} /> Đang hoạt động
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginTop: 6,
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MailIcon width={14} height={14} style={{ color: 'var(--color-text-tertiary)' }} />
                <span>{profile?.email || user?.email}</span>
              </span>
              {profile?.emailVerified && (
                <span style={{ color: 'var(--color-success)', fontSize: 12, fontWeight: 500 }}>
                  ✓ Đã xác thực email
                </span>
              )}
              {profile?.id && (
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                  Mã thẻ thành viên: <strong>#{profile.id}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!isEditing ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <EditIcon width={15} height={15} />
              <span>Chỉnh sửa thông tin</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </div>

      <div className="profile-grid-layout">
        {/* Main Details & Editing Form */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: 24,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              borderBottom: '1px solid var(--color-border-subtle)',
              paddingBottom: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Thông tin cá nhân</h3>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              {isEditing ? 'Đang ở chế độ chỉnh sửa' : 'Chế độ xem thông tin'}
            </span>
          </div>

          <form onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="p-fullname">
                Họ và tên <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="p-fullname"
                value={form.fullName}
                onChange={setField('fullName')}
                placeholder="Nhập họ và tên đầy đủ..."
                disabled={!isEditing || saving}
                required
              />
              <div className="field-hint">Tên hiển thị công khai trên phiếu mượn và thanh điều hướng.</div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="p-dob">Ngày sinh</label>
                <input
                  id="p-dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={setField('dateOfBirth')}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={!isEditing || saving}
                />
              </div>

              <div className="field">
                <label htmlFor="p-phone">Số điện thoại</label>
                <input
                  id="p-phone"
                  type="tel"
                  value={form.phone}
                  onChange={setField('phone')}
                  placeholder="Ví dụ: 0912345678"
                  disabled={!isEditing || saving}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="p-address">Địa chỉ thường trú / Liên hệ</label>
              <textarea
                id="p-address"
                rows="3"
                value={form.address}
                onChange={setField('address')}
                placeholder="Nhập địa chỉ nhận tài liệu hoặc liên hệ..."
                disabled={!isEditing || saving}
              />
            </div>

            {/* Read-only account credentials section */}
            <div className="field" style={{ marginBottom: 20 }}>
              <label htmlFor="p-email">Địa chỉ Email tài khoản</label>
              <input
                id="p-email"
                value={profile?.email || user?.email || ''}
                readOnly
                disabled
                style={{ backgroundColor: 'var(--color-bg-subtle)', cursor: 'not-allowed' }}
              />
              <div className="field-hint">
                Email dùng để đăng nhập và nhận thông báo nhắc hạn sách. Để thay đổi email, vui lòng sử dụng tính năng{' '}
                <Link to={settingsLink} style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                  Cài đặt tài khoản
                </Link>
                .
              </div>
            </div>

            {isEditing && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--color-border-subtle)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Sidebar Cards: Account Security & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Security & Password Card */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-xl)',
              padding: 20,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
                }}
              >
                <KeyIcon width={16} height={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Bảo mật tài khoản</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Bảo vệ thông tin tài khoản bằng mật khẩu mạnh và quản lý phiên đăng nhập duy nhất.
            </p>

            <Link
              to={settingsLink}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'space-between', fontSize: 13 }}
            >
              <span>Đổi mật khẩu & Cài đặt</span>
              <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>

          {/* Role & Permissions Card */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-xl)',
              padding: 20,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
                }}
              >
                <ShieldIcon width={16} height={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Quyền hạn truy cập</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Vai trò hệ thống:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{user?.role || 'USER'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Trạng thái thành viên:</span>
                <strong style={{ color: 'var(--color-success)' }}>Bình thường</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                <span>Đăng nhập 1 phiên:</span>
                <strong style={{ color: 'var(--color-brand)' }}>Kích hoạt</strong>
              </div>
            </div>

            {adminMode && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border-subtle)' }}>
                <Link
                  to="/admin/permissions"
                  style={{
                    color: 'var(--color-brand)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>Xem chi tiết nhóm quyền</span>
                  <ChevronRightIcon width={13} height={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
