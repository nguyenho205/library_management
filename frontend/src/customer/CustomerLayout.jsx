import { useState, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { borrowApi } from '../api/borrow'
import {
  DashboardIcon,
  BookIcon,
  CirculationIcon,
  UserIcon,
  SettingsIcon,
  ShieldIcon,
  LogoutIcon,
  SearchIcon,
  MenuIcon,
  CloseIcon,
  ClockIcon,
} from '../components/Icons'
import NotificationBell from '../components/NotificationBell'

export default function CustomerLayout() {
  const { user, isAdmin, can, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const [activeLoansCount, setActiveLoansCount] = useState(0)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Fetch active loans count for badge
  useEffect(() => {
    let mounted = true
    if (user && can('BORROW_USE')) {
      borrowApi
        .history()
        .then((records) => {
          if (!mounted) return
          const count = (records || []).filter((r) => r.status === 'BORROWED' || r.status === 'PENDING').length
          setActiveLoansCount(count)
        })
        .catch(() => {})
    }
    return () => {
      mounted = false
    }
  }, [user, can, location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNavSearch = (e) => {
    e.preventDefault()
    if (!navSearch.trim()) {
      navigate('/catalog')
    } else {
      navigate(`/catalog?q=${encodeURIComponent(navSearch.trim())}`)
    }
  }

  const userInitial = user?.fullName
    ? user.fullName.trim().charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U'

  return (
    <div className="customer-app-shell">
      {/* 1. Floating Glass Navbar */}
      <header className="customer-navbar">
        <div className="customer-nav-container">
          <div className="customer-nav-left">
            <Link to="/" className="customer-brand-link" aria-label="Trang chủ Thư viện">
              <div className="customer-brand-titles">
                <span className="customer-brand-name">Library</span>
                <span className="customer-brand-tag">Digital Reading Lounge</span>
              </div>
            </Link>

            <nav className="customer-desktop-nav" aria-label="Điều hướng chính">
              <NavLink to="/" end className={({ isActive }) => `customer-nav-item${isActive ? ' is-active' : ''}`}>
                <DashboardIcon width={16} height={16} />
                <span>Khám phá</span>
              </NavLink>
              {can('BOOK_VIEW') && (
                <NavLink to="/catalog" className={({ isActive }) => `customer-nav-item${isActive ? ' is-active' : ''}`}>
                  <BookIcon width={16} height={16} />
                  <span>Kho sách</span>
                </NavLink>
              )}
              {can('BORROW_USE') && (
                <NavLink to="/my-loans" className={({ isActive }) => `customer-nav-item${isActive ? ' is-active' : ''}`}>
                  <CirculationIcon width={16} height={16} />
                  <span>Sổ mượn</span>
                  {activeLoansCount > 0 && (
                    <span className="customer-nav-pill-badge">{activeLoansCount}/2</span>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* Quick Search Spotlight */}
          <form className="customer-nav-search-form" onSubmit={handleNavSearch}>
            <span className="customer-nav-search-icon">
              <SearchIcon width={15} height={15} />
            </span>
            <input
              type="text"
              className="customer-nav-search-input"
              placeholder="Tìm kiếm tác phẩm, tác giả..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
            />
          </form>

          {/* User & Actions */}
          <div className="customer-nav-right">
            {user && <NotificationBell />}
            {user ? (
              <div className="customer-user-menu-wrap">
                <Link to="/profile" className="customer-profile-chip" title="Xem thẻ bạn đọc & thông tin cá nhân">
                  <div className="customer-avatar-circle">{userInitial}</div>
                  <div className="customer-profile-chip-text">
                    <span className="customer-chip-name">{user?.fullName || user.email}</span>
                    <span className="customer-chip-role">
                      <UserIcon width={11} height={11} /> {isAdmin ? 'Thủ thư' : 'Bạn đọc số'}
                    </span>
                  </div>
                </Link>

                {isAdmin && (
                  <Link to="/admin" className="customer-admin-btn" title="Cổng quản trị thủ thư">
                    <ShieldIcon width={14} height={14} />
                    <span>Quản trị</span>
                  </Link>
                )}

                <button
                  type="button"
                  className="customer-logout-btn"
                  onClick={handleLogout}
                  title="Đăng xuất khỏi hệ thống"
                  aria-label="Đăng xuất"
                >
                  <LogoutIcon width={16} height={16} />
                </button>
              </div>
            ) : (
              <div className="customer-auth-buttons">
                <Link to="/login" className="btn btn-ghost btn-sm">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Tạo thẻ bạn đọc</Link>
              </div>
            )}

            <button
              type="button"
              className="customer-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {mobileOpen ? <CloseIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Mobile Drawer */}
      {mobileOpen && (
        <aside className="customer-mobile-drawer">
          <div className="customer-mobile-drawer-inner">
            <NavLink to="/" end className={({ isActive }) => `customer-mobile-link${isActive ? ' is-active' : ''}`}>
              <DashboardIcon width={18} height={18} />
              <span>Khám phá trang chủ</span>
            </NavLink>
            {can('BOOK_VIEW') && (
              <NavLink to="/catalog" className={({ isActive }) => `customer-mobile-link${isActive ? ' is-active' : ''}`}>
                <BookIcon width={18} height={18} />
                <span>Tra cứu danh mục sách</span>
              </NavLink>
            )}
            {can('BORROW_USE') && (
              <NavLink to="/my-loans" className={({ isActive }) => `customer-mobile-link${isActive ? ' is-active' : ''}`}>
                <CirculationIcon width={18} height={18} />
                <span>Sổ mượn & trả sách ({activeLoansCount}/2 cuốn)</span>
              </NavLink>
            )}
            {user && (
              <NavLink to="/profile" className={({ isActive }) => `customer-mobile-link${isActive ? ' is-active' : ''}`}>
                <UserIcon width={18} height={18} />
                <span>Thẻ bạn đọc & Hồ sơ</span>
              </NavLink>
            )}
            {user && (
              <NavLink to="/account" className={({ isActive }) => `customer-mobile-link${isActive ? ' is-active' : ''}`}>
                <SettingsIcon width={18} height={18} />
                <span>Cài đặt tài khoản & Mật khẩu</span>
              </NavLink>
            )}
            {user && isAdmin && (
              <NavLink to="/admin" className="customer-mobile-link customer-mobile-admin-link">
                <ShieldIcon width={18} height={18} />
                <span>Cổng Quản trị Thủ Thư</span>
              </NavLink>
            )}

            {user ? (
              <button type="button" className="customer-mobile-logout" onClick={handleLogout}>
                <LogoutIcon width={18} height={18} />
                <span>Đăng xuất tài khoản</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <Link to="/login" className="btn btn-secondary btn-block">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn-block">Đăng ký thẻ bạn đọc</Link>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* 3. Main Outlet */}
      <main className="customer-main-viewport">
        <Outlet />
      </main>

      {/* 4. Grand Literary Colophon Footer */}
      <footer className="customer-grand-footer">
        <div className="customer-footer-grid">
          <div className="customer-footer-brand-col">
            <div className="customer-brand-titles" style={{ marginBottom: 12 }}>
              <span className="customer-brand-name" style={{ fontSize: 22, color: 'var(--neo-ink-950)' }}>Thư Viện Số</span>
              <span className="customer-brand-tag" style={{ color: 'var(--neo-cobalt-600)' }}>Digital Reading Lounge & Archive</span>
            </div>
            <p className="customer-footer-lead">
              Không gian số hóa hội tụ những tác phẩm văn học kinh điển, tri thức học thuật, kỹ thuật công nghệ và những bộ óc vĩ đại của nhân loại.
            </p>
            <div className="customer-footer-quote">
              “Một cuốn sách thực sự giá trị sẽ khai mở tư duy, dạy ta cách quan sát thế giới với sự thông tuệ và sâu sắc hơn.”
            </div>
          </div>

          <div className="customer-footer-col">
            <h4 className="customer-footer-heading">Khám phá</h4>
            <ul className="customer-footer-links">
              <li><Link to="/catalog">Toàn bộ kho sách</Link></li>
              <li><Link to="/catalog?cat=văn học">Văn học kinh điển</Link></li>
              <li><Link to="/catalog?cat=khoa học">Khoa học & Tự nhiên</Link></li>
              <li><Link to="/catalog?cat=công nghệ">Công nghệ & Kỹ nghệ</Link></li>
              <li><Link to="/my-loans">Sổ mượn cá nhân</Link></li>
            </ul>
          </div>

          <div className="customer-footer-col">
            <h4 className="customer-footer-heading">Thời gian phục vụ</h4>
            <div className="customer-footer-schedule">
              <p>• <strong>Thứ 2 – Thứ 6:</strong> 07:30 – 21:00</p>
              <p>• <strong>Thứ 7 – Chủ Nhật:</strong> 08:00 – 17:30</p>
              <p>• <strong>Kho mượn trực tuyến:</strong> Phục vụ 24/7</p>
            </div>
          </div>

          <div className="customer-footer-col">
            <h4 className="customer-footer-heading">Quy chế bạn đọc</h4>
            <ul className="customer-footer-links">
              <li><span>Hạn ngạch: <strong>Tối đa 2 cuốn / lần</strong></span></li>
              <li><span>Thời hạn mượn: <strong>10 ngày / cuốn</strong></span></li>
              <li><span>Phí dịch vụ mượn: <strong>20.000 đ / lần</strong></span></li>
              <li><span>Phí trễ hạn: <strong>5.000 đ / ngày</strong></span></li>
              <li><Link to="/profile">Quyền lợi thành viên</Link></li>
            </ul>
          </div>
        </div>

        <div className="customer-footer-bottom-bar">
          <div className="customer-footer-copyright">
            © 2026 Hệ Thống Thư Viện
          </div>
          <div className="customer-footer-badges">
            <span>Phiên bản: 2.5</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

