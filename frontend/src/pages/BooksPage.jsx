import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import client from '../api/client'
import { readError } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import {
  PlusIcon,
  UploadIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  BookIcon,
  FilterIcon,
  ArchiveIcon,
  RefreshIcon,
  ClockIcon,
  ChevronRightIcon,
  CirculationIcon,
} from '../components/Icons'

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

function resolveBookCover(book) {
  if (book?.imgUrl) return book.imgUrl
  const title = (book?.title || '').toLowerCase()
  for (const [key, url] of Object.entries(CURATED_COVERS)) {
    if (title.includes(key)) return url
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

function formatDate(iso) {
  if (!iso) return 'Chưa cập nhật'
  const parts = String(iso).split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return iso
}

const EMPTY_FORM = { isbn: '', title: '', description: '', quantityTotal: 1, categoryId: '', authorNames: '', imgUrl: '' }
const EMPTY_FILTERS = { title: '', isbn: '', author: '', categoryId: '' }

export default function BooksPage({ adminMode = false }) {
  const navigate = useNavigate()
  const { can, isAdmin, isLibrarian: authIsLibrarian, user } = useAuth() || {}
  const isLibrarian = Boolean(authIsLibrarian || isAdmin || user?.role === 'ADMIN')
  const canCreate = adminMode && can('BOOK_CREATE')
  const canImport = adminMode && can('BOOK_IMPORT')
  const canEdit = adminMode && can('BOOK_UPDATE')
  const canDelete = adminMode && can('BOOK_DELETE')
  const hasActions = canEdit || canDelete

  const [statusTab, setStatusTab] = useState('IN_CIRCULATION') // 'IN_CIRCULATION' | 'DISCONTINUED'
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  // Customer loan status tracking
  const [userLoans, setUserLoans] = useState([])

  const [editing, setEditing] = useState(null) // null | {id?, ...form}
  const [importing, setImporting] = useState(false)
  const [statusChangingBook, setStatusChangingBook] = useState(null)
  const [statusBusy, setStatusBusy] = useState(false)
  const [deletingBook, setDeletingBook] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [viewingBook, setViewingBook] = useState(null)

  // Borrow request modal state
  const [borrowModalBook, setBorrowModalBook] = useState(null)
  const [requestedDueDate, setRequestedDueDate] = useState(getDefaultReturnDate())
  const [borrowSubmitting, setBorrowSubmitting] = useState(false)
  const [borrowError, setBorrowError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const effectiveStatus = adminMode && (isAdmin || isLibrarian) ? statusTab : 'IN_CIRCULATION'
      const params = { page, size: adminMode ? 10 : 8, status: effectiveStatus }
      Object.entries(applied).forEach(([k, v]) => v && (params[k] = v))
      setData(await booksApi.search(params))
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [applied, page, statusTab, adminMode, isAdmin, isLibrarian])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    client
      .get('/categories')
      .then((r) => setCategories(r.data.data))
      .catch(() => {})
  }, [])

  // Load customer borrowing history to detect if user has active or pending loan
  const loadUserLoans = useCallback(async () => {
    if (user && can('BORROW_USE')) {
      try {
        const history = await borrowApi.history()
        setUserLoans(history || [])
      } catch {
        // silent
      }
    }
  }, [user, can])

  useEffect(() => {
    loadUserLoans()
  }, [loadUserLoans])

  const search = (e) => {
    e.preventDefault()
    setPage(0)
    setApplied(filters)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(0)
  }

  const removeSingleFilter = (key) => {
    const updated = { ...applied, [key]: '' }
    setFilters((prev) => ({ ...prev, [key]: '' }))
    setApplied(updated)
    setPage(0)
  }

  const confirmRemove = async () => {
    if (!deletingBook) return
    setDeleteBusy(true)
    try {
      await booksApi.remove(deletingBook.id)
      setNotice(`Đã xoá sách "${deletingBook.title}" khỏi danh mục.`)
      setDeletingBook(null)
      load()
    } catch (err) {
      setError(readError(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!statusChangingBook) return
    setStatusBusy(true)
    setError('')
    try {
      if (statusChangingBook.status === 'DISCONTINUED') {
        await booksApi.restore(statusChangingBook.id)
        setNotice(`Đã khôi phục phát hành cho sách "${statusChangingBook.title}".`)
      } else {
        await booksApi.discontinue(statusChangingBook.id)
        setNotice(`Đã chuyển sách "${statusChangingBook.title}" sang trạng thái ngừng lưu hành.`)
      }
      setStatusChangingBook(null)
      load()
    } catch (err) {
      setError(readError(err))
    } finally {
      setStatusBusy(false)
    }
  }

  const openEdit = (book) =>
    setEditing({
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      description: book.description || '',
      quantityTotal: book.quantityTotal,
      categoryId: book.categoryId || '',
      authorNames: (book.authorNames || []).join(', '),
      imgUrl: book.imgUrl || '',
    })

  // Open detail / borrow modal
  const openBookDetail = (book) => {
    setViewingBook(book)
    setBorrowModalBook(book)
    setRequestedDueDate(getDefaultReturnDate())
    setBorrowError('')
  }

  const handleBorrowSubmit = async (e) => {
    e.preventDefault()
    if (!borrowModalBook) return
    if (!user) {
      navigate('/login')
      return
    }
    setBorrowSubmitting(true)
    setBorrowError('')
    try {
      await borrowApi.borrow(borrowModalBook.id, requestedDueDate)
      setNotice(
        `Gửi yêu cầu mượn cuốn "${borrowModalBook.title}" thành công với ngày hẹn trả ${formatDate(
          requestedDueDate
        )}. Yêu cầu đang chờ thủ thư phê duyệt.`
      )
      setViewingBook(null)
      setBorrowModalBook(null)
      await Promise.all([load(), loadUserLoans()])
    } catch (err) {
      setBorrowError(readError(err))
    } finally {
      setBorrowSubmitting(false)
    }
  }

  const hasActiveFilters = Boolean(applied.title || applied.isbn || applied.author || applied.categoryId)
  const activeBorrowedList = userLoans.filter((r) => r.status === 'BORROWED')
  const pendingBorrowedList = userLoans.filter((r) => r.status === 'PENDING')
  const totalActiveLoans = activeBorrowedList.length + pendingBorrowedList.length
  const reachedBorrowLimit = totalActiveLoans >= 2
  const hasExistingLoanOrPending = reachedBorrowLimit
  const isAlreadyBorrowingThisBook = viewingBook
    ? userLoans.some((r) => (r.status === 'BORROWED' || r.status === 'PENDING') && r.bookId === viewingBook.id)
    : false

  // Render thumbnail helper
  const renderThumbnail = (book, width = 36, height = 50) => {
    const cover = resolveBookCover(book)
    if (cover) {
      return (
        <img
          src={cover}
          alt={book.title}
          style={{
            width,
            height,
            objectFit: 'cover',
            borderRadius: 'var(--radius-xs)',
            flexShrink: 0,
            boxShadow: 'var(--shadow-xs)',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'grid'
            }
          }}
        />
      )
    }
    return (
      <div
        style={{
          width,
          height,
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border-default)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-text-tertiary)',
          flexShrink: 0,
        }}
      >
        <BookIcon width={16} height={16} />
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{adminMode && isAdmin ? 'Quản lý danh mục sách' : 'Tra cứu & Khám phá sách'}</h1>
        </div>
        {(canImport || canCreate) && (
          <div className="page-actions">
            {canImport && (
              <button className="btn btn-secondary" onClick={() => setImporting(true)} type="button">
                <UploadIcon width={15} height={15} />
                Nhập từ CSV
              </button>
            )}
            {canCreate && (
              <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY_FORM })} type="button">
                <PlusIcon width={16} height={16} />
                Thêm sách mới
              </button>
            )}
          </div>
        )}
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Segmented Status Tabs: Phat hanh vs Ngung luu hanh (Admin Only) */}
      {adminMode && (isAdmin || isLibrarian) && (
        <div className="segmented-tabs" role="tablist" aria-label="Bộ lọc trạng thái phát hành sách">
          <button
            type="button"
            role="tab"
            aria-selected={statusTab === 'IN_CIRCULATION'}
            className={`segmented-tab ${statusTab === 'IN_CIRCULATION' ? 'active' : ''}`}
            onClick={() => {
              if (statusTab !== 'IN_CIRCULATION') {
                setStatusTab('IN_CIRCULATION')
                setPage(0)
              }
            }}
          >
            <span>Đang phát hành</span>
            {statusTab === 'IN_CIRCULATION' && data?.totalElements != null && (
              <span className="segmented-tab-count">{data.totalElements}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusTab === 'DISCONTINUED'}
            className={`segmented-tab ${statusTab === 'DISCONTINUED' ? 'active' : ''}`}
            onClick={() => {
              if (statusTab !== 'DISCONTINUED') {
                setStatusTab('DISCONTINUED')
                setPage(0)
              }
            }}
          >
            <span>Ngừng lưu hành</span>
            {statusTab === 'DISCONTINUED' && data?.totalElements != null && (
              <span className="segmented-tab-count">{data.totalElements}</span>
            )}
          </button>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <form className="toolbar" onSubmit={search}>
        <div className="field">
          <label htmlFor="f-title">Tên sách</label>
          <input
            id="f-title"
            value={filters.title}
            onChange={(e) => setFilters({ ...filters, title: e.target.value })}
            placeholder="Tìm theo tên sách..."
          />
        </div>
        <div className="field field-narrow">
          <label htmlFor="f-isbn">Mã ISBN</label>
          <input
            id="f-isbn"
            value={filters.isbn}
            onChange={(e) => setFilters({ ...filters, isbn: e.target.value })}
            placeholder="ISBN..."
          />
        </div>
        <div className="field">
          <label htmlFor="f-author">Tác giả</label>
          <input
            id="f-author"
            value={filters.author}
            onChange={(e) => setFilters({ ...filters, author: e.target.value })}
            placeholder="Tên tác giả..."
          />
        </div>
        <div className="field">
          <label htmlFor="f-cat">Thể loại</label>
          <select
            id="f-cat"
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
          >
            <option value="">Tất cả thể loại</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn btn-primary" type="submit">
            <SearchIcon width={14} height={14} />
            Tìm kiếm
          </button>
          {hasActiveFilters && (
            <button className="btn btn-ghost" type="button" onClick={resetFilters}>
              Xoá lọc
            </button>
          )}
        </div>
      </form>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Bộ lọc đang áp dụng:</span>
          {applied.title && (
            <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Tiêu đề: {applied.title}
              <button
                type="button"
                onClick={() => removeSingleFilter('title')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </span>
          )}
          {applied.author && (
            <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Tác giả: {applied.author}
              <button
                type="button"
                onClick={() => removeSingleFilter('author')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </span>
          )}
          {applied.isbn && (
            <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ISBN: {applied.isbn}
              <button
                type="button"
                onClick={() => removeSingleFilter('isbn')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </span>
          )}
          {applied.categoryId && (
            <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Thể loại: {categories.find((c) => String(c.id) === String(applied.categoryId))?.name || applied.categoryId}
              <button
                type="button"
                onClick={() => removeSingleFilter('categoryId')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-brand)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Bỏ tất cả lọc
          </button>
        </div>
      )}

      {loading && !data ? (
        <Skeleton rows={6} />
      ) : data && data.content.length === 0 ? (
        <EmptyState
          icon="book"
          title="Không tìm thấy cuốn sách nào"
          description={
            hasActiveFilters
              ? 'Không có cuốn sách nào khớp với các điều kiện lọc đang chọn. Hãy thử nới lỏng bộ lọc.'
              : 'Hiện chưa có đầu sách nào trong kho lưu trữ của thư viện.'
          }
          action={
            hasActiveFilters ? (
              <button className="btn btn-secondary" onClick={resetFilters}>
                Bỏ các điều kiện lọc
              </button>
            ) : canCreate ? (
              <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY_FORM })}>
                <PlusIcon width={15} height={15} /> Thêm cuốn sách đầu tiên
              </button>
            ) : null
          }
        />
      ) : data && (
        <>
          {adminMode ? (
            /* =========================================================================
               ADMIN MODE: COMPACT TABLE WITH PRESERVED THUMBNAILS & ACTIONS
               ========================================================================= */
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Bìa</th>
                    <th style={{ width: 140 }}>ISBN</th>
                    <th>Tác phẩm & Tác giả</th>
                    <th style={{ width: 160 }}>Thể loại</th>
                    <th style={{ width: 180 }}>Trạng thái & Tồn kho</th>
                    {hasActions && <th style={{ width: 180, textAlign: 'right' }}>Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((b) => (
                    <tr key={b.id}>
                      <td>{renderThumbnail(b, 36, 50)}</td>
                      <td className="data">{b.isbn}</td>
                      <td>
                        <div
                          className="title"
                          style={{ cursor: 'pointer' }}
                          onClick={() => openBookDetail(b)}
                          title="Bấm để xem chi tiết tác phẩm"
                        >
                          {b.title}
                        </div>
                        <div className="book-authors">
                          {(b.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'}
                        </div>
                      </td>
                      <td>
                        {b.categoryName ? (
                          <span className="badge badge-neutral">{b.categoryName}</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>Chưa phân loại</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                          {b.status === 'DISCONTINUED' ? (
                            <span className="badge badge-neutral">
                              <span className="badge-dot" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
                              Ngừng lưu hành
                            </span>
                          ) : (
                            <span className={`badge ${b.quantityAvailable > 0 ? 'badge-ok' : 'badge-danger'}`}>
                              <span className="badge-dot" />
                              {b.quantityAvailable > 0 ? 'Đang phát hành' : 'Hết hàng'}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {b.quantityAvailable > 0
                              ? `Còn ${b.quantityAvailable} / ${b.quantityTotal} cuốn`
                              : '0 cuốn khả dụng'}
                          </span>
                        </div>
                      </td>
                      {hasActions && (
                        <td className="col-actions">
                          <div className="table-action-group">
                            {canEdit && (
                              <button
                                className="btn btn-small"
                                onClick={() => openEdit(b)}
                                title="Chỉnh sửa thông tin"
                                aria-label={`Sửa sách ${b.title}`}
                                type="button"
                              >
                                <EditIcon width={13} height={13} />
                                <span>Sửa</span>
                              </button>
                            )}
                            {canEdit && b.status === 'DISCONTINUED' && (
                              <button
                                className="btn btn-small"
                                onClick={() => setStatusChangingBook(b)}
                                title="Khôi phục lưu hành"
                                aria-label={`Tái phát hành sách ${b.title}`}
                                type="button"
                                style={{ color: 'var(--color-success)', borderColor: 'var(--color-success-border)' }}
                              >
                                <RefreshIcon width={13} height={13} />
                                <span>Phát hành lại</span>
                              </button>
                            )}
                            {canEdit && b.status !== 'DISCONTINUED' && (
                              <button
                                className="btn btn-small"
                                onClick={() => setStatusChangingBook(b)}
                                title="Ngừng lưu hành sách"
                                aria-label={`Ngừng lưu hành sách ${b.title}`}
                                type="button"
                                style={{ color: 'var(--color-warn)', borderColor: 'var(--color-warn-border)' }}
                              >
                                <ArchiveIcon width={13} height={13} />
                                <span>Ngừng lưu hành</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => setDeletingBook(b)}
                                title="Xoá cuốn sách này"
                                aria-label={`Xoá sách ${b.title}`}
                                type="button"
                              >
                                <TrashIcon width={13} height={13} />
                                <span>Xoá</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* =========================================================================
               CUSTOMER MODE: HORIZONTAL-CARD BOOK LIST CATALOG (Section 4)
               ========================================================================= */
            <div className="customer-catalog-list">
              {data.content.map((b) => {
                const cover = resolveBookCover(b)
                const isAvailable = b.quantityAvailable > 0
                return (
                  <article className="catalog-horizontal-card" key={b.id} onClick={() => openBookDetail(b)}>
                    <div className="catalog-card-cover-wrap">
                      {cover ? (
                        <img
                          src={cover}
                          alt={b.title}
                          className="catalog-card-cover"
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
                        <span>{b.categoryName || 'THƯ VIỆN'}</span>
                      </div>
                    </div>

                    <div className="catalog-card-content">
                      <div className="catalog-card-header">
                        <div className="catalog-card-tags">
                          <span className="badge badge-neutral">{b.categoryName || 'Chưa phân loại'}</span>
                          <span className="catalog-card-isbn">ISBN: {b.isbn}</span>
                        </div>
                      </div>

                      <h3 className="catalog-card-title">{b.title}</h3>
                      <p className="catalog-card-author">
                        Tác giả: <strong>{(b.authorNames || []).join(', ') || 'Chưa cập nhật'}</strong>
                      </p>

                      <p className="catalog-card-desc">
                        {b.description
                          ? b.description
                          : 'Tác phẩm đang được lưu trữ và phục vụ bạn đọc tại thư viện. Mở xem chi tiết để chọn ngày mượn phù hợp.'}
                      </p>

                      <div className="catalog-card-footer">
                        <span className={`badge ${isAvailable ? 'badge-ok' : 'badge-danger'}`}>
                          <span className="badge-dot" />
                          {isAvailable ? `Còn ${b.quantityAvailable} cuốn` : 'Tạm hết sách'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary catalog-card-action"
                          onClick={(e) => {
                            e.stopPropagation()
                            openBookDetail(b)
                          }}
                        >
                          <span>{isAvailable && !hasExistingLoanOrPending ? 'Xem chi tiết & Mượn' : 'Xem chi tiết'}</span>
                          <ChevronRightIcon width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            onChange={setPage}
          />
        </>
      )}

      {/* =========================================================================
          POLISHED CUSTOMER BOOK DETAIL & BORROW MODAL (Section 5 & 7)
          ========================================================================= */}
      {viewingBook && (
        <Modal
          title={`Chi tiết tác phẩm: ${viewingBook.title}`}
          onClose={() => setViewingBook(null)}
          footer={
            <button type="button" className="btn btn-secondary" onClick={() => setViewingBook(null)}>
              Đóng cửa sổ
            </button>
          }
        >
          <div className="book-detail-modal-layout">
            <div className="book-detail-cover-pane">
              {resolveBookCover(viewingBook) ? (
                <img
                  src={resolveBookCover(viewingBook)}
                  alt={viewingBook.title}
                  className="book-detail-large-cover"
                />
              ) : (
                <div className="book-detail-fallback-cover">
                  <BookIcon width={48} height={48} />
                  <span>{viewingBook.categoryName || 'THƯ VIỆN'}</span>
                </div>
              )}
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <span className={`badge ${viewingBook.quantityAvailable > 0 ? 'badge-ok' : 'badge-danger'}`}>
                  <span className="badge-dot" />
                  {viewingBook.quantityAvailable > 0
                    ? `Còn ${viewingBook.quantityAvailable} / ${viewingBook.quantityTotal} cuốn`
                    : 'Đã hết sách trong kho'}
                </span>
              </div>
            </div>

            <div className="book-detail-info-pane">
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span className="badge badge-neutral">{viewingBook.categoryName || 'Chưa phân loại'}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>Mã ISBN: {viewingBook.isbn}</span>
                </div>
                <h2 style={{ fontSize: 20, marginBottom: 4 }}>{viewingBook.title}</h2>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  Tác giả: <strong>{(viewingBook.authorNames || []).join(', ') || 'Chưa cập nhật'}</strong>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Tóm tắt nội dung
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {viewingBook.description || 'Chưa có thông tin mô tả chi tiết cho cuốn sách này.'}
                </p>
              </div>

              {/* Borrowing Request Workflow Box (Section 6 & 7) */}
              <div className="book-detail-borrow-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CirculationIcon width={18} height={18} />
                  <strong style={{ fontSize: 15 }}>Đăng ký mượn cuốn sách này</strong>
                </div>

                {borrowError && <Alert type="error" style={{ marginBottom: 10 }}>{borrowError}</Alert>}

                {!user ? (
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Bạn cần đăng nhập để gửi yêu cầu mượn cuốn sách này.{' '}
                    <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                      Đăng nhập ngay →
                    </Link>
                  </div>
                ) : viewingBook.quantityAvailable <= 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--color-danger-text)' }}>
                    Sách hiện đã hết trong kho. Bạn hãy quay lại sau khi có bạn đọc khác hoàn trả.
                  </div>
                ) : isAlreadyBorrowingThisBook ? (
                  <div style={{ fontSize: 13, color: 'var(--color-warn-text)', lineHeight: 1.5 }}>
                    Bạn đang mượn hoặc đang có yêu cầu chờ duyệt cuốn sách này rồi.
                    <div style={{ marginTop: 6 }}>
                      <Link to="/my-loans" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                        Mở trang Mượn và trả sách để kiểm tra →
                      </Link>
                    </div>
                  </div>
                ) : reachedBorrowLimit ? (
                  <div style={{ fontSize: 13, color: 'var(--color-warn-text)', lineHeight: 1.5 }}>
                    Theo quy định của thư viện, mỗi bạn đọc được mượn <strong>tối đa 2 cuốn / 1 lần mượn</strong>. Hiện bạn đã có <strong>{totalActiveLoans} cuốn</strong> (đang mượn hoặc chờ duyệt). Vui lòng hoàn tất trả sách trước khi mượn tiếp.
                    <div style={{ marginTop: 6 }}>
                      <Link to="/my-loans" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                        Mở trang Mượn và trả sách để kiểm tra →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBorrowSubmit} style={{ marginTop: 8 }}>
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
                        Bạn đang có <strong>{totalActiveLoans}/2 cuốn</strong> (còn 1 lượt mượn khả dụng).
                      </div>
                    )}

                    <div className="field" style={{ marginBottom: 12 }}>
                      <label htmlFor="borrow-due-date" style={{ fontWeight: 600, fontSize: 13 }}>
                        Chọn ngày dự kiến hoàn trả sách:
                      </label>
                      <input
                        id="borrow-due-date"
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

                    {/* Quick duration selector chips: 3, 5, 7, 10 days */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
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
                      {borrowSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu mượn sách'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Book Modal (Admin Only) */}
      {editing && (
        <BookFormModal
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null)
            setNotice(msg)
            load()
          }}
        />
      )}

      {/* Import CSV Modal (Admin Only) */}
      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onDone={(msg) => {
            setImporting(false)
            setNotice(msg)
            setPage(0)
            load()
          }}
        />
      )}

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(statusChangingBook)}
        title={
          statusChangingBook?.status === 'DISCONTINUED'
            ? 'Xác nhận tái phát hành sách'
            : 'Xác nhận ngừng lưu hành sách'
        }
        message={
          statusChangingBook?.status === 'DISCONTINUED'
            ? `Bạn có chắc chắn muốn khôi phục phát hành cuốn sách "${statusChangingBook?.title}"? Độc giả sẽ có thể tìm kiếm và mượn sách bình thường nếu kho còn sách.`
            : `Bạn có chắc chắn muốn ngừng lưu hành cuốn sách "${statusChangingBook?.title}"? Độc giả sẽ không thể mượn sách này nữa. Các lượt mượn hiện tại vẫn có thể hoàn trả bình thường.`
        }
        confirmLabel={statusChangingBook?.status === 'DISCONTINUED' ? 'Tái phát hành' : 'Ngừng lưu hành'}
        isDanger={statusChangingBook?.status !== 'DISCONTINUED'}
        busy={statusBusy}
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusChangingBook(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingBook)}
        title="Xác nhận xoá sách"
        message={`Bạn có chắc chắn muốn xoá cuốn sách "${deletingBook?.title}" (ISBN: ${deletingBook?.isbn}) khỏi danh mục hệ thống?`}
        confirmLabel="Xoá cuốn sách"
        isDanger={true}
        busy={deleteBusy}
        onConfirm={confirmRemove}
        onCancel={() => setDeletingBook(null)}
      />
    </>
  )
}

const AVAILABLE_COVERS = [
  { label: 'Tắt đèn', path: '/anhbia/tatden.jpg' },
  { label: 'Số đỏ', path: '/anhbia/sodo.webp' },
  { label: 'Truyện Kiều', path: '/anhbia/truyenkieu.webp' },
  { label: 'Nhà giả kim', path: '/anhbia/nhagiakim.jpg' },
  { label: 'Đắc nhân tâm', path: '/anhbia/dacnhantam.jpg' },
  { label: 'Dế mèn phiêu lưu ký', path: '/anhbia/demenphieuluuky.jpg' },
  { label: 'Clean Architecture', path: '/anhbia/CleanArchitecture.jpg' },
  { label: 'Java Core', path: '/anhbia/javacore.jpg' },
  { label: 'Spring Boot in Action', path: '/anhbia/springbootinaction.webp' },
  { label: 'Spring Boot', path: '/anhbia/springboot.jpg' },
  { label: 'Cấu trúc dữ liệu & giải thuật', path: '/anhbia/cautrucdulieuvagiaithuat.jpg' },
  { label: 'Cơ sở dữ liệu quan hệ', path: '/anhbia/cosodulieuquanhe.jpg' },
  { label: 'Mạng máy tính', path: '/anhbia/mangmaytinh.jpg' },
  { label: 'Giải tích 1', path: '/anhbia/giaitich1.jpg' },
  { label: 'Lược sử thời gian', path: '/anhbia/luocsuthoigian.webp' },
  { label: 'Lược sử loài người', path: '/anhbia/luocsuloainguoi.jpg' },
  { label: 'Vật lý đại cương', path: '/anhbia/vatlydaicuong.png' },
]

function BookFormModal({ initial, categories, onClose, onSaved }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  const isEdit = Boolean(initial.id)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const link = await booksApi.uploadCover(file)
      setForm((prev) => ({ ...prev, imgUrl: link }))
    } catch (err) {
      setUploadError(readError(err) || 'Không thể tải ảnh bìa lên máy chủ.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      isbn: form.isbn.trim(),
      title: form.title.trim(),
      description: form.description,
      quantityTotal: Number(form.quantityTotal),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      authorNames: form.authorNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imgUrl: form.imgUrl && form.imgUrl.trim() ? form.imgUrl.trim() : null,
    }
    try {
      if (isEdit) await booksApi.update(initial.id, payload)
      else await booksApi.create(payload)
      onSaved(isEdit ? 'Đã cập nhật thông tin sách thành công.' : 'Đã thêm sách mới vào danh mục.')
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Chỉnh sửa thông tin sách' : 'Thêm sách mới vào danh mục'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Huỷ bỏ
          </button>
          <button type="submit" form="book-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm sách'}
          </button>
        </>
      }
    >
      <form id="book-form" onSubmit={save}>
        {error && <Alert type="error">{error}</Alert>}

        <div className="field-row">
          <div className="field">
            <label htmlFor="b-isbn">Mã chuẩn ISBN</label>
            <input
              id="b-isbn"
              value={form.isbn}
              onChange={set('isbn')}
              placeholder="Ví dụ: 978-0132350884"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="b-qty">Tổng số cuốn</label>
            <input
              id="b-qty"
              type="number"
              min="0"
              value={form.quantityTotal}
              onChange={set('quantityTotal')}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="b-title">Tiêu đề sách</label>
          <input
            id="b-title"
            value={form.title}
            onChange={set('title')}
            placeholder="Nhập tên đầy đủ của tác phẩm"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="b-cat">Thể loại</label>
          <select id="b-cat" value={form.categoryId} onChange={set('categoryId')} required>
            <option value="">Chọn thể loại phù hợp</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <div className="field-hint">Chưa có thể loại nào. Nhập sách từ file CSV để tự động tạo thể loại.</div>
          )}
        </div>

        <div className="field">
          <label htmlFor="b-authors">Tác giả</label>
          <input
            id="b-authors"
            value={form.authorNames}
            onChange={set('authorNames')}
            placeholder="Robert C. Martin, Martin Fowler"
          />
        </div>

        <div className="field">
          <label>Ảnh bìa sách</label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Khung hiển thị ảnh bìa xem trước */}
            <div
              style={{
                width: 70,
                height: 98,
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-bg-subtle)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {form.imgUrl ? (
                <img
                  src={form.imgUrl}
                  alt="Ảnh bìa"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: 11, padding: 4 }}>
                  Chưa có ảnh bìa
                </div>
              )}
            </div>

            {/* Vùng chọn tệp và chọn mẫu ảnh bìa */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || busy}
                >
                  <UploadIcon width={14} height={14} />
                  {uploading ? 'Đang tải tệp lên...' : 'Chọn tệp ảnh bìa từ máy...'}
                </button>

                {form.imgUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '6px 10px', fontSize: 12, color: 'var(--color-danger)' }}
                    onClick={() => setForm((prev) => ({ ...prev, imgUrl: '' }))}
                  >
                    Xoá ảnh
                  </button>
                )}
              </div>

              {/* Danh sách ảnh bìa có sẵn trong public/anhbia */}
              {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  style={{ fontSize: 12, padding: '6px 8px', borderRadius: 'var(--radius-xs)' }}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setForm((prev) => ({ ...prev, imgUrl: e.target.value }))
                    }
                  }}
                >
                  <option value="">Hoặc chọn nhanh từ kho ảnh bìa có sẵn trong thư viện...</option>
                  {AVAILABLE_COVERS.map((c) => (
                    <option key={c.path} value={c.path}>
                      {c.label} ({c.path})
                    </option>
                  ))}
                </select>
              </div> */}

              {/* Đường dẫn link lưu trữ trong CSDL */}
              <input
                id="b-img"
                value={form.imgUrl}
                onChange={set('imgUrl')}
                placeholder="Đường dẫn link ảnh bìa (ví dụ: /anhbia/tatden.jpg)"
                style={{ fontSize: 12 }}
              />

              {uploadError && <div style={{ color: 'var(--color-danger)', fontSize: 12 }}>{uploadError}</div>}
            </div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="b-desc">Tóm tắt / Mô tả nội dung</label>
          <textarea
            id="b-desc"
            rows="3"
            value={form.description}
            onChange={set('description')}
            placeholder="Giới thiệu ngắn gọn về tác phẩm, nhà xuất bản hoặc chủ đề..."
          />
        </div>
      </form>
    </Modal>
  )
}

function ImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const pick = (e) => {
    const f = e.target.files[0]
    setError('')
    if (!f) return setFile(null)
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setFile(null)
      return setError('Chỉ hỗ trợ tệp định dạng .csv')
    }
    if (f.size > 5 * 1024 * 1024) {
      setFile(null)
      return setError('Dung lượng tệp vượt quá giới hạn 5 MB')
    }
    setFile(f)
  }

  const upload = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await booksApi.importCsv(file)
      onDone(res.message)
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Nhập danh mục sách từ tệp CSV"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Huỷ bỏ
          </button>
          <button type="button" className="btn btn-primary" disabled={!file || busy} onClick={upload}>
            {busy ? 'Đang xử lý tệp...' : 'Bắt đầu nhập sách'}
          </button>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}

      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        Cấu trúc tệp CSV yêu cầu dòng tiêu đề chính xác như sau:
        <div
          className="data"
          style={{
            marginTop: 6,
            padding: '8px 10px',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
          }}
        >
          isbn,title,description,quantityTotal,category,authors
        </div>
        <div style={{ marginTop: 6 }}>
          Nhiều tác giả ngăn cách bằng dấu chấm phẩy (;). Các dòng có ISBN đã tồn tại sẽ tự động bỏ qua.
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="csv-input">Chọn tệp dữ liệu CSV (tối đa 5 MB)</label>
        <input id="csv-input" type="file" accept=".csv" onChange={pick} />
      </div>
    </Modal>
  )
}
