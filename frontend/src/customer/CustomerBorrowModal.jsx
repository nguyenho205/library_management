import { useState } from 'react'
import { Link } from 'react-router-dom'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import Modal from '../components/Modal'
import Alert from '../components/Alert'
import { BookIcon, ClockIcon, CheckCircleIcon } from '../components/Icons'
import { resolveBookCover, getMinReturnDate, getMaxReturnDate, getDefaultReturnDate, getFutureDate, formatDate } from './bookUtils'

export default function CustomerBorrowModal({
  book,
  user,
  totalActiveLoans = 0,
  hasExistingLoanOrPending = false,
  onClose,
  onSuccess,
}) {
  const [requestedDueDate, setRequestedDueDate] = useState(getDefaultReturnDate())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')

  if (!book) return null

  const coverUrl = resolveBookCover(book)
  const reachedBorrowLimit = totalActiveLoans >= 2

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setSuccessNotice('')
    setSubmitting(true)

    try {
      await borrowApi.borrow(book.id, requestedDueDate)
      setSuccessNotice(`Yêu cầu mượn cuốn “${book.title}” đã được gửi thành công. Hẹn trả: ${formatDate(requestedDueDate)}.`)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(book, requestedDueDate)
        }, 1200)
      }
    } catch (err) {
      setError(readError(err) || 'Không thể gửi yêu cầu mượn sách. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Đăng Ký Mượn Sách Trực Tuyến"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
          {successNotice ? 'Đóng cửa sổ' : 'Hủy bỏ'}
        </button>
      }
    >
      <div className="customer-borrow-modal-body">
        {error && <Alert type="error">{error}</Alert>}
        {successNotice && <Alert type="success">{successNotice}</Alert>}

        {/* Book Overview Card */}
        <div className="customer-modal-book-card">
          <div className="customer-modal-cover-frame">
            {coverUrl ? (
              <img src={coverUrl} alt={book.title} className="customer-modal-cover-img" />
            ) : (
              <div className="customer-modal-cover-fallback">
                <BookIcon width={32} height={32} />
              </div>
            )}
          </div>

          <div className="customer-modal-book-meta">
            <span className="customer-category-badge">{book.categoryName || 'Sách tổng hợp'}</span>
            <h3 className="customer-modal-book-title">{book.title}</h3>
            <p className="customer-modal-book-author">
              Tác giả: <strong>{(book.authorNames || []).join(', ') || 'Chưa cập nhật'}</strong>
            </p>
            {book.isbn && (
              <span className="customer-modal-isbn">Mã ISBN: {book.isbn}</span>
            )}
            <div className="customer-modal-stock-status">
              <span className={`customer-stock-dot ${book.quantityAvailable > 0 ? 'available' : 'empty'}`} />
              <span>
                {book.quantityAvailable > 0 ? `Còn ${book.quantityAvailable} / ${book.quantityTotal || 1} cuốn sẵn sàng` : 'Tạm hết sách'}
              </span>
            </div>
          </div>
        </div>

        {/* User state checks */}
        {!user ? (
          <div className="customer-modal-guest-callout">
            <p>Bạn cần đăng nhập tài khoản bạn đọc để đăng ký mượn cuốn sách này.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Link to="/login" className="btn btn-primary btn-sm">Đăng nhập</Link>
              <Link to="/register" className="btn btn-secondary btn-sm">Tạo thẻ bạn đọc</Link>
            </div>
          </div>
        ) : hasExistingLoanOrPending ? (
          <div className="customer-modal-warn-callout">
            <strong>Bạn đang giữ hoặc đang chờ duyệt cuốn sách này.</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              Vui lòng kiểm tra lại trong mục <Link to="/my-loans">Sổ Mượn Sách</Link> để theo dõi hạn hoàn trả.
            </p>
          </div>
        ) : reachedBorrowLimit ? (
          <div className="customer-modal-warn-callout">
            <strong>Hạn mức mượn sách đã đạt tối đa (02/02 cuốn).</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              Theo quy định thư viện, bạn vui lòng hoàn trả ít nhất một cuốn sách đang mượn trước khi đăng ký mượn thêm.
            </p>
          </div>
        ) : book.quantityAvailable <= 0 ? (
          <div className="customer-modal-warn-callout" style={{ borderColor: 'var(--neo-coral-500)', background: '#fff5f5' }}>
            <strong style={{ color: 'var(--neo-coral-600)' }}>Cuốn sách này hiện tạm hết trên kệ.</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              Bạn đọc khác đang mượn toàn bộ số bản có sẵn. Vui lòng quay lại sau khi sách được hoàn trả.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="customer-modal-form">
            <div className="customer-quota-notice">
              <span>Hạn mức hiện tại: <strong>{totalActiveLoans}/02 cuốn</strong> (Còn {2 - totalActiveLoans} lượt mượn khả dụng).</span>
            </div>

            <div className="field">
              <label htmlFor="customer-return-date-input" style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--neo-ink-950)' }}>
                Chọn ngày dự kiến hoàn trả sách:
              </label>
              <input
                id="customer-return-date-input"
                type="date"
                min={getMinReturnDate()}
                max={getMaxReturnDate()}
                value={requestedDueDate}
                onChange={(e) => setRequestedDueDate(e.target.value)}
                required
                className="customer-date-picker"
              />
            </div>

            {/* Quick preset buttons */}
            <div className="customer-date-presets">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--neo-text-light)' }}>Chọn nhanh:</span>
              <button
                type="button"
                className="customer-preset-chip"
                onClick={() => setRequestedDueDate(getFutureDate(3))}
              >
                +3 ngày
              </button>
              <button
                type="button"
                className="customer-preset-chip"
                onClick={() => setRequestedDueDate(getFutureDate(5))}
              >
                +5 ngày
              </button>
              <button
                type="button"
                className="customer-preset-chip"
                onClick={() => setRequestedDueDate(getFutureDate(7))}
              >
                +7 ngày
              </button>
              <button
                type="button"
                className="customer-preset-chip"
                onClick={() => setRequestedDueDate(getFutureDate(10))}
              >
                +10 ngày (Tối đa)
              </button>
            </div>

            {/* Circulation Guidelines Hint */}
            <div className="customer-modal-policy-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5, color: 'var(--neo-cobalt-700)', marginBottom: 4 }}>
                <ClockIcon width={14} height={14} /> Quy chuẩn lưu thông & mượn sách
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: 'var(--neo-text-muted)' }}>
                <li>Thời hạn mượn: Tối đa <strong>10 ngày</strong> kể từ khi tiếp nhận tài liệu.</li>
                <li>Thời gian xử lý: Thủ thư tiếp nhận & chuẩn bị sách trong <strong>1 – 3 ngày làm việc</strong>.</li>
                <li>Phí dịch vụ mượn sách: <strong>20.000 đ/lần</strong>. Phí trễ hạn: <strong>5.000 đ/cuốn/ngày</strong>.</li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-primary customer-modal-submit-btn"
              disabled={submitting || Boolean(successNotice)}
            >
              {submitting ? 'Đang gửi yêu cầu mượn...' : successNotice ? 'Đã gửi yêu cầu thành công' : 'Xác nhận đăng ký mượn sách'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}

