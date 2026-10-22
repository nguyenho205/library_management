import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import Skeleton from '../components/Skeleton'
import { BookIcon, CirculationIcon, ClockIcon, ChevronRightIcon, SearchIcon } from '../components/Icons'

const CURATED_COVERS = {
  'tắt đèn': 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=500&q=80',
  'số đỏ': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80',
  'truyện kiều': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80',
  'nhà giả kim': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80',
  'giải tích': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80',
  'lược sử thời gian': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80',
  'vật lý': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&q=80',
  'java': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
  'spring': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80',
  'cấu trúc dữ liệu': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80',
  'cơ sở dữ liệu': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=500&q=80',
}

function getBookCover(book) {
  if (book?.imgUrl) return book.imgUrl
  const lower = (book?.title || '').toLowerCase()
  for (const [key, url] of Object.entries(CURATED_COVERS)) {
    if (lower.includes(key)) return url
  }
  const cat = (book?.categoryName || '').toLowerCase()
  if (cat.includes('văn học') || cat.includes('tiểu thuyết')) {
    return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80'
  }
  if (cat.includes('lập trình') || cat.includes('công nghệ') || cat.includes('tin học')) {
    return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80'
  }
  if (cat.includes('khoa học') || cat.includes('toán') || cat.includes('vật lý')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80'
  }
  return null
}

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const overdue = (record) =>
  record?.status === 'BORROWED' && new Date(record.dueDate) < new Date(new Date().toDateString())

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

  const activeLoan = history.find((record) => record.status === 'BORROWED') || null
  const recentLoans = useMemo(() => history.slice(0, 3), [history])
  const currentBooks = tabData[activeTab] || []
  const availableCount = currentBooks.filter((book) => book.quantityAvailable > 0).length
  const firstName = user?.email?.split('@')[0] || 'bạn đọc'

  const borrowBook = async (book) => {
    setError('')
    setNotice('')
    setBusyBook(book.id)
    try {
      await borrowApi.borrow(book.id)
      setNotice(`Bạn đã mượn “${book.title}”. Hạn trả sau 14 ngày.`)
      await loadDashboard()
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusyBook(null)
    }
  }

  return (
    <div className="customer-home">
      <section className="reader-hero">
        <div className="reader-hero-copy">
          <span className="reader-eyebrow">THƯ VIỆN TRỰC TUYẾN</span>
          <h1>Chào {firstName}, hôm nay bạn muốn đọc gì?</h1>
          <p>Tìm một cuốn sách mới, theo dõi hạn trả và xem lại hành trình đọc của bạn tại thư viện.</p>
          <div className="reader-hero-actions">
            {can('BOOK_VIEW') && (
              <Link to="/catalog" className="btn reader-primary-btn">
                <SearchIcon width={16} height={16} /> Tra cứu sách
              </Link>
            )}
            {can('BORROW_USE') && (
              <Link to="/my-loans" className="reader-secondary-link">
                Mượn và trả sách <ChevronRightIcon width={15} height={15} />
              </Link>
            )}
          </div>
        </div>
        <div className="reader-hero-art" aria-hidden="true">
          <div className="reader-book reader-book-one"><span>NHỮNG TRANG<br />ĐANG CHỜ BẠN</span></div>
          <div className="reader-book reader-book-two"><span>GÓC ĐỌC<br />CỦA RIÊNG MÌNH</span></div>
          <div className="reader-book reader-book-three"><span>THƯ VIỆN<br />MỖI NGÀY</span></div>
          <div className="reader-art-note"><BookIcon width={17} height={17} /> Một cuốn sách hay, một ngày khác đi</div>
        </div>
      </section>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <section className="reader-stats" aria-label="Tóm tắt hoạt động đọc">
        {can('BOOK_VIEW') && (
          <article className="reader-stat">
            <span className="reader-stat-label">Đầu sách trong thư viện</span>
            <strong>{loading ? '…' : totalCatalogCount.toLocaleString('vi-VN')}</strong>
            <span>Đang chờ bạn khám phá</span>
          </article>
        )}
        {can('BORROW_USE') && (
          <article className="reader-stat reader-stat-accent">
            <span className="reader-stat-label">Đang mượn</span>
            <strong>{loading ? '…' : activeLoan ? '01' : '00'}</strong>
            <span>{activeLoan ? 'Nhớ trả sách đúng hạn nhé' : 'Bạn có thể chọn sách để mượn'}</span>
          </article>
        )}
        {can('BOOK_VIEW') && (
          <article className="reader-stat">
            <span className="reader-stat-label">Có sẵn trong mục</span>
            <strong>{loading ? '…' : availableCount.toLocaleString('vi-VN')}</strong>
            <span>Cuốn sách sẵn sàng cho mượn</span>
          </article>
        )}
      </section>

      {can('BORROW_USE') && (
        <section className="reader-loan-section">
          <div className="reader-section-heading">
            <div>
              <span className="reader-kicker">GÓC CỦA BẠN</span>
              <h2>Cuốn sách đang mượn</h2>
            </div>
            <Link to="/my-loans" className="reader-text-link">Lịch sử mượn <ChevronRightIcon width={15} height={15} /></Link>
          </div>
          {loading ? <Skeleton rows={2} /> : activeLoan ? (
            <article className={`reader-current-loan ${overdue(activeLoan) ? 'is-overdue' : ''}`}>
              <div className="reader-loan-mark"><CirculationIcon width={23} height={23} /></div>
              <div className="reader-loan-copy">
                <span className={`badge ${overdue(activeLoan) ? 'badge-danger' : 'badge-warn'}`}>
                  {overdue(activeLoan) ? 'Quá hạn trả' : 'Đang đọc'}
                </span>
                <h3>{activeLoan.bookTitle}</h3>
                <p>Mượn ngày {formatDate(activeLoan.borrowDate)}</p>
              </div>
              <div className="reader-due-date">
                <span><ClockIcon width={15} height={15} /> Hạn trả</span>
                <strong>{formatDate(activeLoan.dueDate)}</strong>
              </div>
              <Link to="/my-loans" className="btn btn-secondary btn-sm">Xem phiếu mượn</Link>
            </article>
          ) : (
            <article className="reader-no-loan">
              <div className="reader-loan-mark"><BookIcon width={23} height={23} /></div>
              <div>
                <h3>Bạn chưa có sách đang mượn</h3>
                <p>Chọn một cuốn sách còn trên kệ để bắt đầu lượt đọc tiếp theo.</p>
              </div>
              {can('BOOK_VIEW') && <Link to="/catalog" className="btn btn-primary btn-sm">Tìm sách</Link>}
            </article>
          )}
        </section>
      )}

      {can('BOOK_VIEW') && (
        <section className="reader-discover-section">
          <div className="reader-section-heading">
            <div>
              <span className="reader-kicker">GỢI Ý PHÙ HỢP VỚI BẠN</span>
              <h2>Sách gợi ý hôm nay</h2>
            </div>
            <Link to="/catalog" className="reader-text-link">Xem toàn bộ danh mục <ChevronRightIcon width={15} height={15} /></Link>
          </div>

          {/* 3 Tabs lua chon goi y */}
          <div className="recommendation-tabs-nav" role="tablist" aria-label="Phân loại gợi ý">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'CATEGORY'}
              className={`recommendation-tab-btn ${activeTab === 'CATEGORY' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('CATEGORY')}
            >
              Thể loại yêu thích
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'AUTHOR'}
              className={`recommendation-tab-btn ${activeTab === 'AUTHOR' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('AUTHOR')}
            >
              Tác giả thường theo dõi
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'POPULAR'}
              className={`recommendation-tab-btn ${activeTab === 'POPULAR' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('POPULAR')}
            >
              Sách được yêu thích
            </button>
          </div>

          {loading ? (
            <Skeleton rows={4} />
          ) : currentBooks.length ? (
            <div className="ecommerce-book-grid">
              {currentBooks.map((book) => {
                const coverUrl = getBookCover(book)
                return (
                  <article className="ecommerce-book-card" key={book.id}>
                    <div className="ecommerce-cover-frame">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={book.title}
                          className="ecommerce-cover-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.parentElement.querySelector('.ecommerce-cover-fallback')
                            if (fallback) fallback.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className="ecommerce-cover-fallback"
                        style={{ display: coverUrl ? 'none' : 'flex' }}
                      >
                        <BookIcon width={34} height={34} />
                        <span>{book.categoryName || 'THƯ VIỆN'}</span>
                      </div>
                      <span className="ecommerce-cat-pill">{book.categoryName || 'Chưa phân loại'}</span>
                    </div>

                    <div className="ecommerce-card-content">
                      <h3 className="ecommerce-book-title" title={book.title}>
                        {book.title}
                      </h3>
                      <p className="ecommerce-book-author" title={(book.authorNames || []).join(', ')}>
                        {(book.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'}
                      </p>

                      <div className="ecommerce-card-bottom">
                        <span className={`stock-status ${book.quantityAvailable > 0 ? 'is-available' : 'is-empty'}`}>
                          <span className="stock-dot" />
                          {book.quantityAvailable > 0 ? `Còn ${book.quantityAvailable} cuốn` : 'Hết sách'}
                        </span>
                        {can('BORROW_USE') && book.quantityAvailable > 0 && !activeLoan && (
                          <button
                            className="btn btn-sm btn-primary ecommerce-borrow-btn"
                            type="button"
                            onClick={() => borrowBook(book)}
                            disabled={busyBook === book.id}
                          >
                            {busyBook === book.id ? 'Đang mượn…' : 'Mượn sách'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="reader-empty-books">
              {activeTab === 'CATEGORY'
                ? 'Chưa có sách phù hợp với thể loại bạn hay đọc. Bạn hãy khám phá thêm danh mục sách nhé.'
                : activeTab === 'AUTHOR'
                ? 'Chưa tìm thấy sách khác của các tác giả bạn đã mượn.'
                : 'Hiện chưa có đầu sách nổi bật. Hãy quay lại sau.'}
            </div>
          )}
        </section>
      )}

      {can('BORROW_USE') && recentLoans.length > 0 && (
        <section className="reader-history-section">
          <div className="reader-section-heading">
            <div>
              <span className="reader-kicker">NHỮNG TRANG ĐÃ ĐỌC</span>
              <h2>Hoạt động gần đây</h2>
            </div>
            <Link to="/my-loans" className="reader-text-link">Mở lịch sử <ChevronRightIcon width={15} height={15} /></Link>
          </div>
          <div className="reader-history-list">
            {recentLoans.map((record) => (
              <div className="reader-history-row" key={record.id}>
                <span className="reader-history-icon"><BookIcon width={17} height={17} /></span>
                <div><strong>{record.bookTitle}</strong><span>Mượn {formatDate(record.borrowDate)}</span></div>
                <span className={`badge ${record.status === 'BORROWED' ? (overdue(record) ? 'badge-danger' : 'badge-warn') : 'badge-ok'}`}>
                  {record.status === 'BORROWED' ? (overdue(record) ? 'Quá hạn' : 'Đang mượn') : 'Đã trả'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
