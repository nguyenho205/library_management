import { useCallback, useEffect, useState } from 'react'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import DueStamp from '../components/DueStamp'
import Pagination from '../components/Pagination'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import {
  SearchIcon,
  CirculationIcon,
  CheckCircleIcon,
  BookIcon,
  ClockIcon,
} from '../components/Icons'

function formatDate(iso) {
  if (!iso) return 'Chưa cập nhật'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const isOverdue = (record) =>
  record.status === 'BORROWED' && new Date(record.dueDate) < new Date(new Date().toDateString())

export default function CirculationPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [books, setBooks] = useState(null)
  const [title, setTitle] = useState('')
  const [appliedTitle, setAppliedTitle] = useState('')
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [loadingBooks, setLoadingBooks] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await borrowApi.history())
    } catch (err) {
      setError(readError(err))
    }
  }, [])

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true)
    try {
      const params = { page, size: 10 }
      if (appliedTitle) params.title = appliedTitle
      setBooks(await booksApi.search(params))
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoadingBooks(false)
    }
  }, [page, appliedTitle])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  const current = history.find((r) => r.status === 'BORROWED')

  const borrow = async (book) => {
    setError('')
    setNotice('')
    setBusyId(book.id)
    try {
      await borrowApi.borrow(book.id)
      setNotice(`Mượn thành công cuốn "${book.title}". Thời hạn mượn là 14 ngày kể từ hôm nay.`)
      await Promise.all([loadHistory(), loadBooks()])
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusyId(null)
    }
  }

  const giveBack = async () => {
    if (!current) return
    setError('')
    setNotice('')
    setBusyId('return')
    try {
      await borrowApi.giveBack(current.id)
      setNotice(`Đã hoàn tất trả cuốn "${current.bookTitle}". Thư viện cảm ơn bạn đã giữ gìn tài liệu.`)
      await Promise.all([loadHistory(), loadBooks()])
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusyId(null)
    }
  }

  const search = (e) => {
    e.preventDefault()
    setPage(0)
    setAppliedTitle(title)
  }

  const resetSearch = () => {
    setTitle('')
    setAppliedTitle('')
    setPage(0)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mượn và trả sách</h1>
          <p>Quy định thư viện: Mỗi độc giả mượn 1 cuốn tại một thời điểm trong 14 ngày. Trả sách để mượn cuốn tiếp theo.</p>
        </div>
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Currently Borrowed Book Section */}
      {user && (
        <section style={{ marginBottom: 32 }}>
          <h2>Cuốn sách đang mượn</h2>
          {current ? (
            <div className={`circulation-slip ${isOverdue(current) ? 'slip-danger' : 'slip-primary'}`}>
              <div className="slip-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <DueStamp dueDate={current.dueDate} overdue={isOverdue(current)} />
                  {isOverdue(current) && (
                    <span className="badge badge-danger">
                      <ClockIcon width={12} height={12} />
                      Đã quá hạn trả
                    </span>
                  )}
                </div>
                <div className="slip-book">{current.bookTitle}</div>
                <div className="slip-meta">
                  Ngày mượn: <span className="data">{formatDate(current.borrowDate)}</span>
                  {isOverdue(current) && (
                    <span style={{ color: 'var(--color-danger-text)', fontWeight: 600, marginLeft: 8 }}>
                      Vui lòng hoàn trả sớm để tránh phát sinh chế tài mượn sách.
                    </span>
                  )}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={giveBack}
                disabled={busyId === 'return'}
                type="button"
              >
                {busyId === 'return' ? 'Đang xác nhận trả...' : 'Trả cuốn sách này'}
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-default)',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-brand-surface)',
                  color: 'var(--color-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BookIcon width={18} height={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Hiện tại bạn không mượn cuốn sách nào
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                  Bạn có thể chọn một cuốn sách khả dụng trong danh sách dưới đây để mượn đọc.
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Available Books Section */}
      <section style={{ marginBottom: 36 }}>
        <h2>Sách khả dụng để mượn</h2>
        <form className="toolbar" onSubmit={search}>
          <div className="field">
            <label htmlFor="c-title">Tìm kiếm sách</label>
            <input
              id="c-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên sách cần tra cứu..."
            />
          </div>
          <div className="toolbar-actions">
            <button className="btn btn-primary" type="submit">
              <SearchIcon width={14} height={14} />
              Tìm kiếm
            </button>
            {appliedTitle && (
              <button className="btn btn-ghost" type="button" onClick={resetSearch}>
                Xoá lọc
              </button>
            )}
          </div>
        </form>

        {loadingBooks && !books ? (
          <Skeleton rows={5} />
        ) : books && books.content.length === 0 ? (
          <EmptyState
            icon="search"
            title="Không tìm thấy cuốn sách nào"
            description="Hãy thử tìm kiếm với từ khoá khác hoặc kiểm tra lại tên tác phẩm."
            action={
              appliedTitle ? (
                <button className="btn btn-secondary" onClick={resetSearch}>
                  Xoá từ khoá tìm kiếm
                </button>
              ) : null
            }
          />
        ) : (
          books && (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tên tác phẩm & Tác giả</th>
                      <th style={{ width: 170 }}>Thể loại</th>
                      <th style={{ width: 140 }}>Khả dụng</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.content.map((b) => {
                      const isUnavailable = b.quantityAvailable <= 0
                      const hasActiveBorrow = Boolean(current)
                      const isBusy = busyId === b.id

                      return (
                        <tr key={b.id}>
                          <td>
                            <div className="title">{b.title}</div>
                            <div className="book-authors">{(b.authorNames || []).join(', ') || 'Chưa có tác giả'}</div>
                          </td>
                          <td>
                            <span className="badge badge-neutral">{b.categoryName || 'Chưa phân loại'}</span>
                          </td>
                          <td>
                            <span className={`badge ${b.quantityAvailable > 0 ? 'badge-ok' : 'badge-danger'}`}>
                              <span className="badge-dot" />
                              {b.quantityAvailable > 0 ? `Còn ${b.quantityAvailable} cuốn` : 'Đã hết sách'}
                            </span>
                          </td>
                          <td className="col-actions">
                            <button
                              className="btn btn-small btn-primary"
                              disabled={isUnavailable || hasActiveBorrow || isBusy}
                              title={
                                hasActiveBorrow
                                  ? 'Bạn cần trả cuốn sách đang mượn trước khi mượn cuốn mới'
                                  : isUnavailable
                                  ? 'Sách này hiện đã được mượn hết trong kho'
                                  : 'Mượn cuốn sách này trong 14 ngày'
                              }
                              onClick={() => borrow(b)}
                              type="button"
                            >
                              {isBusy ? 'Đang mượn...' : 'Mượn sách'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={books.page}
                totalPages={books.totalPages}
                totalElements={books.totalElements}
                onChange={setPage}
              />
            </>
          )
        )}
      </section>

      {/* Borrowing History */}
      {user && (
        <section>
          <h2>Lịch sử mượn trả của bạn</h2>
          {history.length === 0 ? (
            <EmptyState
              icon="circulation"
              title="Chưa có lượt mượn nào"
              description="Các cuốn sách bạn mượn và hoàn trả sẽ được lưu lại toàn bộ tại đây để tiện theo dõi."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tên sách</th>
                    <th style={{ width: 130 }}>Ngày mượn</th>
                    <th style={{ width: 130 }}>Hạn hoàn trả</th>
                    <th style={{ width: 130 }}>Ngày thực trả</th>
                    <th style={{ width: 130 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((r) => {
                    const overdue = isOverdue(r)
                    return (
                      <tr key={r.id}>
                        <td className="title">{r.bookTitle}</td>
                        <td className="num">{formatDate(r.borrowDate)}</td>
                        <td className="num">{formatDate(r.dueDate)}</td>
                        <td className="num">{r.returnDate ? formatDate(r.returnDate) : 'Đang giữ sách'}</td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === 'RETURNED'
                                ? 'badge-neutral'
                                : overdue
                                ? 'badge-danger'
                                : 'badge-warn'
                            }`}
                          >
                            <span className="badge-dot" />
                            {r.status === 'RETURNED'
                              ? 'Đã hoàn trả'
                              : overdue
                              ? 'Quá hạn'
                              : 'Đang mượn'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  )
}
