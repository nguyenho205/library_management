import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { booksApi } from '../api/books'
import { membersApi } from '../api/members'
import { configApi } from '../api/config'
import {
  BookIcon,
  UsersIcon,
  SettingsIcon,
  ShieldIcon,
  ChevronRightIcon,
} from '../components/Icons'

export default function DashboardPage() {
  const { user, isAdmin, can } = useAuth()
  const [stats, setStats] = useState({ books: null, members: null, maintenance: null })

  useEffect(() => {
    if (can('BOOK_VIEW')) {
      booksApi.search({ page: 0, size: 1 })
        .then((d) => setStats((s) => ({ ...s, books: d.totalElements })))
        .catch(() => {})
    }
    if (can('MEMBER_VIEW')) {
      membersApi.search({ page: 0, size: 1 })
        .then((d) => setStats((s) => ({ ...s, members: d.totalElements })))
        .catch(() => {})
    }
    if (can('CONFIG_VIEW')) {
      configApi.get()
        .then((c) => setStats((s) => ({ ...s, maintenance: c.maintenanceMode })))
        .catch(() => {})
    }
  }, [can])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tổng quan quản trị</h1>
          <p>
            Xin chào, <strong>{user?.email}</strong> · Vai trò:{' '}
            <span className={`role-pill ${isAdmin ? 'admin' : ''}`}>
              {isAdmin ? 'Thủ thư' : 'Thành viên'}
            </span>
          </p>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="stat-grid">
        {can('BOOK_VIEW') && (
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Sách trong danh mục</span>
              <span className="stat-icon"><BookIcon width={18} height={18} /></span>
            </div>
            <div className="stat-value">{stats.books !== null ? stats.books : '…'}</div>
            <div className="stat-subtext">Đầu sách được quản lý trong hệ thống</div>
          </div>
        )}

        {can('MEMBER_VIEW') && (
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Thành viên thư viện</span>
              <span className="stat-icon"><UsersIcon width={18} height={18} /></span>
            </div>
            <div className="stat-value">{stats.members !== null ? stats.members : '…'}</div>
            <div className="stat-subtext">Độc giả đã đăng ký tài khoản</div>
          </div>
        )}

        {can('CONFIG_VIEW') && (
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Trạng thái hệ thống</span>
              <span className="stat-icon"><SettingsIcon width={18} height={18} /></span>
            </div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {stats.maintenance === null ? (
                '…'
              ) : (
                <span className={`badge ${stats.maintenance ? 'badge-danger' : 'badge-ok'}`}>
                  {stats.maintenance ? 'Đang bảo trì' : 'Đang hoạt động'}
                </span>
              )}
            </div>
            <div className="stat-subtext">
              {stats.maintenance ? 'Chỉ mở cho quản trị viên' : 'Sẵn sàng phục vụ bạn đọc'}
            </div>
          </div>
        )}

      </div>

      {/* Meaningful Quick Shortcuts */}
      <h2 style={{ marginTop: 24 }}>Lối tắt chức năng</h2>
      <div className="shortcuts-grid">
        {can('BOOK_VIEW') && (
          <Link to="/admin/books" className="shortcut-card">
            <div className="shortcut-icon-box">
              <BookIcon width={20} height={20} />
            </div>
            <div>
              <div className="shortcut-title">Danh mục sách</div>
              <div className="shortcut-desc">Tra cứu, tìm kiếm tác phẩm theo tên, ISBN hoặc tác giả.</div>
            </div>
          </Link>
        )}

        {can('MEMBER_VIEW') && (
          <Link to="/admin/members" className="shortcut-card">
            <div className="shortcut-icon-box">
              <UsersIcon width={20} height={20} />
            </div>
            <div>
              <div className="shortcut-title">Quản lý thành viên</div>
              <div className="shortcut-desc">Danh sách bạn đọc, trạng thái xác thực và thông tin liên hệ.</div>
            </div>
          </Link>
        )}

        {can('PERMISSION_MANAGE') && (
          <Link to="/admin/permissions" className="shortcut-card">
            <div className="shortcut-icon-box">
              <ShieldIcon width={20} height={20} />
            </div>
            <div>
              <div className="shortcut-title">Phân quyền tài khoản</div>
              <div className="shortcut-desc">Cấu hình nhóm quyền và gán quyền chức năng cho tài khoản.</div>
            </div>
          </Link>
        )}

        <Link to="/admin/settings" className="shortcut-card">
          <div className="shortcut-icon-box">
            <SettingsIcon width={20} height={20} />
          </div>
          <div>
            <div className="shortcut-title">Cài đặt tài khoản</div>
            <div className="shortcut-desc">Đổi mật khẩu, thay đổi địa chỉ email đăng nhập và hệ thống.</div>
          </div>
        </Link>
      </div>
    </>
  )
}
