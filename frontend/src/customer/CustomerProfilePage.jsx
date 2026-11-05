import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { membersApi } from '../api/members'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import Skeleton from '../components/Skeleton'
import {
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  EditIcon,
  ChevronRightIcon,
  ClockIcon,
} from '../components/Icons'

export default function CustomerProfilePage() {
  const { user, isAdmin, updateUser } = useAuth()
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

      if (updated.fullName) {
        updateUser({ fullName: updated.fullName })
      }

      setSuccess('Cập nhật thông tin hồ sơ bạn đọc thành công.')
      setIsEditing(false)
    } catch (err) {
      setError(readError(err) || 'Cập nhật thông tin thất bại.')
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

  if (loading) {
    return (
      <div style={{ maxWidth: 1040, margin: '40px auto', padding: '0 20px' }}>
        <Skeleton rows={6} />
      </div>
    )
  }

  return (
    <div className="customer-profile-page">
      {/* Header */}
      <div className="customer-profile-head">
        <span className="profile-head-eyebrow">
          <UserIcon width={13} height={13} /> HỒ SƠ ĐỊNH DANH BẠN ĐỌC
        </span>
        <h1 className="profile-head-title">Thẻ Bạn Đọc & Hồ Sơ Cá Nhân</h1>
        <p className="profile-head-desc">
          Quản lý thông tin định danh thư viện, quyền lợi thành viên và thẻ mượn sách số hóa.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="profile-two-column-layout">
        {/* Left Column: Digital Member Pass */}
        <div className="profile-left-col">
          {/* Digital Member Card */}
          <div className="digital-member-pass-card">
            <div className="pass-card-top">
              <span className="pass-library-title">THẺ BẠN ĐỌC SỐ</span>
              <span className={`pass-status-pill ${profile?.enabled ? 'active' : 'locked'}`}>
                {profile?.enabled ? 'HOẠT ĐỘNG' : 'TẠM KHÓA'}
              </span>
            </div>

            <div className="pass-card-chip" />

            <div className="pass-card-number">
              #{profile?.id ? String(profile.id).padStart(6, '0') : '000001'}
            </div>

            <div className="pass-card-bottom">
              <div>
                <span className="pass-label">Họ và tên bạn đọc</span>
                <div className="pass-user-name">{profile?.fullName || user?.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="pass-label">Hạn mức mượn</span>
                <div className="pass-quota-text">02 cuốn / 10 ngày</div>
              </div>
            </div>
          </div>

          {/* Account Security Quick Card */}
          <div className="profile-security-card">
            <div className="security-card-head">
              <div className="security-icon-wrap">
                <KeyIcon width={16} height={16} />
              </div>
              <h3 className="security-card-title">Bảo Mật Tài Khoản</h3>
            </div>
            <p className="security-card-desc">
              Thay đổi mật khẩu định kỳ và xác thực email để nhận thông báo nhắc hẹn hoàn trả sách tự động.
            </p>
            <Link to="/account" className="btn btn-secondary btn-block">
              <span>Cài đặt bảo mật & Mật khẩu</span>
              <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>
        </div>

        {/* Right Column: Personal Information Form */}
        <div className="profile-right-col">
          <div className="profile-form-container">
            <div className="form-container-header">
              <div>
                <h2 className="form-header-title">Chi Tiết Thông Tin Cá Nhân</h2>
                <span className="form-header-state">
                  {isEditing ? 'Đang mở chế độ chỉnh sửa' : 'Chế độ xem thông tin định danh'}
                </span>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsEditing(true)}
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
                  Hủy bỏ
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="pf-fullname">
                  Họ và tên đầy đủ <span style={{ color: 'var(--neo-coral-600)' }}>*</span>
                </label>
                <input
                  id="pf-fullname"
                  value={form.fullName}
                  onChange={setField('fullName')}
                  placeholder="Nhập họ và tên bạn đọc..."
                  disabled={!isEditing || saving}
                  required
                />
                <div className="field-hint">Tên hiển thị công khai trên Thẻ bạn đọc số và phiếu mượn tài liệu.</div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="pf-dob">Ngày sinh</label>
                  <input
                    id="pf-dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={setField('dateOfBirth')}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={!isEditing || saving}
                  />
                </div>

                <div className="field">
                  <label htmlFor="pf-phone">Số điện thoại liên hệ</label>
                  <input
                    id="pf-phone"
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="Ví dụ: 0912345678"
                    disabled={!isEditing || saving}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="pf-address">Địa chỉ thường trú / Nhận sách</label>
                <textarea
                  id="pf-address"
                  rows="3"
                  value={form.address}
                  onChange={setField('address')}
                  placeholder="Nhập địa chỉ liên hệ của bạn..."
                  disabled={!isEditing || saving}
                />
              </div>

              <div className="field" style={{ marginBottom: 24 }}>
                <label htmlFor="pf-email">Địa chỉ Email tài khoản</label>
                <input
                  id="pf-email"
                  value={profile?.email || user?.email || ''}
                  readOnly
                  disabled
                  style={{ backgroundColor: 'var(--neo-paper-100)', cursor: 'not-allowed' }}
                />
                <div className="field-hint">
                  Email dùng để đăng nhập và nhận thông báo nhắc hạn. Quản lý tại mục{' '}
                  <Link to="/account" style={{ color: 'var(--neo-cobalt-600)', fontWeight: 600 }}>
                    Cài đặt tài khoản
                  </Link>.
                </div>
              </div>

              {isEditing && (
                <div className="form-submit-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

