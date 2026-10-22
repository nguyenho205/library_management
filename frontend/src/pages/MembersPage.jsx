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
  LockIcon,
  UnlockIcon,
} from '../components/Icons'

const EMPTY_FILTERS = { fullName: '', email: '', bookTitle: '', dobFrom: '', dobTo: '' }

function formatDate(iso) {
  if (!iso) return 'Chưa cập nhật'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function MembersPage() {
  const { can, user } = useAuth()
  const canCreate = can('MEMBER_CREATE')
  const canEdit = can('MEMBER_UPDATE')
  const canDelete = can('MEMBER_DELETE')
  const hasActions = canEdit || canDelete

  const [statusTab, setStatusTab] = useState('ACTIVE') // 'ACTIVE' | 'LOCKED'
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null) // null | {} (tao moi) | member (sua)
  const [lockingMember, setLockingMember] = useState(null)
  const [lockBusy, setLockBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, size: 10, enabled: statusTab === 'ACTIVE' }
      Object.entries(applied).forEach(([k, v]) => v && (params[k] = v))
      setData(await membersApi.search(params))
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [applied, page, statusTab])

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

  const handleToggleLock = async () => {
    if (!lockingMember) return
    setLockBusy(true)
    setError('')
    try {
      if (lockingMember.enabled) {
        await membersApi.lock(lockingMember.id)
        setNotice(`Đã khoá tài khoản của "${lockingMember.fullName}". Phiên đăng nhập của người dùng này đã bị huỷ.`)
      } else {
        await membersApi.unlock(lockingMember.id)
        setNotice(`Đã mở khoá tài khoản cho "${lockingMember.fullName}".`)
      }
      setLockingMember(null)
      load()
    } catch (err) {
      setError(readError(err))
    } finally {
      setLockBusy(false)
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

      {/* Segmented Status Tabs: Dang hoat dong vs Dang bi khoa */}
      <div className="segmented-tabs" role="tablist" aria-label="Bộ lọc trạng thái tài khoản">
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === 'ACTIVE'}
          className={`segmented-tab ${statusTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => {
            if (statusTab !== 'ACTIVE') {
              setStatusTab('ACTIVE')
              setPage(0)
            }
          }}
        >
          <span>Đang hoạt động</span>
          {statusTab === 'ACTIVE' && data?.totalElements != null && (
            <span className="segmented-tab-count">{data.totalElements}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusTab === 'LOCKED'}
          className={`segmented-tab ${statusTab === 'LOCKED' ? 'active' : ''}`}
          onClick={() => {
            if (statusTab !== 'LOCKED') {
              setStatusTab('LOCKED')
              setPage(0)
            }
          }}
        >
          <span>Đang bị khoá</span>
          {statusTab === 'LOCKED' && data?.totalElements != null && (
            <span className="segmented-tab-count">{data.totalElements}</span>
          )}
        </button>
      </div>

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
          title={statusTab === 'ACTIVE' ? 'Không có thành viên đang hoạt động' : 'Không có thành viên nào bị khoá'}
          description={
            hasActiveFilters
              ? 'Không có thành viên nào khớp với tiêu chí tìm kiếm hiện tại. Thử xoá bớt bộ lọc.'
              : statusTab === 'ACTIVE'
              ? 'Chưa có dữ liệu thành viên đang hoạt động trong hệ thống.'
              : 'Hiện tại không có tài khoản độc giả nào trong trạng thái bị khoá.'
          }
          action={
            hasActiveFilters ? (
              <button className="btn btn-secondary" onClick={resetFilters}>
                Bỏ các điều kiện lọc
              </button>
            ) : statusTab === 'ACTIVE' && canCreate ? (
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
                    <th style={{ width: 160 }}>Trạng thái tài khoản</th>
                    {hasActions && <th style={{ width: 130, textAlign: 'right' }}>Thao tác</th>}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span className={`badge ${m.enabled ? 'badge-ok' : 'badge-danger'}`}>
                            <span className="badge-dot" />
                            {m.enabled ? 'Đang hoạt động' : 'Đang bị khoá'}
                          </span>
                          <span className={`badge ${m.emailVerified ? 'badge-neutral' : 'badge-warn'}`} style={{ fontSize: '0.72rem', padding: '1px 6px' }}>
                            {m.emailVerified ? 'Email đã xác thực' : 'Chưa xác thực email'}
                          </span>
                        </div>
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
                              m.enabled ? (
                                <button
                                  className="btn btn-small btn-warn"
                                  onClick={() => setLockingMember(m)}
                                  disabled={m.email === user?.email}
                                  title={m.email === user?.email ? 'Không thể tự khoá tài khoản của chính mình' : 'Khoá tài khoản độc giả này'}
                                  aria-label={`Khoá tài khoản ${m.fullName}`}
                                  type="button"
                                >
                                  <LockIcon width={13} height={13} />
                                  <span>Khoá</span>
                                </button>
                              ) : (
                                <button
                                  className="btn btn-small btn-ok"
                                  onClick={() => setLockingMember(m)}
                                  title="Mở khoá tài khoản độc giả này"
                                  aria-label={`Mở khoá tài khoản ${m.fullName}`}
                                  type="button"
                                >
                                  <UnlockIcon width={13} height={13} />
                                  <span>Mở khoá</span>
                                </button>
                              )
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

      {/* Lock/Unlock Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(lockingMember)}
        title={lockingMember?.enabled ? 'Xác nhận khoá tài khoản độc giả' : 'Xác nhận mở khoá tài khoản'}
        message={
          lockingMember?.enabled
            ? `Bạn có chắc chắn muốn khoá tài khoản "${lockingMember?.fullName}" (${lockingMember?.email})? Tài khoản bị khoá sẽ ngay lập tức bị ngắt phiên đăng nhập, không thể truy cập hệ thống và không thể mượn sách mới.`
            : `Bạn có muốn mở khoá cho tài khoản "${lockingMember?.fullName}" (${lockingMember?.email})? Độc giả sẽ có thể đăng nhập và tiếp tục sử dụng các dịch vụ thư viện.`
        }
        confirmLabel={lockingMember?.enabled ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
        isDanger={lockingMember?.enabled}
        busy={lockBusy}
        onConfirm={handleToggleLock}
        onCancel={() => setLockingMember(null)}
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
