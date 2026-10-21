import MessageText from './MessageText'
import { AlertCircleIcon, CheckCircleIcon, InfoIcon } from './Icons'

export default function Alert({ type = 'info', children, onClose }) {
  if (!children) return null

  const icon =
    type === 'error' ? (
      <AlertCircleIcon width={17} height={17} />
    ) : type === 'success' ? (
      <CheckCircleIcon width={17} height={17} />
    ) : (
      <InfoIcon width={17} height={17} />
    )

  return (
    <div className={`alert alert-${type}`} role="alert">
      <span className="alert-icon">{icon}</span>
      <div className="alert-content">
        <MessageText>{children}</MessageText>
      </div>
      {onClose && (
        <button
          type="button"
          className="btn btn-icon btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Đóng thông báo"
          style={{ width: 22, height: 22, marginLeft: 'auto' }}
        >
          ×
        </button>
      )}
    </div>
  )
}
