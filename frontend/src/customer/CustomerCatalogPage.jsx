import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import Pagination from '../components/Pagination'
import {
  SearchIcon,
  BookIcon,
  FilterIcon,
  ChevronRightIcon,
  ClockIcon,
  CirculationIcon,
} from '../components/Icons'
import {
  resolveBookCover,
  formatDate,
  formatMoney,
  getMinReturnDate,
  getMaxReturnDate,
  getDefaultReturnDate,
  getFutureDate,
} from './bookUtils'
import CustomerBorrowModal from './CustomerBorrowModal'

export default function CustomerCatalogPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, can } = useAuth()

  // Query params parsing
  const queryParams = new URLSearchParams(location.search)
  const initialQuery = queryParams.get('q') || ''
  const initialCat = queryParams.get('cat') || ''

  // Filter state
  const [filters, setFilters] = useState({
    title: initialQuery,
    author: '',
    isbn: '',
    categoryId: '',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    title: initialQuery,
    author: '',
    isbn: '',
    categoryId: '',
  })

  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [userLoans, setUserLoans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [borrowModalBook, setBorrowModalBook] = useState(null)

  const openBookDetail = (book) => navigate(`/catalog/${book.id}`)

  // Load user loan history for quota & holding checks
  const loadUserLoans = useCallback(async () => {
    if (user && can('BORROW_USE')) {
      try {
        const hist = await borrowApi.history()
        setUserLoans(hist || [])
      } catch {
        // quiet fallback
      }
    }
  }, [user, can])

  useEffect(() => {
    loadUserLoans()
  }, [loadUserLoans])

  // Sync query params when location changes
  useEffect(() => {
    const q = queryParams.get('q') || ''
    const cat = queryParams.get('cat') || ''
    if (q) {
      setFilters((prev) => ({ ...prev, title: q }))
      setAppliedFilters((prev) => ({ ...prev, title: q }))
    }
  }, [location.search])

  // Load books catalog
  const loadBooks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size: 12,
        status: 'IN_CIRCULATION',
      }
      if (appliedFilters.title) params.title = appliedFilters.title
      if (appliedFilters.author) params.author = appliedFilters.author
      if (appliedFilters.isbn) params.isbn = appliedFilters.isbn
      if (appliedFilters.categoryId) params.categoryId = appliedFilters.categoryId

      const res = await booksApi.search(params)
      setData(res)

      // Extract unique categories from search result if needed
      if (res?.content && categories.length === 0) {
        const catMap = new Map()
        res.content.forEach((b) => {
          if (b.categoryId && b.categoryName) {
            catMap.set(String(b.categoryId), { id: b.categoryId, name: b.categoryName })
          }
        })
        if (catMap.size > 0) {
          setCategories(Array.from(catMap.values()))
        }
      }
    } catch (err) {
      setError(readError(err) || 'Không thể tải danh mục sách. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setAppliedFilters({ ...filters })
    setPage(0)
  }

  const handleResetFilters = () => {
    const empty = { title: '', author: '', isbn: '', categoryId: '' }
    setFilters(empty)
    setAppliedFilters(empty)
    setPage(0)
    navigate('/catalog', { replace: true })
  }

  const handleCategoryPillClick = (catId) => {
    const nextCat = String(appliedFilters.categoryId) === String(catId) ? '' : String(catId)
    const nextFilters = { ...filters, categoryId: nextCat }
    setFilters(nextFilters)
    setAppliedFilters({ ...appliedFilters, categoryId: nextCat })
    setPage(0)
  }

  const activeLoans = userLoans.filter((r) => r.status === 'BORROWED' || r.status === 'PENDING')
  const totalActiveLoans = activeLoans.length
  const reachedBorrowLimit = totalActiveLoans >= 2

  const hasActiveFilters = Boolean(
    appliedFilters.title || appliedFilters.author || appliedFilters.isbn || appliedFilters.categoryId
  )

  return (
    <div className="customer-catalog-page">
      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* 1. Catalog Hero & Discovery Bar */}
      <section className="catalog-discovery-hero">
        <div className="catalog-hero-inner">
          <div className="catalog-hero-head">
            <span className="catalog-hero-eyebrow">
              <BookIcon width={13} height={13} /> KHO SÁCH THƯ VIỆN
            </span>
            <h1 className="catalog-hero-title">Khám Phá & Tra Cứu Tác Phẩm</h1>
            <p className="catalog-hero-sub">
              Duyệt qua hàng ngàn tác phẩm văn học, học thuật, công nghệ và khoa học tự nhiên. Mượn trực tuyến với thời hạn 10 ngày.
            </p>
          </div>

          {/* Search Spotlight Form */}
          <form className="catalog-spotlight-search" onSubmit={handleSearchSubmit}>
            <div className="spotlight-input-wrap">
              <SearchIcon width={18} height={18} className="spotlight-icon" />
              <input
                type="text"
                className="spotlight-input"
                placeholder="Tìm theo tên tác phẩm, chủ đề, từ khóa..."
                value={filters.title}
                onChange={(e) => setFilters({ ...filters, title: e.target.value })}
              />
              <button type="submit" className="spotlight-btn">
                <span>Tìm sách</span>
                <ChevronRightIcon width={15} height={15} />
              </button>
            </div>

            <div className="catalog-secondary-filters">
              <input
                type="text"
                className="catalog-filter-input"
                placeholder="Lọc theo tác giả..."
                value={filters.author}
                onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              />
              <input
                type="text"
                className="catalog-filter-input"
                placeholder="Lọc theo mã ISBN..."
                value={filters.isbn}
                onChange={(e) => setFilters({ ...filters, isbn: e.target.value })}
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  className="catalog-clear-btn"
                  onClick={handleResetFilters}
                >
                  Xoá bộ lọc
                </button>
              )}
            </div>

            {/* Quick Category Pills Carousel */}
            <div className="catalog-category-pills">
              <span className="pills-label">Thể loại:</span>
              <button
                type="button"
                className={`catalog-pill ${!appliedFilters.categoryId ? 'is-active' : ''}`}
                onClick={() => handleCategoryPillClick('')}
              >
                Tất cả thể loại
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`catalog-pill ${String(appliedFilters.categoryId) === String(c.id) ? 'is-active' : ''}`}
                  onClick={() => handleCategoryPillClick(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* 2. Active Filters Display */}
      {hasActiveFilters && (
        <div className="catalog-active-chips-bar">
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--neo-text-light)' }}>Đang lọc:</span>
          {appliedFilters.title && (
            <span className="catalog-chip">
              Tiêu đề: {appliedFilters.title}
              <button type="button" onClick={() => { setFilters({ ...filters, title: '' }); setAppliedFilters({ ...appliedFilters, title: '' }); setPage(0) }}>×</button>
            </span>
          )}
          {appliedFilters.author && (
            <span className="catalog-chip">
              Tác giả: {appliedFilters.author}
              <button type="button" onClick={() => { setFilters({ ...filters, author: '' }); setAppliedFilters({ ...appliedFilters, author: '' }); setPage(0) }}>×</button>
            </span>
          )}
          {appliedFilters.isbn && (
            <span className="catalog-chip">
              ISBN: {appliedFilters.isbn}
              <button type="button" onClick={() => { setFilters({ ...filters, isbn: '' }); setAppliedFilters({ ...appliedFilters, isbn: '' }); setPage(0) }}>×</button>
            </span>
          )}
          {appliedFilters.categoryId && (
            <span className="catalog-chip">
              Thể loại: {categories.find((c) => String(c.id) === String(appliedFilters.categoryId))?.name || appliedFilters.categoryId}
              <button type="button" onClick={() => { setFilters({ ...filters, categoryId: '' }); setAppliedFilters({ ...appliedFilters, categoryId: '' }); setPage(0) }}>×</button>
            </span>
          )}
        </div>
      )}

      {/* 3. Catalog Results Grid */}
      <section className="catalog-results-section">
        <div className="catalog-results-header">
          <div className="catalog-results-count">
            {loading ? 'Đang tải danh mục...' : data ? `Hiển thị ${data.content.length} / ${data.totalElements} tác phẩm khả dụng` : ''}
          </div>
          {user && (
            <div className="catalog-user-quota-hint">
              Hạn mức bạn đọc: <strong>{totalActiveLoans}/02 cuốn</strong>
            </div>
          )}
        </div>

        {loading && !data ? (
          <Skeleton rows={6} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            icon="book"
            title="Không tìm thấy cuốn sách nào"
            description={
              hasActiveFilters
                ? 'Không có tác phẩm nào phù hợp với các tiêu chí tìm kiếm hiện tại. Hãy thử nới lỏng bộ lọc.'
                : 'Kho sách hiện đang được bổ sung và cập nhật.'
            }
            action={
              hasActiveFilters ? (
                <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
                  Xoá các điều kiện lọc
                </button>
              ) : null
            }
          />
        ) : data && (
          <>
            <div className="catalog-books-grid">
              {data.content.map((b) => {
                const cover = resolveBookCover(b)
                const isAvailable = b.quantityAvailable > 0
                const isHolding = userLoans.some(
                  (r) => (r.status === 'BORROWED' || r.status === 'PENDING') && r.bookId === b.id
                )

                return (
                  <article key={b.id} className="catalog-card-item">
                    <div
                      className="catalog-card-cover-box"
                      onClick={() => openBookDetail(b)}
                      title={`Xem chi tiết tác phẩm ${b.title}`}
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={b.title}
                          className="catalog-card-cover-img"
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
                        className="catalog-card-cover-fallback"
                        style={{ display: cover ? 'none' : 'flex' }}
                      >
                        <BookIcon width={32} height={32} />
                        <span>THƯ VIỆN</span>
                      </div>

                      <div className="catalog-card-cover-spine" />
                      <span className="catalog-card-cat-badge">{b.categoryName || 'Sách tổng hợp'}</span>
                    </div>

                    <div className="catalog-card-body">
                      <h3
                        className="catalog-card-title"
                        title={b.title}
                        onClick={() => openBookDetail(b)}
                      >
                        {b.title}
                      </h3>
                      <p className="catalog-card-author" title={(b.authorNames || []).join(', ')}>
                        {(b.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'}
                      </p>

                      <div className="catalog-card-footer">
                        <div className="catalog-stock-status">
                          <span className={`stock-status-dot ${isAvailable ? 'in-stock' : 'out-stock'}`} />
                          <span>{isAvailable ? `Còn ${b.quantityAvailable} cuốn` : 'Tạm hết'}</span>
                        </div>

                        <div className="catalog-actions-group">
                          <button
                            type="button"
                            className="catalog-quick-detail-btn"
                            onClick={() => openBookDetail(b)}
                          >
                            Chi tiết
                          </button>
                          {can('BORROW_USE') && (
                            isHolding ? (
                              <Link to="/my-loans" className="catalog-borrow-btn btn-muted">
                                Đang giữ
                              </Link>
                            ) : reachedBorrowLimit ? (
                              <Link to="/my-loans" className="catalog-borrow-btn btn-muted">
                                Hết ngạch
                              </Link>
                            ) : isAvailable ? (
                              <button
                                type="button"
                                className="catalog-borrow-btn btn-primary"
                                onClick={() => setBorrowModalBook(b)}
                              >
                                Mượn sách
                              </button>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onChange={setPage}
            />
          </>
        )}
      </section>

      

      {/* Fast Borrow Modal */}
      {borrowModalBook && (
        <CustomerBorrowModal
          book={borrowModalBook}
          user={user}
          totalActiveLoans={totalActiveLoans}
          hasExistingLoanOrPending={userLoans.some(
            (r) => (r.status === 'BORROWED' || r.status === 'PENDING') && r.bookId === borrowModalBook.id
          )}
          onClose={() => setBorrowModalBook(null)}
          onSuccess={(book, dueDate) => {
            setBorrowModalBook(null)
            setNotice(`Yêu cầu mượn cuốn “${book.title}” đã được tiếp nhận. Hẹn trả: ${formatDate(dueDate)}.`)
            loadBooks()
            loadUserLoans()
          }}
        />
      )}
    </div>
  )
}

