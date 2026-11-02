import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import Skeleton from '../components/Skeleton'
import Modal from '../components/Modal'
import { BookIcon, CirculationIcon, ClockIcon, ChevronRightIcon, SearchIcon } from '../components/Icons'

function getMinReturnDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function getMaxReturnDate() {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  return d.toISOString().split('T')[0]
}

function getDefaultReturnDate() {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  return d.toISOString().split('T')[0]
}

function getFutureDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const CURATED_COVERS = {
  'tắt đèn': '/anhbia/tatden.jpg',
  'số đỏ': '/anhbia/sodo.webp',
  'truyện kiều': '/anhbia/truyenkieu.webp',
  'nhà giả kim': '/anhbia/nhagiakim.jpg',
  'đắc nhân tâm': '/anhbia/dacnhantam.jpg',
  'dế mèn': '/anhbia/demenphieuluuky.jpg',
  'giải tích': '/anhbia/giaitich1.jpg',
  'toán': '/anhbia/giaitich1.jpg',
  'lược sử thời gian': '/anhbia/luocsuthoigian.webp',
  'lược sử loài người': '/anhbia/luocsuloainguoi.jpg',
  'sapiens': '/anhbia/luocsuloainguoi.jpg',
  'vật lý': '/anhbia/vatlydaicuong.png',
  'clean architecture': '/anhbia/CleanArchitecture.jpg',
  'clean code': '/anhbia/CleanArchitecture.jpg',
  'spring boot in action': '/anhbia/springbootinaction.webp',
  'spring in action': '/anhbia/springbootinaction.webp',
  'spring': '/anhbia/springboot.jpg',
  'cấu trúc dữ liệu': '/anhbia/cautrucdulieuvagiaithuat.jpg',
  'giải thuật': '/anhbia/cautrucdulieuvagiaithuat.jpg',
  'cơ sở dữ liệu': '/anhbia/cosodulieuquanhe.jpg',
  'mạng máy tính': '/anhbia/mangmaytinh.jpg',
  'java': '/anhbia/javacore.jpg',
}

function getBookCover(book) {
  if (book?.imgUrl) return book.imgUrl
  const lower = (book?.title || '').toLowerCase()
  for (const [key, url] of Object.entries(CURATED_COVERS)) {
    if (lower.includes(key)) return url
  }
  const cat = (book?.categoryName || '').toLowerCase()
  if (cat.includes('văn học') || cat.includes('tiểu thuyết')) {
    return '/anhbia/truyenkieu.webp'
  }
  if (cat.includes('lập trình') || cat.includes('công nghệ') || cat.includes('tin học')) {
    return '/anhbia/javacore.jpg'
  }
  if (cat.includes('khoa học') || cat.includes('toán') || cat.includes('vật lý')) {
    return '/anhbia/luocsuthoigian.webp'
  }
  return null
}

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const overdue = (record) =>
  Boolean(record?.overdue || (record?.status === 'BORROWED' && new Date(record?.dueDate) < new Date(new Date().toDateString())))

export default function CustomerDashboardPage() {
  const { user, can } = useAuth()
  const [activeTab, setActiveTab] = useState('CATEGORY') // 'CATEGORY' | 'AUTHOR' | 'POPULAR'
  const [tabData, setTabData] = useState({ CATEGORY: [], AUTHOR: [], POPULAR: [] })
  const [totalCatalogCount, setTotalCatalogCount] = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyBook, setBusyBook] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const historyPromise = can('BORROW_USE') ? borrowApi.history() : Promise.resolve([])
      const countPromise = can('BOOK_VIEW') ? booksApi.search({ page: 0, size: 1, status: 'IN_CIRCULATION' }) : Promise.resolve(null)
      const catalogPromise = can('BOOK_VIEW') ? booksApi.search({ page: 0, size: 100, status: 'IN_CIRCULATION' }) : Promise.resolve(null)

      const [histRes, countRes, catalogRes] = await Promise.allSettled([historyPromise, countPromise, catalogPromise])
      const userHistory = histRes.status === 'fulfilled' ? (histRes.value || []) : []
      setHistory(userHistory)

      if (countRes.status === 'fulfilled' && countRes.value?.totalElements != null) {
        setTotalCatalogCount(countRes.value.totalElements)
      }

      if (can('BOOK_VIEW')) {
        // Thu goi backend recommendations neu backend da khoi chay endpoint moi
        let backendData = null
        try {
          const [catRes, authRes, popRes] = await Promise.all([
            booksApi.getRecommendations('CATEGORY', 4),
            booksApi.getRecommendations('AUTHOR', 4),
            booksApi.getRecommendations('POPULAR', 4),
          ])
          if (Array.isArray(catRes) && catRes.length > 0) {
            backendData = {
              CATEGORY: catRes,
              AUTHOR: Array.isArray(authRes) && authRes.length > 0 ? authRes : catRes,
              POPULAR: Array.isArray(popRes) && popRes.length > 0 ? popRes : catRes,
            }
          }
        } catch {
          // Backend chua restart endpoint moi -> fallback client-side thong minh
        }

        if (backendData) {
          setTabData(backendData)
        } else {
          // Lay day du toan bo kho sach neu so luong sach lon hon 1 trang (size=10)
          let pool = (catalogRes.status === 'fulfilled' && catalogRes.value?.content) ? [...catalogRes.value.content] : []
          const totalPages = (catalogRes.status === 'fulfilled' && catalogRes.value?.totalPages) ? catalogRes.value.totalPages : 1

          if (totalPages > 1) {
            const extraPromises = []
            for (let p = 1; p < Math.min(totalPages, 10); p++) {
              extraPromises.push(booksApi.search({ page: p, size: 10, status: 'IN_CIRCULATION' }))
            }
            const extraResults = await Promise.allSettled(extraPromises)
            extraResults.forEach((r) => {
              if (r.status === 'fulfilled' && r.value?.content) {
                pool.push(...r.value.content)
              }
            })
          }

          // Danh sach nhan biet nhanh the loai/tac gia cho cac dau sach kinh dien
          const KNOWN_METADATA = {
            'tắt đèn': { category: 'Văn học', author: 'Ngô Tất Tố' },
            'số đỏ': { category: 'Văn học', author: 'Vũ Trọng Phụng' },
            'truyện kiều': { category: 'Văn học', author: 'Nguyễn Du' },
            'nhà giả kim': { category: 'Văn học', author: 'Paulo Coelho' },
            'giải tích': { category: 'Toán học', author: 'Bộ môn Toán' },
            'lược sử thời gian': { category: 'Khoa học', author: 'Stephen Hawking' },
            'vật lý': { category: 'Khoa học', author: 'Lương Duyên Bình' },
          }

          const activeBorrowId = userHistory.find((h) => h.status === 'BORROWED')?.bookId
          const borrowedBookIds = new Set(userHistory.map((h) => h.bookId))

          // Map ten sach da muon sang doi tuong sach de lay the loai va tac gia thuc te
          const bookMapById = new Map(pool.map((b) => [b.id, b]))
          const bookMapByTitle = new Map(pool.map((b) => [(b.title || '').trim().toLowerCase(), b]))

          const categoryScores = {}
          const authorScores = {}

          userHistory.forEach((h, idx) => {
            const rawTitle = (h.bookTitle || '').trim().toLowerCase()
            const matchedBook = bookMapById.get(h.bookId) || bookMapByTitle.get(rawTitle)
            const weight = idx < 5 ? 3 : 1

            if (matchedBook) {
              if (matchedBook.categoryName) {
                const cName = matchedBook.categoryName.trim()
                categoryScores[cName] = (categoryScores[cName] || 0) + weight * 10
              }
              if (matchedBook.authorNames && matchedBook.authorNames.length > 0) {
                matchedBook.authorNames.forEach((a) => {
                  const aName = a.trim()
                  authorScores[aName] = (authorScores[aName] || 0) + weight * 8
                })
              }
            } else {
              // Tra cuu qua bang fallback neu sach muon truoc do khong con trong pool
              for (const [key, meta] of Object.entries(KNOWN_METADATA)) {
                if (rawTitle.includes(key)) {
                  categoryScores[meta.category] = (categoryScores[meta.category] || 0) + weight * 10
                  authorScores[meta.author] = (authorScores[meta.author] || 0) + weight * 8
                  break
                }
              }
            }
          })

          // 1. TAB CATEGORY: The loai yeu thich
          const categoryBooks = pool
            .filter((b) => b.id !== activeBorrowId)
            .map((b) => {
              let score = 0
              const bCat = (b.categoryName || '').toLowerCase()
              Object.entries(categoryScores).forEach(([cName, s]) => {
                const cLower = cName.toLowerCase()
                if (bCat.includes(cLower) || cLower.includes(bCat)) {
                  score += s * 6
                }
              })
              if (!borrowedBookIds.has(b.id)) score += 15
              if (b.quantityAvailable > 0) score += 20
              return { ...b, score }
            })
            .sort((a, b) => b.score - a.score || b.id - a.id)
            .slice(0, 4)

          // 2. TAB AUTHOR: Tac gia thuong theo doi
          const authorBooks = pool
            .filter((b) => b.id !== activeBorrowId)
            .map((b) => {
              let score = 0
              if (b.authorNames && b.authorNames.length > 0) {
                b.authorNames.forEach((a) => {
                  const aLower = a.toLowerCase()
                  Object.entries(authorScores).forEach(([aName, s]) => {
                    const authLower = aName.toLowerCase()
                    if (aLower.includes(authLower) || authLower.includes(aLower)) {
                      score += s * 6
                    }
                  })
                })
              }
              if (!borrowedBookIds.has(b.id)) score += 15
              if (b.quantityAvailable > 0) score += 20
              return { ...b, score }
            })
            .sort((a, b) => b.score - a.score || b.id - a.id)
            .slice(0, 4)

          // 3. TAB POPULAR: Sach duoc yeu thich (muon nhieu nhat trong kho)
          const popularBooks = [...pool]
            .filter((b) => b.id !== activeBorrowId)
            .map((b) => {
              const borrowedCount = Math.max(0, (b.quantityTotal || 0) - (b.quantityAvailable || 0))
              const score = borrowedCount * 10 + (b.quantityTotal || 0)
              return { ...b, score }
            })
            .sort((a, b) => b.score - a.score || b.id - a.id)
            .slice(0, 4)

          setTabData({
            CATEGORY: categoryBooks,
            AUTHOR: authorBooks,
            POPULAR: popularBooks,
          })
        }
      }
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [can])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const activeLoans = history.filter((record) => record.status === 'BORROWED')
  const pendingLoans = history.filter((record) => record.status === 'PENDING')
  const activeLoan = activeLoans[0] || null
  const pendingLoan = pendingLoans[0] || null
  const totalActiveLoans = activeLoans.length + pendingLoans.length
  const reachedBorrowLimit = totalActiveLoans >= 2
  const hasExistingLoanOrPending = reachedBorrowLimit
  const recentLoans = useMemo(() => history.slice(0, 3), [history])
  const currentBooks = tabData[activeTab] || []
  const availableCount = currentBooks.filter((book) => book.quantityAvailable > 0).length
  const firstName = user?.email?.split('@')[0] || 'bạn đọc'

  const [requestingBook, setRequestingBook] = useState(null)
  const [requestedDueDate, setRequestedDueDate] = useState(getDefaultReturnDate())
  const [borrowSubmitting, setBorrowSubmitting] = useState(false)
  const [borrowModalError, setBorrowModalError] = useState('')

  const openBorrowModal = (book) => {
    setRequestingBook(book)
    setRequestedDueDate(getDefaultReturnDate())
    setBorrowModalError('')
  }

  const handleBorrowSubmit = async (e) => {
    e.preventDefault()
    if (!requestingBook) return
    setBorrowSubmitting(true)
    setBorrowModalError('')
    try {
      await borrowApi.borrow(requestingBook.id, requestedDueDate)
      setNotice(
        `Gửi yêu cầu mượn cuốn “${requestingBook.title}” thành công với ngày hẹn trả ${formatDate(
          requestedDueDate
        )}. Yêu cầu đang chờ thủ thư phê duyệt.`
      )
      setRequestingBook(null)
      await loadDashboard()
    } catch (err) {
      setBorrowModalError(readError(err))
    } finally {
      setBorrowSubmitting(false)
    }
  }

  return (
    <div className="customer-home">
      {/* 1. Hero Section: Neo-Editorial Digital Library */}
      <section className="neo-hero">
        <div className="neo-hero-content">
          <div className="neo-hero-eyebrow">
            <span className="neo-hero-eyebrow-dot" />
            <span>Thư viện Số & Khám phá Tri thức</span>
          </div>
          <h1 className="neo-hero-title">
            Chào {firstName}, <br />
            <span className="neo-hero-title-accent">hôm nay bạn muốn đọc gì?</span>
          </h1>
          <p className="neo-hero-desc">
            Khám phá kho tàng tài liệu học thuật, văn học kinh điển và công nghệ số. Đăng ký mượn tài liệu trực tuyến, theo dõi tiến trình đọc và mở rộng tư duy mỗi ngày.
          </p>
          <div className="neo-hero-actions">
            {can('BOOK_VIEW') && (
              <Link to="/catalog" className="neo-btn-primary">
                <SearchIcon width={16} height={16} /> Tra cứu danh mục sách
              </Link>
            )}
            {can('BORROW_USE') && (
              <Link to="/my-loans" className="neo-btn-secondary">
                <CirculationIcon width={16} height={16} /> Phiếu mượn ({totalActiveLoans}/2 cuốn)
              </Link>
            )}
          </div>
        </div>

        {/* Floating 3D Book Showcase */}
        <div className="neo-hero-showcase" aria-hidden="true">
          <div className="neo-floating-book-stage">
            <div className="neo-cover-item neo-cover-left">
              <img src="/anhbia/tatden.jpg" alt="Tắt đèn" />
            </div>
            <div className="neo-cover-item neo-cover-center">
              <img src="/anhbia/nhagiakim.jpg" alt="Nhà giả kim" />
            </div>
            <div className="neo-cover-item neo-cover-right">
              <img src="/anhbia/CleanArchitecture.jpg" alt="Clean Architecture" />
            </div>
          </div>
          <div className="neo-hero-badge">
            <BookIcon width={15} height={15} />
            <span>“Một cuốn sách hay, một ngày khác đi”</span>
          </div>
        </div>
      </section>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* 2. Architectural Statistics Section */}
      <section className="neo-stats-grid" aria-label="Thống kê hoạt động đọc">
        {can('BOOK_VIEW') && (
          <article className="neo-stat-card neo-stat-card-dark">
            <div className="neo-stat-header">
              <span className="neo-stat-label">Kho lưu trữ số</span>
              <div className="neo-stat-icon-wrap">
                <BookIcon width={18} height={18} />
              </div>
            </div>
            <div>
              <div className="neo-stat-value">
                {loading ? '…' : totalCatalogCount.toLocaleString('vi-VN')}
              </div>
              <div className="neo-stat-subtext">Đầu sách sẵn sàng cho bạn đọc</div>
            </div>
          </article>
        )}

        {can('BORROW_USE') && (
          <article className="neo-stat-card">
            <div className="neo-stat-header">
              <span className="neo-stat-label">Hạn mức mượn</span>
              <div className="neo-stat-icon-wrap" style={{ background: 'var(--neo-amber-light)', color: 'var(--neo-amber-600)' }}>
                <CirculationIcon width={18} height={18} />
              </div>
            </div>
            <div>
              <div className="neo-stat-value" style={{ color: totalActiveLoans >= 2 ? 'var(--neo-coral-600)' : 'var(--neo-ink-950)' }}>
                {loading ? '…' : `${String(totalActiveLoans).padStart(2, '0')} / 02`}
              </div>
              <div className="neo-stat-subtext">
                {totalActiveLoans >= 2
                  ? 'Đã đạt tối đa 2 cuốn theo quy định'
                  : totalActiveLoans === 1
                  ? 'Còn 1 lượt mượn sách khả dụng'
                  : 'Mượn tối đa 2 cuốn / 1 lần'}
              </div>
              <div className="neo-quota-indicator">
                <div className={`neo-quota-bar ${totalActiveLoans >= 1 ? 'filled' : 'available'}`} />
                <div className={`neo-quota-bar ${totalActiveLoans >= 2 ? 'filled' : 'available'}`} />
              </div>
            </div>
          </article>
        )}

        {can('BOOK_VIEW') && (
          <article className="neo-stat-card">
            <div className="neo-stat-header">
              <span className="neo-stat-label">Sẵn sàng phục vụ</span>
              <div className="neo-stat-icon-wrap" style={{ background: 'var(--neo-emerald-light)', color: 'var(--neo-emerald-600)' }}>
                <ClockIcon width={18} height={18} />
              </div>
            </div>
            <div>
              <div className="neo-stat-value" style={{ color: 'var(--neo-emerald-600)' }}>
                {loading ? '…' : availableCount.toLocaleString('vi-VN')}
              </div>
              <div className="neo-stat-subtext">
                <span className="neo-stock-dot" /> Cuốn sách khả dụng trong mục
              </div>
            </div>
          </article>
        )}
      </section>

      {/* 3. Current Loans Section */}
      {can('BORROW_USE') && (
        <section style={{ marginBottom: 44 }}>
          <div className="neo-section-title-wrap">
            <div>
              <h2 className="neo-section-title">
                {activeLoans.length > 0
                  ? `Sách đang mượn`
                  : pendingLoans.length > 0
                  ? `Yêu cầu mượn chờ duyệt`
                  : 'Sách đang mượn'}
                <span className="neo-section-badge">
                  {activeLoans.length > 0
                    ? `${activeLoans.length}/2 cuốn`
                    : pendingLoans.length > 0
                    ? `${pendingLoans.length} yêu cầu`
                    : '0 cuốn'}
                </span>
              </h2>
            </div>
            <Link to="/my-loans" className="neo-section-link">
              Quản lý tất cả phiếu mượn <ChevronRightIcon width={15} height={15} />
            </Link>
          </div>

          {loading ? (
            <Skeleton rows={2} />
          ) : activeLoans.length > 0 ? (
            <div>
              {activeLoans.map((loan) => (
                <article key={loan.id} className={`neo-loan-card ${overdue(loan) ? 'is-overdue' : ''}`}>
                  <div className="neo-loan-cover-wrap">
                    {loan.bookImgUrl || getBookCover({ title: loan.bookTitle }) ? (
                      <img src={loan.bookImgUrl || getBookCover({ title: loan.bookTitle })} alt={loan.bookTitle} />
                    ) : (
                      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>
                        <BookIcon width={24} height={24} />
                      </div>
                    )}
                  </div>
                  <div className="neo-loan-meta">
                    <div className="neo-loan-status-row">
                      <span className={`neo-status-pill ${overdue(loan) ? 'overdue' : 'reading'}`}>
                        <span className="neo-stock-dot" style={{ background: overdue(loan) ? 'var(--neo-coral-600)' : 'var(--neo-cobalt-600)' }} />
                        {overdue(loan) ? `Quá hạn ${loan.overdueDays || 1} ngày` : 'Đang mượn'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--neo-text-light)' }}>Mã phiếu #{loan.id}</span>
                    </div>
                    <h3 className="neo-loan-title">{loan.bookTitle}</h3>
                    <div className="neo-loan-date-text">
                      Mượn ngày {formatDate(loan.borrowDate)}
                      {overdue(loan) && loan.penaltyAmount && Number(loan.penaltyAmount) > 0 && (
                        <span style={{ color: 'var(--neo-coral-600)', fontWeight: 700, marginLeft: 10 }}>
                          · Phí phạt trễ: {Number(loan.penaltyAmount).toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="neo-loan-due-box">
                    <div className="neo-loan-due-text">
                      <span className="neo-loan-due-label">Hạn hoàn trả (10 ngày)</span>
                      <span className="neo-loan-due-val">{formatDate(loan.dueDate)}</span>
                    </div>
                    <Link to="/my-loans" className="btn btn-sm btn-secondary">
                      Xem phiếu mượn
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : pendingLoans.length > 0 ? (
            <div>
              {pendingLoans.map((pending) => (
                <article key={pending.id} className="neo-loan-card" style={{ borderColor: 'var(--neo-amber-500)', background: 'var(--neo-amber-light)' }}>
                  <div className="neo-loan-cover-wrap">
                    {pending.bookImgUrl || getBookCover({ title: pending.bookTitle }) ? (
                      <img src={pending.bookImgUrl || getBookCover({ title: pending.bookTitle })} alt={pending.bookTitle} />
                    ) : (
                      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>
                        <BookIcon width={24} height={24} />
                      </div>
                    )}
                  </div>
                  <div className="neo-loan-meta">
                    <div className="neo-loan-status-row">
                      <span className="neo-status-pill pending">
                        <span className="neo-stock-dot" style={{ background: 'var(--neo-amber-500)' }} />
                        Đang chờ thủ thư duyệt (1 – 3 ngày)
                      </span>
                    </div>
                    <h3 className="neo-loan-title">{pending.bookTitle}</h3>
                    <div className="neo-loan-date-text">
                      Đã gửi ngày {formatDate(pending.borrowDate)} · Hạn trả mong muốn: <strong style={{ color: 'var(--neo-cobalt-600)' }}>{formatDate(pending.dueDate)}</strong>
                    </div>
                  </div>
                  <div className="neo-loan-due-box">
                    <div className="neo-loan-due-text">
                      <span className="neo-loan-due-label">Dự kiến trả</span>
                      <span className="neo-loan-due-val">{formatDate(pending.dueDate)}</span>
                    </div>
                    <Link to="/my-loans" className="btn btn-sm btn-secondary">
                      Xem phiếu
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="neo-no-loan-banner">
              <div className="neo-no-loan-info">
                <div className="neo-no-loan-icon">
                  <BookIcon width={24} height={24} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Bạn chưa có sách đang mượn</h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--neo-text-muted)' }}>
                    Chọn một cuốn sách còn trên kệ để bắt đầu lượt đọc mới. Hạn mức mượn tối đa 2 cuốn trong 10 ngày.
                  </p>
                </div>
              </div>
              {can('BOOK_VIEW') && (
                <Link to="/catalog" className="btn btn-primary btn-sm">
                  Tìm sách ngay
                </Link>
              )}
            </div>
          )}
        </section>
      )}

      {/* 4. Book Recommendations Showcase */}
      {can('BOOK_VIEW') && (
        <section style={{ marginBottom: 44 }}>
          <div className="neo-section-title-wrap">
            <div>
              <h2 className="neo-section-title">
                Sách gợi ý hôm nay
                <span className="neo-section-badge">Tuyển chọn</span>
              </h2>
            </div>
            <Link to="/catalog" className="neo-section-link">
              Xem toàn bộ danh mục <ChevronRightIcon width={15} height={15} />
            </Link>
          </div>

          {/* 3 Tabs with Pill Design */}
          <div className="neo-tabs-bar" role="tablist" aria-label="Phân loại gợi ý">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'CATEGORY'}
              className={`neo-tab-btn ${activeTab === 'CATEGORY' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('CATEGORY')}
            >
              Thể loại yêu thích
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'AUTHOR'}
              className={`neo-tab-btn ${activeTab === 'AUTHOR' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('AUTHOR')}
            >
              Tác giả thường theo dõi
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'POPULAR'}
              className={`neo-tab-btn ${activeTab === 'POPULAR' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('POPULAR')}
            >
              Sách được yêu thích
            </button>
          </div>

          {loading ? (
            <Skeleton rows={4} />
          ) : currentBooks.length ? (
            <div className="neo-books-grid">
              {currentBooks.map((book) => {
                const coverUrl = getBookCover(book)
                const isAvailable = book.quantityAvailable > 0
                return (
                  <article className="neo-book-card" key={book.id}>
                    <div
                      className="neo-book-cover-frame"
                      onClick={() => openBorrowModal(book)}
                      title={`Xem chi tiết tác phẩm ${book.title}`}
                    >
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={book.title}
                          className="neo-book-cover-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.parentElement.querySelector('.neo-book-cover-fallback')
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className="neo-book-cover-fallback"
                        style={{
                          display: coverUrl ? 'none' : 'flex',
                          width: '100%',
                          height: '100%',
                          background: '#1e293b',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          gap: 8,
                        }}
                      >
                        <BookIcon width={32} height={32} />
                        <span style={{ fontSize: 11, fontWeight: 700 }}>THƯ VIỆN</span>
                      </div>
                      <span className="neo-category-badge">{book.categoryName || 'Chưa phân loại'}</span>
                    </div>

                    <div className="neo-book-body">
                      <h3
                        className="neo-book-title"
                        title={book.title}
                        onClick={() => openBorrowModal(book)}
                      >
                        {book.title}
                      </h3>
                      <p className="neo-book-author" title={(book.authorNames || []).join(', ')}>
                        {(book.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'}
                      </p>

                      <div className="neo-book-footer">
                        <span className="neo-stock-indicator">
                          <span className={`neo-stock-dot ${isAvailable ? '' : 'empty'}`} />
                          {isAvailable ? `Còn ${book.quantityAvailable} cuốn` : 'Hết sách'}
                        </span>

                        {can('BORROW_USE') && isAvailable && (
                          history.some((r) => (r.status === 'BORROWED' || r.status === 'PENDING') && r.bookId === book.id) ? (
                            <Link
                              to="/my-loans"
                              className="neo-borrow-btn neo-borrow-btn-muted"
                              title="Bạn đang mượn hoặc đang chờ duyệt cuốn sách này."
                            >
                              Đang giữ sách
                            </Link>
                          ) : reachedBorrowLimit ? (
                            <Link
                              to="/my-loans"
                              className="neo-borrow-btn neo-borrow-btn-muted"
                              title="Bạn đã đạt giới hạn tối đa 2 cuốn theo quy định thư viện."
                            >
                              Hết lượt (2/2)
                            </Link>
                          ) : (
                            <button
                              className="neo-borrow-btn neo-borrow-btn-primary"
                              type="button"
                              onClick={() => openBorrowModal(book)}
                            >
                              Mượn sách {totalActiveLoans === 1 ? '(2/2)' : ''}
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
            <div style={{ padding: '36px', background: '#ffffff', borderRadius: '20px', border: '1px solid var(--neo-border-paper)', textAlign: 'center', color: 'var(--neo-text-muted)' }}>
              {activeTab === 'CATEGORY'
                ? 'Chưa có sách phù hợp với thể loại bạn hay đọc. Bạn hãy khám phá thêm danh mục sách nhé.'
                : activeTab === 'AUTHOR'
                ? 'Chưa tìm thấy sách khác của các tác giả bạn đã mượn.'
                : 'Hiện chưa có đầu sách nổi bật. Hãy quay lại sau.'}
            </div>
          )}
        </section>
      )}

      {/* 5. Reading History Section */}
      {can('BORROW_USE') && recentLoans.length > 0 && (
        <section style={{ marginBottom: 44 }}>
          <div className="neo-section-title-wrap">
            <div>
              <h2 className="neo-section-title">
                Sách mượn gần đây
                <span className="neo-section-badge">Hành trình đọc</span>
              </h2>
            </div>
            <Link to="/my-loans" className="neo-section-link">
              Xem toàn bộ lịch sử <ChevronRightIcon width={15} height={15} />
            </Link>
          </div>
          <div className="neo-history-timeline">
            {recentLoans.map((record) => {
              const cover = record.bookImgUrl || getBookCover({ title: record.bookTitle })
              return (
                <div className="neo-history-item" key={record.id}>
                  {cover ? (
                    <img src={cover} alt={record.bookTitle} className="neo-history-thumb" />
                  ) : (
                    <div className="neo-history-thumb" style={{ background: '#1e293b', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
                      <BookIcon width={18} height={18} />
                    </div>
                  )}
                  <div className="neo-history-info">
                    <h4>{record.bookTitle}</h4>
                    <p>Mượn ngày {formatDate(record.borrowDate)} · Mã #{record.id}</p>
                  </div>
                  <span className={`badge ${record.status === 'BORROWED' ? (overdue(record) ? 'badge-danger' : 'badge-warn') : 'badge-ok'}`}>
                    {record.status === 'BORROWED' ? (overdue(record) ? 'Quá hạn' : 'Đang mượn') : 'Đã hoàn trả'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Borrow Request Modal with Return Date Selection */}
      {requestingBook && (
        <Modal
          title={`Đăng ký mượn: ${requestingBook.title}`}
          onClose={() => setRequestingBook(null)}
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRequestingBook(null)}
              disabled={borrowSubmitting}
            >
              Huỷ bỏ
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {borrowModalError && <Alert type="error">{borrowModalError}</Alert>}

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {getBookCover(requestingBook) ? (
                <img
                  src={getBookCover(requestingBook)}
                  alt={requestingBook.title}
                  style={{ width: 64, height: 90, objectFit: 'cover', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}
                />
              ) : (
                <div style={{ width: 64, height: 90, borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-default)', display: 'grid', placeItems: 'center', color: 'var(--color-text-tertiary)' }}>
                  <BookIcon width={24} height={24} />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>{requestingBook.title}</h3>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Tác giả: {(requestingBook.authorNames || []).join(', ') || 'Chưa cập nhật'}
                </div>
                <span className="badge badge-neutral">{requestingBook.categoryName || 'Chưa phân loại'}</span>
              </div>
            </div>

            <form onSubmit={handleBorrowSubmit}>
              {totalActiveLoans > 0 && (
                <div
                  style={{
                    fontSize: 12.5,
                    backgroundColor: 'var(--color-bg-subtle)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 10,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Bạn hiện đang có <strong>{totalActiveLoans}/2 cuốn</strong> (còn 1 lượt mượn khả dụng).
                </div>
              )}

              <div className="field" style={{ marginBottom: 12 }}>
                <label htmlFor="dash-modal-return-date" style={{ fontWeight: 600, fontSize: 13 }}>
                  Chọn ngày dự kiến hoàn trả sách:
                </label>
                <input
                  id="dash-modal-return-date"
                  type="date"
                  min={getMinReturnDate()}
                  max={getMaxReturnDate()}
                  value={requestedDueDate}
                  onChange={(e) => setRequestedDueDate(e.target.value)}
                  required
                  style={{ padding: '8px 12px', fontSize: 14 }}
                />
                <div className="field-hint" style={{ marginTop: 6, lineHeight: 1.45, fontSize: 12 }}>
                  • <strong>Thời hạn mượn:</strong> 10 ngày kể từ ngày nhận tài liệu.<br />
                  • <strong>Thời gian đáp ứng:</strong> 1 – 3 ngày làm việc.<br />
                  • <strong>Phí dịch vụ:</strong> 20.000 đ/lần mượn.<br />
                  • <strong>Phí trễ hạn:</strong> 5.000 đ/cuốn/ngày nếu quá hạn.
                </div>
              </div>

              {/* Quick Preset Buttons: 3, 5, 7, 10 days */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => setRequestedDueDate(getFutureDate(3))}
                >
                  +3 ngày
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => setRequestedDueDate(getFutureDate(5))}
                >
                  +5 ngày
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => setRequestedDueDate(getFutureDate(7))}
                >
                  +7 ngày
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-secondary"
                  onClick={() => setRequestedDueDate(getFutureDate(10))}
                >
                  +10 ngày (Tối đa)
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={borrowSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {borrowSubmitting ? 'Đang gửi yêu cầu...' : 'Xác nhận gửi yêu cầu mượn'}
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}
