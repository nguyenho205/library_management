import { useCallback, useEffect, useState } from 'react'
import { membersApi } from '../api/members'
import { readError } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import PasswordInput from '../components/PasswordInput'
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from '../components/Icons'

const EMPTY_FILTERS = { fullName: '', email: '', bookTitle: '', dobFrom: '', dobTo: '' }

function formatDate(iso) {
  if (!iso) return 'Chưa cập nhật'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function MembersPage() {
  const { can } = useAuth()
  const canCreate = can('MEMBER_CREATE')
  const canEdit = can('MEMBER_UPDATE')
  const canDelete = can('MEMBER_DELETE')
  const hasActions = canEdit || canDelete

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null) // null | {} (tao moi) | member (sua)
  const [deletingMember, setDeletingMember] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, size: 10 }
      Object.entries(applied).forEach(([k, v]) => v && (params[k] = v))
      setData(await membersApi.search(params))
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [applied, page])

  useEffect(() => {
    load()
  }, [load])

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })

  const search = (e) => {
    e.preventDefault()
    if (filters.dobFrom && filters.dobTo && filters.dobFrom > filters.dobTo) {
      return setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.')
    }
    setError('')
    setPage(0)
    setApplied(filters)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(0)
  }

  const confirmRemove = async () => {
    if (!deletingMember) return
    setDeleteBusy(true)
    try {
      await membersApi.remove(deletingMember.id)
      setNotice(`Đã xoá thành viên "${deletingMember.fullName}".`)
      setDeletingMember(null)
      load()
    } catch (err) {
      setError(readError(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  const hasActiveFilters = Boolean(
    applied.fullName || applied.email || applied.bookTitle || applied.dobFrom || applied.dobTo
  )

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hồ sơ thành viên</h1>
          <p>Quản lý danh sách độc giả, thông tin liên lạc và trạng thái xác thực tài khoản</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button
              className="btn btn-primary"
              onClick={() => setEditing({})}
              type="button"
            >
              <PlusIcon width={16} height={16} />
              Thêm thành viên mới
            </button>
          </div>
        )}
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <form className="toolbar" onSubmit={search}>
        <div className="field">
          <label htmlFor="m-name">Họ và tên</label>
          <input
            id="m-name"
            value={filters.fullName}
            onChange={set('fullName')}
            placeholder="Tìm theo tên..."
          />
        </div>
        <div className="field">
          <label htmlFor="m-email">Địa chỉ Email</label>
          <input
            id="m-email"
            value={filters.email}
            onChange={set('email')}
            placeholder="Tìm theo email..."
          />
        </div>
        <div className="field">
          <label htmlFor="m-book">Sách đã mượn</label>
          <input
            id="m-book"
            value={filters.bookTitle}
            onChange={set('bookTitle')}
            placeholder="Tên sách từng mượn..."
          />
        </div>
        <div className="field field-narrow">
          <label htmlFor="m-from">Sinh từ ngày</label>
          <input
            id="m-from"
            type="date"
            value={filters.dobFrom}
            onChange={set('dobFrom')}
          />
        </div>
        <div className="field field-narrow">
          <label htmlFor="m-to">Đến ngày</label>
          <input
            id="m-to"
            type="date"
            value={filters.dobTo}
            onChange={set('dobTo')}
          />
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
          icon="users"
          title="Không tìm thấy thành viên phù hợp"
          description={
            hasActiveFilters
              ? 'Không có thành viên nào khớp với tiêu chí tìm kiếm hiện tại. Thử xoá bớt bộ lọc.'
              : 'Chưa có dữ liệu thành viên trong hệ thống.'
          }
          action={
            hasActiveFilters ? (
              <button className="btn btn-secondary" onClick={resetFilters}>
                Bỏ các điều kiện lọc
              </button>
            ) : canCreate ? (
              <button className="btn btn-primary" onClick={() => setEditing({})}>
                <PlusIcon width={15} height={15} /> Thêm thành viên đầu tiên
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
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th style={{ width: 130 }}>Ngày sinh</th>
                    <th style={{ width: 140 }}>Số điện thoại</th>
                    <th style={{ width: 140 }}>Trạng thái email</th>
                    {hasActions && <th style={{ width: 120, textAlign: 'right' }}>Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="title">{m.fullName}</div>
                        {m.address && <div className="book-authors">{m.address}</div>}
                      </td>
                      <td className="data">{m.email}</td>
                      <td className="num">{formatDate(m.dateOfBirth)}</td>
                      <td className="data">{m.phone || 'Chưa cập nhật'}</td>
                      <td>
                        <span className={`badge ${m.emailVerified ? 'badge-ok' : 'badge-warn'}`}>
                          <span className="badge-dot" />
                          {m.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </span>
                      </td>
                      {hasActions && (
                        <td className="col-actions">
                          <div className="table-action-group">
                            {canEdit && (
                              <button
                                className="btn btn-small"
                                onClick={() => setEditing(m)}
                                title="Chỉnh sửa thông tin"
                                aria-label={`Sửa thành viên ${m.fullName}`}
                                type="button"
                              >
                                <EditIcon width={13} height={13} />
                                <span>Sửa</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="btn btn-small btn-danger"
                                onClick={() => setDeletingMember(m)}
                                title="Xoá thành viên này"
                                aria-label={`Xoá thành viên ${m.fullName}`}
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

      {/* Member Create/Edit Modal */}
      {editing && (
        <MemberFormModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null)
            setNotice(msg)
            load()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingMember)}
        title="Xác nhận xoá hồ sơ thành viên"
        message={`Bạn có chắc chắn muốn xoá thành viên "${deletingMember?.fullName}" (${deletingMember?.email}) khỏi cơ sở dữ liệu?`}
        confirmLabel="Xoá thành viên"
        isDanger={true}
        busy={deleteBusy}
        onConfirm={confirmRemove}
        onCancel={() => setDeletingMember(null)}
      />
    </>
  )
}

function MemberFormModal({ member, onClose, onSaved }) {
  const isEdit = Boolean(member.id)
  const [form, setForm] = useState({
    fullName: member.fullName || '',
    email: member.email || '',
    password: '',
    dateOfBirth: member.dateOfBirth || '',
    phone: member.phone || '',
    address: member.address || '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isEdit) {
        await membersApi.update(member.id, {
          fullName: form.fullName.trim(),
          dateOfBirth: form.dateOfBirth || null,
          phone: form.phone.trim(),
          address: form.address.trim(),
        })
        onSaved('Đã cập nhật thông tin thành viên thành công.')
      } else {
        await membersApi.create({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
        })
        onSaved('Đã tạo tài khoản thành viên mới thành công.')
      }
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Chỉnh sửa thông tin thành viên' : 'Thêm thành viên mới'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Huỷ bỏ
          </button>
          <button type="submit" form="member-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo thành viên'}
          </button>
        </>
      }
    >
      <form id="member-form" onSubmit={save}>
        {error && <Alert type="error">{error}</Alert>}

        <div className="field">
          <label htmlFor="mf-name">Họ và tên</label>
          <input
            id="mf-name"
            value={form.fullName}
            onChange={set('fullName')}
            placeholder="Nguyễn Văn A"
            required
            autoFocus
          />
        </div>

        {isEdit ? (
          <>
            <div className="field-row">
              <div className="field">
                <label htmlFor="mf-dob">Ngày sinh</label>
                <input
                  id="mf-dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={set('dateOfBirth')}
                />
              </div>
              <div className="field">
                <label htmlFor="mf-phone">Số điện thoại</label>
                <input
                  id="mf-phone"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="0912 345 678"
                />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="mf-addr">Địa chỉ liên hệ</label>
              <input
                id="mf-addr"
                value={form.address}
                onChange={set('address')}
                placeholder="Số nhà, đường, quận/huyện, thành phố"
              />
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="mf-email">Địa chỉ Email đăng nhập</label>
              <input
                id="mf-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="mf-pass">Mật khẩu khởi tạo</label>
              <PasswordInput
                id="mf-pass"
                value={form.password}
                onChange={set('password')}
                placeholder="Tối thiểu 8 ký tự"
                required
              />
              <div className="field-hint">
                Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Tài khoản do thủ thư tạo được kích hoạt ngay không cần mã xác thực.
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}
