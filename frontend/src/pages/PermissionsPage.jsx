import { useCallback, useEffect, useState } from 'react'
import { permissionsApi } from '../api/permissions'
import { readError } from '../api/errors'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import Pagination from '../components/Pagination'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import {
  PlusIcon,
  ShieldIcon,
  EditIcon,
  TrashIcon,
  UsersIcon,
} from '../components/Icons'

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([])
  const [groups, setGroups] = useState([])
  const [accounts, setAccounts] = useState(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null) // null | {} (tao moi) | group (sua)
  const [assigning, setAssigning] = useState(null) // null | account
  const [deletingGroup, setDeletingGroup] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await permissionsApi.listGroups())
    } catch (err) {
      setError(readError(err))
    }
  }, [])

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    try {
      setAccounts(await permissionsApi.listAccounts({ page, size: 10 }))
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    permissionsApi.listPermissions()
      .then(setPermissions)
      .catch((e) => setError(readError(e)))
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const confirmRemoveGroup = async () => {
    if (!deletingGroup) return
    setDeleteBusy(true)
    setError('')
    try {
      await permissionsApi.removeGroup(deletingGroup.id)
      setNotice(`Đã xoá nhóm quyền "${deletingGroup.name}".`)
      setDeletingGroup(null)
      loadGroups()
    } catch (err) {
      setError(readError(err))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Phân quyền hệ thống</h1>
          <p>Tổ chức các quyền chi tiết thành các nhóm vai trò, sau đó gán nhóm quyền cho từng tài khoản</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setEditingGroup({})}
            type="button"
          >
            <PlusIcon width={16} height={16} />
            Thêm nhóm quyền mới
          </button>
        </div>
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Permission Groups Section */}
      <section style={{ marginBottom: 36 }}>
        <h2>Danh sách nhóm quyền</h2>
        {groups.length === 0 ? (
          <EmptyState
            icon="users"
            title="Chưa có nhóm quyền nào"
            description="Tạo các nhóm chức năng như Thủ thư tổng, Quản lý kho, hay Trợ lý thư viện để gán quyền thuận tiện."
            action={
              <button className="btn btn-primary" onClick={() => setEditingGroup({})}>
                <PlusIcon width={15} height={15} /> Tạo nhóm quyền đầu tiên
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 240 }}>Tên nhóm & Diễn giải</th>
                  <th>Các quyền được cấp trong nhóm</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div className="title">{g.name}</div>
                      <div className="book-authors">{g.description || 'Chưa có mô tả'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {g.permissionCodes.map((c) => (
                          <span key={c} className="badge badge-neutral permission-code">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="col-actions">
                      {g.permissionCodes.includes('PERMISSION_MANAGE') ? <span className="badge badge-neutral">Nhóm hệ thống</span> : <div className="table-action-group">
                        <button
                          className="btn btn-small"
                          onClick={() => setEditingGroup(g)}
                          title="Sửa nhóm quyền"
                          aria-label={`Sửa nhóm ${g.name}`}
                          type="button"
                        >
                          <EditIcon width={13} height={13} />
                          <span>Sửa</span>
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => setDeletingGroup(g)}
                          title="Xoá nhóm quyền"
                          aria-label={`Xoá nhóm ${g.name}`}
                          type="button"
                        >
                          <TrashIcon width={13} height={13} />
                          <span>Xoá</span>
                        </button>
                      </div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Account Assignment Section */}
      <section>
        <h2>Gán nhóm quyền cho tài khoản</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 16 }}>
          Mỗi tài khoản chỉ thuộc một nhóm quyền. Nhóm quản trị toàn quyền chỉ dành cho tài khoản quản trị.
        </p>

        {loading && !accounts ? (
          <Skeleton rows={5} />
        ) : accounts && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tài khoản Email</th>
                    <th style={{ width: 140 }}>Loại người dùng</th>
                    <th>Nhóm quyền đang kích hoạt</th>
                    <th style={{ width: 120, textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.content.map((a) => (
                    <tr key={a.accountId}>
                      <td className="data">{a.email}</td>
                      <td>
                        <span className={`badge ${a.role === 'ADMIN' ? 'badge-ok' : 'badge-neutral'}`}>
                          <span className="badge-dot" />
                          {a.role === 'ADMIN' ? 'Thủ thư' : 'Thành viên'}
                        </span>
                      </td>
                      <td>
                        {a.group ? (
                          <span className="badge badge-neutral">{a.group.name}</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                            Chưa được gán nhóm quyền nào
                          </span>
                        )}
                      </td>
                      <td className="col-actions">
                        <button
                          className="btn btn-small"
                          onClick={() => setAssigning(a)}
                          title="Gán nhóm quyền cho tài khoản này"
                          type="button"
                        >
                          <ShieldIcon width={13} height={13} />
                          <span>Gán nhóm</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={accounts.page}
              totalPages={accounts.totalPages}
              totalElements={accounts.totalElements}
              onChange={setPage}
            />
          </>
        )}
      </section>

      {/* Group Create/Edit Modal */}
      {editingGroup && (
        <GroupModal
          group={editingGroup}
          permissions={permissions}
          onClose={() => setEditingGroup(null)}
          onSaved={(msg) => {
            setEditingGroup(null)
            setNotice(msg)
            loadGroups()
            loadAccounts()
          }}
        />
      )}

      {/* Assign Groups Modal */}
      {assigning && (
        <AssignModal
          account={assigning}
          groups={groups}
          onClose={() => setAssigning(null)}
          onSaved={(msg) => {
            setAssigning(null)
            setNotice(msg)
            loadAccounts()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingGroup)}
        title="Xác nhận xoá nhóm quyền"
        message={`Bạn có chắc chắn muốn xoá nhóm quyền "${deletingGroup?.name}"? Nhóm này không được đang gán cho tài khoản nào.`}
        confirmLabel="Xoá nhóm quyền"
        isDanger={true}
        busy={deleteBusy}
        onConfirm={confirmRemoveGroup}
        onCancel={() => setDeletingGroup(null)}
      />
    </>
  )
}

function GroupModal({ group, permissions, onClose, onSaved }) {
  const isEdit = Boolean(group.id)
  const [name, setName] = useState(group.name || '')
  const [description, setDescription] = useState(group.description || '')
  const [codes, setCodes] = useState(group.permissionCodes || [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const toggle = (code) =>
    setCodes((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]))

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      name: name.trim(),
      description: description.trim(),
      permissionCodes: codes,
    }
    try {
      if (isEdit) await permissionsApi.updateGroup(group.id, payload)
      else await permissionsApi.createGroup(payload)
      onSaved(isEdit ? 'Đã cập nhật nhóm quyền thành công.' : 'Đã tạo nhóm quyền mới thành công.')
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Chỉnh sửa nhóm quyền' : 'Thêm nhóm quyền mới'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Huỷ bỏ
          </button>
          <button type="submit" form="group-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu nhóm quyền'}
          </button>
        </>
      }
    >
      <form id="group-form" onSubmit={save}>
        {error && <Alert type="error">{error}</Alert>}

        <div className="field">
          <label htmlFor="g-name">Tên nhóm quyền</label>
          <input
            id="g-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Thủ thư mượn trả, Quản lý kho sách"
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="g-desc">Mô tả nhiệm vụ</label>
          <input
            id="g-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả phạm vi quyền hạn của nhóm..."
          />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Các quyền chi tiết trong nhóm</label>
          <div className="check-list">
            {permissions.filter((p) => p.code !== 'PERMISSION_MANAGE').map((p) => (
              <label key={p.code} className="check-row">
                <input
                  type="checkbox"
                  checked={codes.includes(p.code)}
                  onChange={() => toggle(p.code)}
                />
                <span>
                  <span className="permission-code">{p.code}</span>
                  <span className="book-authors"> : {p.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

function AssignModal({ account, groups, onClose, onSaved }) {
  const [groupId, setGroupId] = useState(account.group?.id ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!groupId) return
    setError('')
    setBusy(true)
    try {
      await permissionsApi.assignGroups(account.accountId, Number(groupId))
      onSaved(`Đã cập nhật phân quyền thành công cho tài khoản ${account.email}.`)
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`Phân quyền cho ${account.email}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Huỷ bỏ
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !groupId}>
            {busy ? 'Đang lưu...' : 'Lưu phân quyền'}
          </button>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}

      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
        Chọn đúng một nhóm quyền áp dụng cho tài khoản này:
      </p>

      <div className="check-list">
        {groups.filter((g) => account.role === 'ADMIN' || !g.permissionCodes.includes('PERMISSION_MANAGE')).map((g) => (
          <label key={g.id} className="check-row">
            <input
              type="radio"
              name="permission-group"
              checked={String(groupId) === String(g.id)}
              onChange={() => setGroupId(g.id)}
            />
            <span>
              <strong>{g.name}</strong>
              {g.description && <span className="book-authors"> : {g.description}</span>}
            </span>
          </label>
        ))}
      </div>
    </Modal>
  )
}
