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
} from './Icons'

export default function Layout({ mode = 'customer' }) {
  const { user, isAdmin, can, logout } = useAuth()
  const adminArea = mode === 'admin'
  const homePath = adminArea ? '/admin' : '/'
  const booksPath = adminArea ? '/admin/books' : '/catalog'
  const circulationPath = '/my-loans'
  const membersPath = '/admin/members'
  const permissionsPath = '/admin/permissions'
  const settingsPath = adminArea ? '/admin/settings' : '/account'
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [maintenance, setMaintenance] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
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

  return (
    <div className="app-shell">
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
                <span>{adminArea ? 'Tổng quan quản trị' : 'Trang chủ'}</span>
              </NavLink>
            )}
            {user && can('BOOK_VIEW') && (
              <NavLink to={booksPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <BookIcon width={16} height={16} />
                <span>{adminArea ? 'Quản lý sách' : 'Tra cứu sách'}</span>
              </NavLink>
            )}
            {user && !adminArea && can('BORROW_USE') && (
              <NavLink to={circulationPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <CirculationIcon width={16} height={16} />
                <span>Mượn và trả</span>
              </NavLink>
            )}
            {user && adminArea && can('MEMBER_VIEW') && (
              <NavLink to={membersPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <UsersIcon width={16} height={16} />
                <span>Thành viên</span>
              </NavLink>
            )}
            {user && adminArea && can('PERMISSION_MANAGE') && (
              <NavLink to={permissionsPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                <ShieldIcon width={16} height={16} />
                <span>Phân quyền</span>
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
              <div className="user-badge" title={user.email}>
                <span className="user-avatar">{userInitial}</span>
                <span className="nav-email">{user.email}</span>
                <span className={`role-pill ${isAdmin ? 'admin' : ''}`}>
                  {isAdmin ? 'Thủ thư' : 'Thành viên'}
                </span>
              </div>
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
              <span>{adminArea ? 'Tổng quan quản trị' : 'Trang chủ'}</span>
            </NavLink>
          )}
          {user && can('BOOK_VIEW') && (
            <NavLink to={booksPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
              <BookIcon width={16} height={16} />
              <span>{adminArea ? 'Quản lý sách' : 'Tra cứu sách'}</span>
            </NavLink>
          )}
          {user && !adminArea && can('BORROW_USE') && (
            <NavLink to={circulationPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
              <CirculationIcon width={16} height={16} />
              <span>Mượn và trả</span>
            </NavLink>
          )}
          {user && adminArea && can('MEMBER_VIEW') && (
            <NavLink to={membersPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
              <UsersIcon width={16} height={16} />
              <span>Thành viên</span>
            </NavLink>
          )}
          {user && adminArea && can('PERMISSION_MANAGE') && (
            <NavLink to={permissionsPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
              <ShieldIcon width={16} height={16} />
              <span>Phân quyền</span>
            </NavLink>
          )}
          {user && (
            <NavLink to={settingsPath} className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
              <SettingsIcon width={16} height={16} />
              <span>Cài đặt</span>
            </NavLink>
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
