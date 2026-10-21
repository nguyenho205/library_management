import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import Skeleton from '../components/Skeleton'
import { BookIcon, CirculationIcon, ClockIcon, ChevronRightIcon, SearchIcon } from '../components/Icons'

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const overdue = (record) =>
  record?.status === 'BORROWED' && new Date(record.dueDate) < new Date(new Date().toDateString())

export default function CustomerDashboardPage() {
  const { user, can } = useAuth()
  const [books, setBooks] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyBook, setBusyBook] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      can('BOOK_VIEW') ? booksApi.search({ page: 0, size: 4 }) : Promise.resolve(null),
      can('BORROW_USE') ? borrowApi.history() : Promise.resolve([]),
    ])
    if (results[0].status === 'fulfilled') setBooks(results[0].value)
    else setError(readError(results[0].reason))
    if (results[1].status === 'fulfilled') setHistory(results[1].value || [])
    else setError((current) => current || readError(results[1].reason))
    setLoading(false)
  }, [can])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const activeLoan = history.find((record) => record.status === 'BORROWED') || null
  const recentLoans = useMemo(() => history.slice(0, 3), [history])
  const availableCount = books?.content?.filter((book) => book.quantityAvailable > 0).length ?? 0
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
            <strong>{loading ? '…' : (books?.totalElements ?? 0).toLocaleString('vi-VN')}</strong>
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
            <span className="reader-stat-label">Có sẵn trên kệ</span>
            <strong>{loading ? '…' : availableCount.toLocaleString('vi-VN')}</strong>
            <span>Trong danh sách gợi ý hôm nay</span>
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
              <span className="reader-kicker">CHỌN CUỐN TIẾP THEO</span>
              <h2>Sách đang có tại thư viện</h2>
            </div>
            <Link to="/catalog" className="reader-text-link">Xem toàn bộ danh mục <ChevronRightIcon width={15} height={15} /></Link>
          </div>
          {loading ? <Skeleton rows={4} /> : books?.content?.length ? (
            <div className="reader-book-grid">
              {books.content.map((book, index) => (
                <article className="reader-book-card" key={book.id}>
                  <div className={`reader-cover reader-cover-${index % 4}`} aria-hidden="true">
                    <span>{book.categoryName || 'THƯ VIỆN'}</span>
                    <BookIcon width={25} height={25} />
                    <i />
                  </div>
                  <div className="reader-book-info">
                    <span className="reader-book-category">{book.categoryName || 'Chưa phân loại'}</span>
                    <h3 title={book.title}>{book.title}</h3>
                    <p>{(book.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'}</p>
                    <div className="reader-book-bottom">
                      <span className={book.quantityAvailable > 0 ? 'reader-available' : 'reader-unavailable'}>
                        {book.quantityAvailable > 0 ? `Còn ${book.quantityAvailable} cuốn` : 'Đang được mượn'}
                      </span>
                      {can('BORROW_USE') && book.quantityAvailable > 0 && !activeLoan && (
                        <button className="reader-borrow-btn" type="button" onClick={() => borrowBook(book)} disabled={busyBook === book.id}>
                          {busyBook === book.id ? 'Đang mượn…' : 'Mượn'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="reader-empty-books">Chưa có sách phù hợp để gợi ý. Hãy quay lại danh mục sau nhé.</div>
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
