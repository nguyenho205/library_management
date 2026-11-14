import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { ratingsApi } from '../api/ratings'
import { readError } from '../api/errors'
import Alert from '../components/Alert'
import { BookIcon, ChevronRightIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { resolveBookCover } from './bookUtils'
import CustomerBorrowModal from './CustomerBorrowModal'
import BookRatingEditor from './BookRatingEditor'

const MAX_DISPLAYED_BOOK_COVERS = 10

export default function CustomerBookDetailPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const [book, setBook] = useState(null)
  const [loans, setLoans] = useState([])
  const [ratingSummary, setRatingSummary] = useState(null)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadDetail = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bookResult, loanResult, ratingResult] = await Promise.all([
        booksApi.getById(bookId),
        can('BORROW_USE') ? borrowApi.history().catch(() => []) : Promise.resolve([]),
        ratingsApi.forBook(bookId).catch(() => null),
      ])
      setBook(bookResult)
      setLoans(loanResult || [])
      setRatingSummary(ratingResult)
    } catch (err) {
      setError(readError(err) || 'Không tải được thông tin sách.')
    } finally {
      setLoading(false)
    }
  }, [bookId, can])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    let active = true
    const refreshInventory = () => {
      if (document.visibilityState !== 'visible') return
      booksApi.getById(bookId).then((latestBook) => {
        if (active) setBook(latestBook)
      }).catch(() => {})
    }
    const interval = window.setInterval(refreshInventory, 15000)
    window.addEventListener('focus', refreshInventory)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshInventory)
    }
  }, [bookId])

  const activeLoans = loans.filter((loan) => loan.status === 'BORROWED' || loan.status === 'PENDING')
  const hasExistingLoan = activeLoans.some((loan) => String(loan.bookId) === String(bookId))
  const cover = book ? resolveBookCover(book) : null
  const available = book?.quantityAvailable > 0 && book?.status === 'IN_CIRCULATION'
  const availableCopies = Math.max(0, Number(book?.quantityAvailable) || 0)
  const displayedCopies = Math.min(availableCopies, MAX_DISPLAYED_BOOK_COVERS)
  const returnedLoan = loans.find((loan) => String(loan.bookId) === String(bookId) && loan.status === 'RETURNED')

  const handleBorrowSuccess = async (borrowedBook, dueDate) => {
    setBorrowOpen(false)
    setNotice(`Đã gửi yêu cầu mượn “${borrowedBook.title}”. Hạn trả dự kiến: ${dueDate}.`)
    await loadDetail()
  }

  if (loading) {
    return (
      <main className="customer-book-detail-page">
        <div className="book-detail-loading" aria-label="Đang tải thông tin sách">
          <div />
          <div />
        </div>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="customer-book-detail-page">
        <Link to="/catalog" className="book-detail-back">‹ Quay lại kho sách</Link>
        <Alert type="error">{error || 'Không tìm thấy cuốn sách này.'}</Alert>
      </main>
    )
  }

  return (
    <main className="customer-book-detail-page">
      <nav className="book-detail-breadcrumb" aria-label="Điều hướng">
        <Link to="/">Trang chủ</Link>
        <ChevronRightIcon width={14} height={14} />
        <Link to="/catalog">Kho sách</Link>
        <ChevronRightIcon width={14} height={14} />
        <span>{book.title}</span>
      </nav>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <section className="book-detail-layout">
        <div className="book-detail-art">
          <div className="book-detail-cover-wrap">
            {availableCopies > 0 ? (
              <div className="book-detail-stock-stack" role="img" aria-label={`${displayedCopies} ảnh bìa minh họa cho ${availableCopies} cuốn ${book.title} đang có sẵn`}>
                {Array.from({ length: displayedCopies }, (_, index) => (
                  <div
                    className="book-detail-stock-copy"
                    key={`${book.id}-copy-${index}`}
                    style={{
                      '--copy-x': `${index * 8}px`,
                      '--copy-y': `${index * -6}px`,
                      '--copy-order': index + 1,
                      animationDelay: `${Math.min(index * 35, 350)}ms`,
                    }}
                  >
                    {cover ? (
                      <img src={cover} alt="" aria-hidden="true" />
                    ) : (
                      <div className="book-detail-cover-fallback book-detail-copy-fallback" aria-hidden="true">
                        <BookIcon width={54} height={54} />
                        <span>{book.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="book-detail-cover-fallback" role="img" aria-label="Hiện không có bản sách sẵn có">
                <BookIcon width={54} height={54} />
                <span>{availableCopies === 0 ? 'Hiện không có bản sẵn có' : book.title}</span>
              </div>
            )}
          </div>
          <div className={`book-detail-availability ${available ? 'is-available' : 'is-unavailable'}`}>
            <span />
            {available ? `Còn ${book.quantityAvailable} / ${book.quantityTotal} cuốn` : 'Hiện không có sẵn để mượn'}
          </div>
        </div>

        <div className="book-detail-copy">
          <span className="book-detail-kicker">{book.categoryName || 'Ấn phẩm thư viện'}</span>
          <h1>{book.title}</h1>
          <p className="book-detail-authors">
            {(book.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'}
          </p>

          <div className="book-detail-facts">
            {book.isbn && <div><span>ISBN</span><strong>{book.isbn}</strong></div>}
            <div><span>Mã sách</span><strong>#{book.id}</strong></div>
            <div><span>Tình trạng</span><strong>{book.status === 'IN_CIRCULATION' ? 'Đang lưu hành' : 'Ngừng lưu hành'}</strong></div>
          </div>

          <div className="book-detail-description">
            <h2>Giới thiệu sách</h2>
            <p>{book.description || 'Thư viện chưa cập nhật phần giới thiệu cho cuốn sách này.'}</p>
          </div>

          <div className="book-detail-actions">
            {can('BORROW_USE') && (
              <button type="button" className="book-detail-borrow" disabled={!available || hasExistingLoan} onClick={() => setBorrowOpen(true)}>
                {hasExistingLoan ? 'Bạn đã đăng ký mượn sách này' : available ? 'Đăng ký mượn sách' : 'Sách hiện không có sẵn'}
              </button>
            )}
            <button type="button" className="book-detail-return" onClick={() => navigate('/catalog')}>
              Quay lại kho sách
            </button>
          </div>

          <section className="book-rating-section" id="ratings">
            <div className="book-rating-section__heading">
              <div><span className="book-detail-kicker">CỘNG ĐỒNG ĐỌC SÁCH</span><h2>Đánh giá & cảm nhận</h2></div>
              <div className="book-rating-average"><strong>{Number(ratingSummary?.averageRating || 0).toFixed(1)}</strong><span className="book-rating-average__stars">{'★'.repeat(Math.round(ratingSummary?.averageRating || 0))}{'☆'.repeat(5 - Math.round(ratingSummary?.averageRating || 0))}</span><small>{ratingSummary?.ratingCount || 0} đánh giá</small></div>
            </div>
            {returnedLoan && can('BORROW_USE') ? (
              <BookRatingEditor bookId={book.id} borrowRecordId={returnedLoan.id} existing={ratingSummary?.myScore ? { score: ratingSummary.myScore, comment: ratingSummary.myComment } : null} onSaved={() => ratingsApi.forBook(book.id).then(setRatingSummary).catch(() => {})} />
            ) : can('BORROW_USE') ? <p className="book-rating-eligibility">Bạn có thể đánh giá sau khi mượn và hoàn trả cuốn sách này.</p> : null}
            <div className="book-rating-reviews">
              {(ratingSummary?.reviews || []).length ? ratingSummary.reviews.map((review) => (
                <article className="book-rating-review" key={review.id}>
                  <div className="book-rating-review__head"><strong>{review.reviewerName || 'Bạn đọc'}</strong><span>{'★'.repeat(review.score)}{'☆'.repeat(5 - review.score)}</span></div>
                  <time>{new Date(review.updatedAt || review.createdAt).toLocaleDateString('vi-VN')}</time>
                  {review.comment && <p>{review.comment}</p>}
                </article>
              )) : <p className="book-rating-eligibility">Cuốn sách chưa có đánh giá. Hãy là người đầu tiên chia sẻ cảm nhận.</p>}
            </div>
          </section>
        </div>
      </section>

      {borrowOpen && (
        <CustomerBorrowModal
          book={book}
          user={user}
          totalActiveLoans={activeLoans.length}
          hasExistingLoanOrPending={hasExistingLoan}
          onClose={() => setBorrowOpen(false)}
          onSuccess={handleBorrowSuccess}
        />
      )}
    </main>
  )
}
