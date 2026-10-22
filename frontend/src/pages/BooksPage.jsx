import { useCallback, useEffect, useState } from 'react'
import { booksApi } from '../api/books'
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
} from '../components/Icons'

const EMPTY_FORM = { isbn: '', title: '', description: '', quantityTotal: 1, categoryId: '', authorNames: '' }
const EMPTY_FILTERS = { title: '', isbn: '', author: '', categoryId: '' }

export default function BooksPage({ adminMode = false }) {
  const { can, isAdmin } = useAuth()
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

  const [editing, setEditing] = useState(null) // null | {id?, ...form}
  const [importing, setImporting] = useState(false)
  const [statusChangingBook, setStatusChangingBook] = useState(null)
  const [statusBusy, setStatusBusy] = useState(false)
  const [deletingBook, setDeletingBook] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [viewingBook, setViewingBook] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const effectiveStatus = (adminMode && (isAdmin || isLibrarian)) ? statusTab : 'IN_CIRCULATION'
      const params = { page, size: 10, status: effectiveStatus }
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
    client.get('/categories')
      .then((r) => setCategories(r.data.data))
      .catch(() => {})
  }, [])

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
    })

  const hasActiveFilters = Boolean(applied.title || applied.isbn || applied.author || applied.categoryId)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{adminMode && isAdmin ? 'Quản lý danh mục sách' : 'Tra cứu sách'}</h1>
          <p>{adminMode && isAdmin
            ? 'Quản lý ấn phẩm, số lượng và thông tin sách trong thư viện.'
            : 'Khám phá sách theo tên, ISBN, tác giả hoặc thể loại; xem tình trạng còn sách tại thư viện.'}</p>
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
              <button
                className="btn btn-primary"
                onClick={() => setEditing({ ...EMPTY_FORM })}
                type="button"
              >
                <PlusIcon width={16} height={16} />
                Thêm sách mới
              </button>
            )}
          </div>
        )}
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Segmented Status Tabs: Phat hanh vs Ngung luu hanh */}
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

      {loading && !data ? (
        <Skeleton rows={6} />
      ) : data && data.content.length === 0 ? (
        <EmptyState
          icon="book"
          title="Không tìm thấy sách phù hợp"
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
      ) : (
        data && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
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
                      <td className="data">{b.isbn}</td>
                      <td>
                        <div
                          className="title"
                          style={{ cursor: b.description ? 'pointer' : 'default' }}
                          onClick={() => b.description && setViewingBook(b)}
                          title={b.description ? 'Bấm để xem mô tả chi tiết' : undefined}
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

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onChange={setPage}
            />
          </>
        )
      )}

      {/* Book Detail Modal */}
      {viewingBook && (
        <Modal
          title={`Chi tiết: ${viewingBook.title}`}
          onClose={() => setViewingBook(null)}
          footer={
            <button type="button" className="btn btn-secondary" onClick={() => setViewingBook(null)}>
              Đóng
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                Mã định danh ISBN
              </div>
              <div className="data" style={{ fontSize: 14 }}>{viewingBook.isbn}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                Tác giả
              </div>
              <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                {(viewingBook.authorNames || []).join(', ') || 'Chưa cập nhật'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                Thể loại
              </div>
              <div style={{ fontSize: 14 }}>{viewingBook.categoryName || 'Chưa phân loại'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                Mô tả nội dung
              </div>
              <p style={{ marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {viewingBook.description || 'Chưa có mô tả tóm tắt cho cuốn sách này.'}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Book Modal */}
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

      {/* Import CSV Modal */}
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
        title={statusChangingBook?.status === 'DISCONTINUED' ? 'Xác nhận tái phát hành sách' : 'Xác nhận ngừng lưu hành sách'}
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

function BookFormModal({ initial, categories, onClose, onSaved }) {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isEdit = Boolean(initial.id)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

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
      authorNames: form.authorNames.split(',').map((s) => s.trim()).filter(Boolean),
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
          <div className="field-hint">Nếu có nhiều tác giả, ngăn cách bằng dấu phẩy (,).</div>
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
          <button
            type="button"
            className="btn btn-primary"
            disabled={!file || busy}
            onClick={upload}
          >
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
