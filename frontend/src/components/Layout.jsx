import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { configApi } from '../api/config'
import {
  LibraryLogo,
  DashboardIcon,
  BookIcon,
  CirculationIcon,
  UsersIcon,
  ShieldIcon,
  SettingsIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  UserIcon,
} from './Icons'

export default function Layout({ mode = 'customer' }) {
  const { user, isAdmin, can, logout } = useAuth()
  const adminArea = mode === 'admin'
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [maintenance, setMaintenance] = useState(false)

  // Close drawers/sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
    setSidebarOpen(false)
  }, [location.pathname])

  // Check maintenance status if permitted or available
  useEffect(() => {
    if (user && adminArea && can('CONFIG_VIEW')) {
      configApi.get()
        .then((res) => {
          if (res?.maintenanceMode) setMaintenance(true)
        })
        .catch(() => {})
    }
  }, [user, adminArea, can])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'

  // =========================================================================
  // 1. CUSTOMER PORTAL LAYOUT: TOP NAVBAR (KEPT INTACT AS REQUESTED)
  // =========================================================================
  if (!adminArea) {
    const homePath = '/'
    const booksPath = '/catalog'
    const circulationPath = '/my-loans'
    const settingsPath = '/account'

    return (
      <div className="app-shell app-shell-customer">
        {maintenance && (
          <aside className="maintenance-banner" role="alert" aria-live="polite">
            <AlertCircleIcon width={16} height={16} />
            <span>Hệ thống đang ở chế độ bảo trì. Một số chức năng có thể bị giới hạn.</span>
          </aside>
        )}

        <header className="navbar">
          <div className="nav-left">
            <Link className="brand" to={homePath} aria-label="Trang chủ Thư Viện">
              <LibraryLogo width={200} height={50} />
            </Link>

            <nav className="navlinks" aria-label="Điều hướng chính">
              {user && (
                <NavLink to={homePath} end className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                  <DashboardIcon width={16} height={16} />
                  <span>Trang chủ</span>
                </NavLink>
              )}
              {user && can('BOOK_VIEW') && (
                <NavLink to={booksPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                  <BookIcon width={16} height={16} />
                  <span>Tra cứu sách</span>
                </NavLink>
              )}
              {user && can('BORROW_USE') && (
                <NavLink to={circulationPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                  <CirculationIcon width={16} height={16} />
                  <span>Mượn và trả</span>
                </NavLink>
              )}
              {user && (
                <NavLink to={settingsPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                  <SettingsIcon width={16} height={16} />
                  <span>Cài đặt</span>
                </NavLink>
              )}
            </nav>
          </div>

          <div className="navuser">
            {user ? (
              <>
                <Link to="/profile" className="user-badge user-badge-link" title="Xem và chỉnh sửa thông tin cá nhân">
                  <span className="user-avatar">{userInitial}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                    <span className="nav-email" style={{ fontWeight: 600 }}>{user?.fullName || user.email}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-brand)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <UserIcon width={11} height={11} /> Thông tin cá nhân
                    </span>
                  </div>
                  <span className={`role-pill ${isAdmin ? 'admin' : ''}`}>
                    {isAdmin ? 'Thủ thư' : 'Thành viên'}
                  </span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="btn btn-sm btn-secondary" title="Chuyển sang bảng điều khiển quản trị">
                    <ShieldIcon width={14} height={14} />
                    <span>Quản trị</span>
                  </Link>
                )}
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={handleLogout}
                  aria-label="Đăng xuất khỏi hệ thống"
                  type="button"
                >
                  <LogoutIcon width={15} height={15} />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="button-row">
                <Link className="btn btn-sm btn-ghost" to="/login">Đăng nhập</Link>
                <Link className="btn btn-sm btn-primary" to="/register">Đăng ký</Link>
              </div>
            )}

            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
              type="button"
            >
              {mobileOpen ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
            </button>
          </div>
        </header>

        {mobileOpen && (
          <nav className="mobile-drawer" aria-label="Điều hướng trên thiết bị di động">
            {user && (
              <NavLink to={homePath} end className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <DashboardIcon width={16} height={16} />
                <span>Trang chủ</span>
              </NavLink>
            )}
            {user && can('BOOK_VIEW') && (
              <NavLink to={booksPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <BookIcon width={16} height={16} />
                <span>Tra cứu sách</span>
              </NavLink>
            )}
            {user && can('BORROW_USE') && (
              <NavLink to={circulationPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <CirculationIcon width={16} height={16} />
                <span>Mượn và trả</span>
              </NavLink>
            )}
            {user && (
              <NavLink to="/profile" className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <UserIcon width={16} height={16} />
                <span>Thông tin cá nhân</span>
              </NavLink>
            )}
            {user && (
              <NavLink to={settingsPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <SettingsIcon width={16} height={16} />
                <span>Cài đặt</span>
              </NavLink>
            )}
            {user && isAdmin && (
              <NavLink to="/admin" className="navlink" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                <ShieldIcon width={16} height={16} />
                <span>Cổng Quản trị thủ thư</span>
              </NavLink>
            )}
            {user && (
              <button
                type="button"
                className="navlink"
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--color-danger)',
                  borderTop: '1px solid var(--color-border-subtle)',
                  marginTop: 4,
                  paddingTop: 10,
                }}
              >
                <LogoutIcon width={16} height={16} />
                <span>Đăng xuất</span>
              </button>
            )}
          </nav>
        )}

        <main className="main-content-wrap">
          <div className="content">
            <Outlet />
          </div>
        </main>
      </div>
    )
  }

  // =========================================================================
  // 2. ADMIN PORTAL LAYOUT: MODERN SIDEBAR + TOPBAR BREADCRUMB
  // =========================================================================
  const getAdminPageTitle = () => {
    const path = location.pathname
    if (path === '/admin') return 'Tổng quan'
    if (path.startsWith('/admin/books')) return 'Quản lý sách'
    if (path.startsWith('/admin/circulation')) return 'Lưu thông mượn trả'
    if (path.startsWith('/admin/members')) return 'Thành viên'
    if (path.startsWith('/admin/permissions')) return 'Phân quyền'
    if (path.startsWith('/admin/settings')) return 'Cài đặt hệ thống'
    if (path.startsWith('/admin/profile')) return 'Thông tin cá nhân'
    return 'Quản trị'
  }

  const currentTitle = getAdminPageTitle()

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop for Sidebar */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-head">
          <Link className="admin-brand" to="/admin" aria-label="Trang chủ Quản trị">
            <LibraryLogo width={150} height={38} />
          </Link>
          <span className="admin-badge">QUẢN TRỊ</span>
        </div>

        <nav className="admin-nav" aria-label="Menu quản trị">
          <div className="admin-nav-section-title">CHỨC NĂNG CHÍNH</div>

          {user && (
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `admin-navlink${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-navlink-icon"><DashboardIcon width={18} height={18} /></span>
              <span className="admin-navlink-text">Tổng quan</span>
            </NavLink>
          )}

          {user && can('BOOK_VIEW') && (
            <NavLink
              to="/admin/books"
              className={({ isActive }) => `admin-navlink${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-navlink-icon"><BookIcon width={18} height={18} /></span>
              <span className="admin-navlink-text">Quản lý sách</span>
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/admin/circulation"
              className={({ isActive }) => `admin-navlink${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-navlink-icon"><CirculationIcon width={18} height={18} /></span>
              <span className="admin-navlink-text">Lưu thông mượn trả</span>
            </NavLink>
          )}

          <div className="admin-nav-section-title" style={{ marginTop: 14 }}>HỆ THỐNG</div>

          {user && can('MEMBER_VIEW') && (
            <NavLink
              to="/admin/members"
              className={({ isActive }) => `admin-navlink${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-navlink-icon"><UsersIcon width={18} height={18} /></span>
              <span className="admin-navlink-text">Thành viên</span>
            </NavLink>
          )}

          {user && can('PERMISSION_MANAGE') && (
            <NavLink
              to="/admin/permissions"
              className={({ isActive }) => `admin-navlink${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-navlink-icon"><ShieldIcon width={18} height={18} /></span>
              <span className="admin-navlink-text">Phân quyền</span>
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-navlink${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-navlink-icon"><SettingsIcon width={18} height={18} /></span>
              <span className="admin-navlink-text">Cài đặt</span>
            </NavLink>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-foot">
          <div className="admin-user-card">
            <Link
              to="/admin/profile"
              className="admin-user-profile-entry"
              title="Xem và chỉnh sửa thông tin cá nhân"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="user-avatar">{userInitial}</span>
              <div className="admin-user-info">
                <span className="admin-user-name" title={user?.fullName || user?.email}>
                  {user?.fullName || user?.email}
                </span>
                <span className="admin-user-action">
                  <UserIcon width={12} height={12} />
                  <span>Thông tin cá nhân</span>
                </span>
              </div>
            </Link>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất khỏi hệ thống"
            >
              <LogoutIcon width={16} height={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Body with Sticky Topbar */}
      <div className="admin-body">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu quản trị'}
            >
              {sidebarOpen ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
            </button>
            <div className="admin-breadcrumb">
              <span className="admin-breadcrumb-root">Quản trị</span>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-current">{currentTitle}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
          </div>
        </header>

        <main className="admin-main">
          {maintenance && (
            <aside className="maintenance-banner" role="alert" aria-live="polite">
              <AlertCircleIcon width={16} height={16} />
              <span>Hệ thống đang ở chế độ bảo trì. Một số chức năng có thể bị giới hạn.</span>
            </aside>
          )}

          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

