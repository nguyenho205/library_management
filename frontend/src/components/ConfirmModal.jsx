import Modal from './Modal'
import { AlertCircleIcon } from './Icons'

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận hành động',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ bỏ',
  isDanger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Đang xử lý...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-box">
        {isDanger && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <span className="alert-icon"><AlertCircleIcon width={18} height={18} /></span>
            <div className="alert-content">Hành động này không thể hoàn tác sau khi thực hiện.</div>
          </div>
        )}
        <p className="confirm-text">{message}</p>
      </div>
    </Modal>
  )
}
