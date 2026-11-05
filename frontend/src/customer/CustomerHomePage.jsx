import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import Skeleton from '../components/Skeleton'
import {
  BookIcon,
  CirculationIcon,
  ClockIcon,
  ChevronRightIcon,
  SearchIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UserIcon,
} from '../components/Icons'
import {
  resolveBookCover,
  formatDate,
  formatMoney,
  isOverdue,
  getDaysRemaining,
  getLoanProgress,
} from './bookUtils'
import CustomerBorrowModal from './CustomerBorrowModal'

// Curated collections metadata
const FEATURED_COLLECTIONS = [
  {
    id: 'classics',
    title: 'Kiệt tác văn học kinh điển',
    subtitle: 'Những áng văn bất hủ định hình tư tưởng và tâm hồn nhân loại qua nhiều thế hệ.',
    tag: 'Văn học tinh hoa',
    accentColor: '#1e3a8a',
    cover: '/anhbia/nhagiakim.jpg',
    leadBook: {
      title: 'Nhà Giả Kim (The Alchemist)',
      author: 'Paulo Coelho',
      category: 'Văn học nghệ thuật',
      quote: '“Khi bạn thực sự khao khát một điều gì đó, cả vũ trụ sẽ hợp lực giúp bạn đạt được nó.”',
      cover: '/anhbia/nhagiakim.jpg',
    },
    books: [
      { title: 'Tắt Đèn', author: 'Ngô Tất Tố', cover: '/anhbia/tatden.jpg', cat: 'Văn học' },
      { title: 'Số Đỏ', author: 'Vũ Trọng Phụng', cover: '/anhbia/sodo.webp', cat: 'Văn học' },
      { title: 'Truyện Kiều', author: 'Nguyễn Du', cover: '/anhbia/truyenkieu.webp', cat: 'Văn học' },
      { title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', cover: '/anhbia/dacnhantam.jpg', cat: 'Kỹ năng sống' },
    ],
  },
  {
    id: 'science',
    title: 'Khoa học, Vũ trụ & Khai phóng',
    subtitle: 'Du hành vào không thời gian, khám phá nguồn gốc sinh học và các định luật tự nhiên.',
    tag: 'Khoa học chọn lọc',
    accentColor: '#047857',
    cover: '/anhbia/luocsuthoigian.webp',
    leadBook: {
      title: 'Lược Sử Thời Gian (A Brief History of Time)',
      author: 'Stephen Hawking',
      category: 'Khoa học tự nhiên',
      quote: '“Mục đích tối hậu của khoa học là đưa ra một lý thuyết duy nhất mô tả toàn bộ vũ trụ.”',
      cover: '/anhbia/luocsuthoigian.webp',
    },
    books: [
      { title: 'Lược Sử Loài Người (Sapiens)', author: 'Yuval Noah Harari', cover: '/anhbia/luocsuloainguoi.jpg', cat: 'Lịch sử' },
      { title: 'Vật Lý Đại Cương', author: 'Lương Duyên Bình', cover: '/anhbia/vatlydaicuong.png', cat: 'Vật lý' },
      { title: 'Giải Tích 1', author: 'Bộ môn Toán Giải Tích', cover: '/anhbia/giaitich1.jpg', cat: 'Toán học' },
    ],
  },
  {
    id: 'technology',
    title: 'Kỹ nghệ Phần mềm & Công nghệ Số',
    subtitle: 'Nền tảng kiến trúc phần mềm, lập trình hiện đại và hệ thống mạng tương lai.',
    tag: 'Công nghệ tiên phong',
    accentColor: '#b45309',
    cover: '/anhbia/CleanArchitecture.jpg',
    leadBook: {
      title: 'Clean Architecture: A Craftsman’s Guide',
      author: 'Robert C. Martin (Uncle Bob)',
      category: 'Công nghệ thông tin',
      quote: '“Kiến trúc tốt làm cho hệ thống dễ hiểu, dễ phát triển, dễ duy trì và dễ triển khai.”',
      cover: '/anhbia/CleanArchitecture.jpg',
    },
    books: [
      { title: 'Java Core & Nâng Cao', author: 'Sun Microsystems / Oracle', cover: '/anhbia/javacore.jpg', cat: 'Lập trình' },
      { title: 'Spring Boot in Action', author: 'Craig Walls', cover: '/anhbia/springbootinaction.webp', cat: 'Framework' },
      { title: 'Cấu Trúc Dữ Liệu & Giải Thuật', author: 'Học viện Công nghệ', cover: '/anhbia/cautrucdulieuvagiaithuat.jpg', cat: 'Khoa học máy tính' },
      { title: 'Cơ Sở Dữ Liệu Quan Hệ', author: 'Giáo trình CNTT', cover: '/anhbia/cosodulieuquanhe.jpg', cat: 'Cơ sở dữ liệu' },
    ],
  },
]

// Category Atlas data
const CATEGORY_ATLAS = [
  { name: 'Văn học & Nghệ thuật', query: 'Văn học', icon: '📖', desc: 'Tiểu thuyết kinh điển, thi ca và danh tác thế giới', color: '#3b82f6', count: '1.200+' },
  { name: 'Công nghệ thông tin', query: 'Công nghệ', icon: '💻', desc: 'Kiến trúc phần mềm, Java, Spring Boot và AI', color: '#10b981', count: '850+' },
  { name: 'Khoa học & Vũ trụ', query: 'Khoa học', icon: '🔭', desc: 'Vật lý, thiên văn, lược sử vũ trụ và sinh học', color: '#8b5cf6', count: '640+' },
  { name: 'Kinh tế & Kỹ năng sống', query: 'Kinh tế', icon: '💡', desc: 'Phát triển bản thân, tư duy lãnh đạo và tài chính', color: '#f59e0b', count: '920+' },
  { name: 'Toán học & Tự nhiên', query: 'Toán', icon: '📐', desc: 'Giải tích, đại số tuyến tính và logic học', color: '#06b6d4', count: '430+' },
  { name: 'Lịch sử & Triết học', query: 'Lịch sử', icon: '🏛️', desc: 'Sapiens, văn minh nhân loại và dòng chảy tư tưởng', color: '#ec4899', count: '510+' },
]

export default function CustomerHomePage() {
  const { user, can } = useAuth()
  const navigate = useNavigate()

  // State
  const [heroSearch, setHeroSearch] = useState('')
  const [catalogPool, setCatalogPool] = useState([])
  const [popularCarouselBooks, setPopularCarouselBooks] = useState([])
  const [totalCatalogCount, setTotalCatalogCount] = useState(0)
  const [userHistory, setUserHistory] = useState([])
  const [activeTab, setActiveTab] = useState('POPULAR') // 'POPULAR' | 'CATEGORY' | 'AUTHOR'
  const [tabData, setTabData] = useState({ POPULAR: [], CATEGORY: [], AUTHOR: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Active collection tab in Section B
  const [activeCollectionId, setActiveCollectionId] = useState('classics')

  // Borrow modal
  const [borrowModalBook, setBorrowModalBook] = useState(null)

  // Load Catalog, History & Recommendations
  const loadHomeData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const historyPromise = can('BORROW_USE') ? borrowApi.history() : Promise.resolve([])
      const countPromise = can('BOOK_VIEW') ? booksApi.search({ page: 0, size: 1, status: 'IN_CIRCULATION' }) : Promise.resolve(null)
      const catalogPromise = can('BOOK_VIEW') ? booksApi.search({ page: 0, size: 50, status: 'IN_CIRCULATION' }) : Promise.resolve(null)
      const popularPromise = can('BOOK_VIEW') ? booksApi.getRecommendations('POPULAR', 10) : Promise.resolve([])

      const [histRes, countRes, catalogRes, popularRes] = await Promise.allSettled([
        historyPromise,
        countPromise,
        catalogPromise,
        popularPromise,
      ])

      const histData = histRes.status === 'fulfilled' ? (histRes.value || []) : []
      setUserHistory(histData)

      if (countRes.status === 'fulfilled' && countRes.value?.totalElements != null) {
        setTotalCatalogCount(countRes.value.totalElements)
      }

      const books = (catalogRes.status === 'fulfilled' && catalogRes.value?.content) ? catalogRes.value.content : []
      setCatalogPool(books)
      const popularBooks = popularRes.status === 'fulfilled' ? (popularRes.value || []) : []
      const uniquePopularBooks = [...new Map(popularBooks.filter((book) => book?.id != null).map((book) => [book.id, book])).values()]
        .slice(0, 10)
      setPopularCarouselBooks(uniquePopularBooks)

      // Fallback recommendation algorithms
      const activeBorrowIds = new Set(histData.filter((r) => r.status === 'BORROWED' || r.status === 'PENDING').map((r) => r.bookId))

      // Popular: sorted by borrow count or availability
      const popular = [...books]
        .map((b) => {
          const borrowedCount = Math.max(0, (b.quantityTotal || 0) - (b.quantityAvailable || 0))
          return { ...b, score: borrowedCount * 10 + (b.quantityTotal || 0) }
        })
        .sort((a, b) => b.score - a.score || b.id - a.id)
        .slice(0, 8)

      // Category match
      const userCategories = new Set(histData.map((h) => (h.categoryName || '').toLowerCase()))
      const byCategory = [...books]
        .map((b) => {
          const match = userCategories.has((b.categoryName || '').toLowerCase())
          return { ...b, score: match ? 20 : 0 + (b.quantityAvailable > 0 ? 10 : 0) }
        })
        .sort((a, b) => b.score - a.score || b.id - a.id)
        .slice(0, 8)

      // Author match
      const byAuthor = [...books]
        .sort((a, b) => (b.quantityAvailable || 0) - (a.quantityAvailable || 0))
        .slice(0, 8)

      setTabData({
        POPULAR: uniquePopularBooks.length > 0 ? uniquePopularBooks.slice(0, 8) : popular,
        CATEGORY: byCategory.length > 0 ? byCategory : books.slice(0, 8),
        AUTHOR: byAuthor.length > 0 ? byAuthor : books.slice(0, 8),
      })
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [can])

  useEffect(() => {
    loadHomeData()
  }, [loadHomeData])

  // Active Loans & Quota
  const activeLoans = useMemo(() => userHistory.filter((r) => r.status === 'BORROWED'), [userHistory])
  const pendingRequests = useMemo(() => userHistory.filter((r) => r.status === 'PENDING'), [userHistory])
  const totalActiveLoans = activeLoans.length + pendingRequests.length
  const reachedBorrowLimit = totalActiveLoans >= 2

  const activeCollection = useMemo(() => {
    return FEATURED_COLLECTIONS.find((c) => c.id === activeCollectionId) || FEATURED_COLLECTIONS[0]
  }, [activeCollectionId])

  const handleHeroSearch = (e) => {
    e.preventDefault()
    if (!heroSearch.trim()) {
      navigate('/catalog')
    } else {
      navigate(`/catalog?q=${encodeURIComponent(heroSearch.trim())}`)
    }
  }

  const openBorrowModal = (book) => {
    setBorrowModalBook(book)
  }

  const handleBorrowSuccess = async (book, dueDate) => {
    setBorrowModalBook(null)
    setNotice(`Yêu cầu mượn cuốn “${book.title}” đã được tiếp nhận thành công. Hẹn trả: ${formatDate(dueDate)}.`)
    await loadHomeData()
  }

  const currentBooks = tabData[activeTab] || []
  const firstName = user?.fullName ? user.fullName.split(' ').slice(-1)[0] : user?.email?.split('@')[0] || 'Bạn đọc'

  return (
    <div className="customer-immersive-home">
      {notice && (
        <Alert type="success" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* =========================================================================
          SECTION A: IMMERSIVE HERO BILLBOARD
          ========================================================================= */}
      <section className="immersive-hero-billboard">
        <div className="immersive-hero-atmosphere" aria-hidden="true">
          <div className="hero-light-orb hero-light-orb-blue" />
          <div className="hero-light-orb hero-light-orb-amber" />
          <div className="hero-grid-overlay" />
        </div>

        <div className="immersive-hero-container">
          <div className="immersive-hero-content">
            <h1 className="immersive-hero-headline">
              Nơi Những Trang Sách <br />
              <span className="immersive-headline-serif">Khai Mở Chân Trời Tri Thức</span>
            </h1>

            <p className="immersive-hero-description">
              Chào mừng {firstName} đến với thư viện số tuyển chọn. Đắm mình trong hàng ngàn ấn phẩm văn học kinh điển, công nghệ, triết học và khoa học tự nhiên. Mượn sách trực tuyến miễn phí và nuôi dưỡng tư duy mỗi ngày.
            </p>

            {/* Integrated Spotlight Search */}
            <form className="immersive-hero-search" onSubmit={handleHeroSearch}>
              <SearchIcon width={20} height={20} className="hero-search-icon" />
              <input
                type="text"
                className="hero-search-input"
                placeholder="Nhập tên sách, tác giả hoặc chủ đề bạn muốn khám phá..."
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
              />
              <button type="submit" className="hero-search-submit-btn">
                <span>Tìm kiếm</span>
                <ChevronRightIcon width={16} height={16} />
              </button>
            </form>

            {/* Quick Actions & Quota */}
            <div className="immersive-hero-actions">
              <Link to="/catalog" className="btn-immersive-primary">
                <BookIcon width={17} height={17} />
                <span>Khám phá toàn bộ kho sách</span>
              </Link>
              {can('BORROW_USE') && (
                <Link to="/my-loans" className="btn-immersive-secondary">
                  <CirculationIcon width={17} height={17} />
                  <span>Sổ mượn cá nhân</span>
                  <span className="hero-action-pill">{totalActiveLoans}/2 cuốn</span>
                </Link>
              )}
            </div>
          </div>

          {/* Rotating showcase from the live library catalog */}
          <div className="immersive-hero-showcase">
            <div className="hero-orbit-stage" aria-label="Sách trong thư viện">
              <div className="hero-orbit-plane">
                <div className="hero-orbit-spin" role="list">
                  {popularCarouselBooks.map((book, index, books) => {
                    const angle = (360 / books.length) * index
                    const cover = resolveBookCover(book)
                    return (
                      <div
                        className="hero-orbit-position"
                        role="listitem"
                        key={book.id || `${book.title}-${index}`}
                        style={{ '--book-angle': `${angle}deg` }}
                      >
                        <Link
                          to={`/catalog/${book.id}`}
                          className="hero-orbit-book"
                          aria-label={`Xem chi tiết sách ${book.title}`}
                        >
                          {cover ? (
                            <img src={cover} alt={book.title} />
                          ) : (
                            <div className="hero-orbit-no-cover">{book.title}</div>
                          )}
                          <span className="hero-orbit-title">{book.title}</span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="hero-curated-stamp">
              <div className="stamp-icon-wrap">
                <BookIcon width={16} height={16} />
              </div>
              <div className="stamp-text">
                <span className="stamp-title">Tuyển chọn của thư viện</span>
                <span className="stamp-sub">“Một cuốn sách hay, một ngày khác đi”</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION E: PERSONAL READING LOUNGE (IF LOGGED IN) OR MEMBER INVITATION
          Integrated seamlessly into the reading experience
          ========================================================================= */}
      <section className="immersive-reading-lounge">
        <div className="reading-lounge-container">
          <div className="lounge-header">
            <div>
              <span className="lounge-eyebrow">
                <ClockIcon width={13} height={13} /> {user ? 'GÓC ĐỌC CỦA BẠN' : 'THÀNH VIÊN THƯ VIỆN'}
              </span>
              <h2 className="lounge-title">
                {user ? `Tiến Trình Đọc Của ${firstName}` : 'Trở Thành Bạn Đọc Thư Viện'}
              </h2>
            </div>
            {user && (
              <Link to="/my-loans" className="lounge-view-all">
                <span>Mở sổ mượn sách ({totalActiveLoans}/2)</span>
                <ChevronRightIcon width={14} height={14} />
              </Link>
            )}
          </div>

          {user ? (
            <div className="lounge-body">
              {activeLoans.length > 0 ? (
                <div className="lounge-loans-grid">
                  {activeLoans.map((loan) => {
                    const cover = loan.bookImgUrl || resolveBookCover({ title: loan.bookTitle })
                    const overdueStatus = isOverdue(loan)
                    const daysLeft = getDaysRemaining(loan.dueDate)
                    const progressPct = getLoanProgress(loan.borrowDate, loan.dueDate)

                    return (
                      <article key={loan.id} className={`lounge-loan-card ${overdueStatus ? 'is-overdue' : ''}`}>
                        <div className="lounge-card-cover-wrap">
                          {cover ? (
                            <img src={cover} alt={loan.bookTitle} className="lounge-card-cover-img" />
                          ) : (
                            <div className="lounge-card-cover-fallback">
                              <BookIcon width={28} height={28} />
                            </div>
                          )}
                        </div>

                        <div className="lounge-card-meta">
                          <div className="lounge-card-top-row">
                            <span className={`lounge-status-chip ${overdueStatus ? 'overdue' : 'reading'}`}>
                              <span className="lounge-status-dot" />
                              {overdueStatus ? `Quá hạn ${loan.overdueDays || 1} ngày` : `Còn ${daysLeft > 0 ? daysLeft : 0} ngày đọc`}
                            </span>
                            <span className="lounge-loan-id">Mã #{loan.id}</span>
                          </div>

                          <h3 className="lounge-book-title">{loan.bookTitle}</h3>

                          <div className="lounge-date-row">
                            <span>Ngày nhận: {formatDate(loan.borrowDate)}</span>
                            <span>•</span>
                            <span className="lounge-due-date">Hạn trả: <strong>{formatDate(loan.dueDate)}</strong></span>
                          </div>

                          {/* Progress bar towards return date */}
                          <div className="lounge-loan-progress-wrap">
                            <div className="lounge-progress-bar">
                              <div
                                className={`lounge-progress-fill ${overdueStatus ? 'fill-danger' : ''}`}
                                style={{ width: `${overdueStatus ? 100 : progressPct}%` }}
                              />
                            </div>
                            <span className="lounge-progress-text">
                              {overdueStatus ? 'Cần hoàn trả ngay' : `Tiến độ mượn: ${progressPct}%`}
                            </span>
                          </div>

                          {overdueStatus && loan.penaltyAmount && Number(loan.penaltyAmount) > 0 && (
                            <div className="lounge-penalty-notice">
                              <AlertCircleIcon width={14} height={14} />
                              <span>Phí phạt trễ hạn ước tính: {formatMoney(loan.penaltyAmount)} (5.000 đ/ngày)</span>
                            </div>
                          )}
                        </div>

                        <div className="lounge-card-action">
                          <Link to="/my-loans" className="btn btn-secondary btn-sm">
                            Xem phiếu & Trả sách
                          </Link>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="lounge-pending-banner">
                  <div className="pending-banner-icon">
                    <ClockIcon width={24} height={24} />
                  </div>
                  <div className="pending-banner-info">
                    <h4>Bạn có {pendingRequests.length} yêu cầu mượn đang chờ thủ thư tiếp nhận</h4>
                    <p>
                      Tác phẩm: <strong>{pendingRequests.map((p) => p.bookTitle).join(', ')}</strong>. Thời gian chuẩn bị sách từ 1 – 3 ngày làm việc.
                    </p>
                  </div>
                  <Link to="/my-loans" className="btn btn-secondary btn-sm">
                    Xem tiến độ duyệt
                  </Link>
                </div>
              ) : (
                <div className="lounge-empty-shelf-card">
                  <div className="empty-shelf-icon-wrap">
                    <BookIcon width={32} height={32} />
                  </div>
                  <div className="empty-shelf-text">
                    <h3>Tủ sách cá nhân của bạn hiện đang trống</h3>
                    <p>
                      Bạn đang có trọn vẹn <strong>02 lượt mượn khả dụng</strong> với thời hạn 10 ngày. Hãy khám phá kho tàng sách bên dưới và chọn cuốn sách yêu thích hôm nay!
                    </p>
                  </div>
                  <Link to="/catalog" className="btn btn-primary btn-sm">
                    Khám phá sách ngay
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="lounge-guest-banner">
              <div className="guest-banner-left">
                <div className="guest-banner-badge">Thẻ Bạn Đọc Số</div>
                <h3>Trở thành thành viên để mượn sách trực tuyến miễn phí</h3>
                <p>
                  Đăng ký tài khoản bạn đọc chỉ trong 1 phút để tiếp cận kho tài liệu phong phú, lưu trữ danh mục yêu thích và nhận sách tận tay tại quầy lưu thông.
                </p>
              </div>
              <div className="guest-banner-actions">
                <Link to="/register" className="btn btn-primary">
                  Đăng ký thẻ bạn đọc
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Đã có tài khoản? Đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION B: FEATURED CURATED COLLECTIONS (EDITORIAL SHOWCASE BENTO)
          ========================================================================= */}
      <section className="immersive-featured-collections">
        <div className="section-header-wrap">
          <div>
            <span className="section-eyebrow">CHUYÊN ĐỀ TUYỂN CHỌN</span>
            <h2 className="section-title">Bộ Sưu Tập Sách Đặc Sắc</h2>
          </div>

          {/* Collection Tab Switcher */}
          <div className="collection-tabs-bar" role="tablist">
            {FEATURED_COLLECTIONS.map((col) => (
              <button
                key={col.id}
                type="button"
                role="tab"
                aria-selected={activeCollectionId === col.id}
                className={`collection-tab-pill ${activeCollectionId === col.id ? 'is-active' : ''}`}
                onClick={() => setActiveCollectionId(col.id)}
              >
                {col.title}
              </button>
            ))}
          </div>
        </div>

        {/* Active Collection Showcase Bento */}
        <div className="collection-showcase-bento">
          {/* Left: Lead Spotlight Book */}
          <div className="collection-lead-card">
            <div className="lead-card-cover-side">
              <img src={activeCollection.leadBook.cover} alt={activeCollection.leadBook.title} className="lead-cover-img" />
              <div className="lead-cover-spine" />
            </div>

            <div className="lead-card-content-side">
              <span className="lead-card-tag">{activeCollection.tag}</span>
              <h3 className="lead-card-title">{activeCollection.leadBook.title}</h3>
              <p className="lead-card-author">Tác giả: <strong>{activeCollection.leadBook.author}</strong></p>
              <div className="lead-card-quote">{activeCollection.leadBook.quote}</div>

              <div className="lead-card-footer">
                <Link
                  to={`/catalog?q=${encodeURIComponent(activeCollection.leadBook.title.split('(')[0].trim())}`}
                  className="btn btn-primary btn-sm"
                >
                  <SearchIcon width={14} height={14} /> Tra cứu tác phẩm này
                </Link>
                <span className="lead-card-cat-badge">{activeCollection.leadBook.category}</span>
              </div>
            </div>
          </div>

          {/* Right: Companion Books Grid */}
          <div className="collection-companions-grid">
            {activeCollection.books.map((b, idx) => (
              <article key={idx} className="companion-book-card">
                <div className="companion-cover-wrap">
                  <img src={b.cover} alt={b.title} className="companion-cover-img" />
                  <div className="companion-cover-spine" />
                </div>
                <div className="companion-meta">
                  <span className="companion-cat">{b.cat}</span>
                  <h4 className="companion-title">{b.title}</h4>
                  <p className="companion-author">{b.author}</p>
                  <Link
                    to={`/catalog?q=${encodeURIComponent(b.title)}`}
                    className="companion-link"
                  >
                    <span>Xem sách</span>
                    <ChevronRightIcon width={13} height={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C: PHÂN LOẠI DANH MỤC THƯ VIỆN (MINIMALIST SUBJECT INDEX)
          ========================================================================= */}
      {/* <section className="library-cat-section">
        <div className="section-header-wrap">
          <div>
            <span className="section-eyebrow">PHÂN LOẠI TÀI LIỆU</span>
            <h2 className="section-title">Danh Mục Sách</h2>
            <p className="section-subtitle">
              Tra cứu nhanh theo từng chuyên ngành và thể loại lưu hành.
            </p>
          </div>
          <Link to="/catalog" className="section-action-link">
            <span>Toàn bộ danh mục</span>
            <ChevronRightIcon width={15} height={15} />
          </Link>
        </div>

        <div className="library-cat-index-grid">
          {[
            { code: '01', name: 'Văn học & Nghệ thuật', query: 'Văn học', count: '1.200' },
            { code: '02', name: 'Công nghệ thông tin', query: 'Công nghệ', count: '850' },
            { code: '03', name: 'Khoa học & Tự nhiên', query: 'Khoa học', count: '640' },
            { code: '04', name: 'Kinh tế & Kỹ năng', query: 'Kinh tế', count: '920' },
            { code: '05', name: 'Toán học & Vật lý', query: 'Toán', count: '430' },
            { code: '06', name: 'Lịch sử & Xã hội', query: 'Lịch sử', count: '510' },
          ].map((cat) => (
            <Link
              key={cat.code}
              to={`/catalog?cat=${encodeURIComponent(cat.query)}`}
              className="library-cat-row"
            >
              <div className="cat-row-main">
                <span className="cat-row-idx">{cat.code}</span>
                <span className="cat-row-label">{cat.name}</span>
              </div>
              <div className="cat-row-meta">
                <span className="cat-row-badge">{cat.count} cuốn</span>
                <span className="cat-row-sym" aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section> */}

      {/* =========================================================================
          SECTION D: TRENDING & POPULAR BOOKS (BOOKSTORE GALLERY)
          ========================================================================= */}
      <section className="immersive-trending-gallery">
        <div className="section-header-wrap">
          <div>
            <span className="section-eyebrow">ẤN PHẨM NỔI BẬT</span>
            <h2 className="section-title">Sách Đang Được Quan Tâm</h2>
          </div>

          {/* 3 Tab Filter */}
          <div className="gallery-tabs-nav" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'POPULAR'}
              className={`gallery-tab-btn ${activeTab === 'POPULAR' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('POPULAR')}
            >
              Phổ biến nhất
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'CATEGORY'}
              className={`gallery-tab-btn ${activeTab === 'CATEGORY' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('CATEGORY')}
            >
              Theo gu của bạn
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'AUTHOR'}
              className={`gallery-tab-btn ${activeTab === 'AUTHOR' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('AUTHOR')}
            >
              Tác giả nổi tiếng
            </button>
          </div>
        </div>

        {loading ? (
          <Skeleton rows={4} />
        ) : currentBooks.length > 0 ? (
          <div className="bookstore-gallery-grid">
            {currentBooks.map((book) => {
              const coverUrl = resolveBookCover(book)
              const isAvailable = book.quantityAvailable > 0
              const isAlreadyBorrowing = userHistory.some(
                (r) => (r.status === 'BORROWED' || r.status === 'PENDING') && r.bookId === book.id
              )

              return (
                <article key={book.id} className="bookstore-book-card">
                  <div
                    className="bookstore-cover-stage"
                    onClick={() => openBorrowModal(book)}
                    title={`Xem chi tiết & mượn sách ${book.title}`}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="bookstore-cover-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="bookstore-cover-fallback"
                      style={{ display: coverUrl ? 'none' : 'flex' }}
                    >
                      <BookIcon width={36} height={36} />
                      <span>{book.categoryName || 'THƯ VIỆN'}</span>
                    </div>

                    <div className="bookstore-cover-spine-lighting" />
                    <span className="bookstore-cat-chip">{book.categoryName || 'Sách tổng hợp'}</span>
                  </div>

                  <div className="bookstore-card-body">
                    <h3
                      className="bookstore-card-title"
                      title={book.title}
                      onClick={() => openBorrowModal(book)}
                    >
                      {book.title}
                    </h3>
                    <p className="bookstore-card-author" title={(book.authorNames || []).join(', ')}>
                      {(book.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'}
                    </p>

                    <div className="bookstore-card-footer">
                      <div className="bookstore-stock-tag">
                        <span className={`stock-status-dot ${isAvailable ? 'in-stock' : 'out-stock'}`} />
                        <span>{isAvailable ? `Còn ${book.quantityAvailable} cuốn` : 'Hết sách'}</span>
                      </div>

                      {can('BORROW_USE') && (
                        isAlreadyBorrowing ? (
                          <Link to="/my-loans" className="bookstore-borrow-btn btn-muted" title="Bạn đang giữ sách này">
                            Đang mượn
                          </Link>
                        ) : reachedBorrowLimit ? (
                          <Link to="/my-loans" className="bookstore-borrow-btn btn-muted" title="Hạn mức tối đa 2 cuốn">
                            Hết hạn ngạch
                          </Link>
                        ) : isAvailable ? (
                          <button
                            type="button"
                            className="bookstore-borrow-btn btn-primary"
                            onClick={() => openBorrowModal(book)}
                          >
                            Mượn sách
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="bookstore-borrow-btn btn-disabled"
                            disabled
                          >
                            Tạm hết
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="bookstore-empty-gallery">
            <BookIcon width={36} height={36} />
            <p>Hiện chưa có tác phẩm nổi bật trong phân loại này. Vui lòng quay lại sau.</p>
          </div>
        )}
      </section>

      {/* Fast Borrow Modal */}
      {borrowModalBook && (
        <CustomerBorrowModal
          book={borrowModalBook}
          user={user}
          totalActiveLoans={totalActiveLoans}
          hasExistingLoanOrPending={userHistory.some(
            (r) => (r.status === 'BORROWED' || r.status === 'PENDING') && r.bookId === borrowModalBook.id
          )}
          onClose={() => setBorrowModalBook(null)}
          onSuccess={handleBorrowSuccess}
        />
      )}
    </div>
  )
}

