import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircleIcon, CheckCircleIcon, InfoIcon } from './Icons'

const DEFAULT_TITLES = {
  success: 'Thao tác thành công',
  error: 'Đã xảy ra lỗi',
  warning: 'Cảnh báo hệ thống',
  info: 'Thông báo',
}

export default function Alert({
  type = 'info',
  title,
  children,
  onClose,
  duration = 4500,
  inline = false,
  floating,
}) {
  if (!children) return null

  // Tự động phân loại: Nếu có onClose và không chỉ định inline thì hiển thị dạng Floating Toast Dock
  const isFloating = floating !== undefined ? floating : Boolean(onClose && !inline)

  if (isFloating) {
    return (
      <FloatingToast
        type={type}
        title={title}
        onClose={onClose}
        duration={duration}
      >
        {children}
      </FloatingToast>
    )
  }

  return (
    <InlineAlert type={type} title={title} onClose={onClose}>
      {children}
    </InlineAlert>
  )
}

function FloatingToast({ type, title, children, onClose, duration }) {
  const [isClosing, setIsClosing] = useState(false)
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)
  const startTimeRef = useRef(Date.now())
  const remainingTimeRef = useRef(duration)
  const progressIntervalRef = useRef(null)

  const displayTitle = title || DEFAULT_TITLES[type] || 'Thông báo'

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      if (onClose) onClose()
    }, 200)
  }

  useEffect(() => {
    if (!duration || duration <= 0) return

    const updateProgress = () => {
      if (isPaused) return
      const elapsed = Date.now() - startTimeRef.current
      const left = Math.max(0, remainingTimeRef.current - elapsed)
      const pct = (left / duration) * 100
      setProgress(pct)
      if (left <= 0) {
        clearInterval(progressIntervalRef.current)
        handleClose()
      }
    }

    startTimeRef.current = Date.now()
    progressIntervalRef.current = setInterval(updateProgress, 35)

    return () => {
      clearInterval(progressIntervalRef.current)
    }
  }, [duration, isPaused])

  const handleMouseEnter = () => {
    setIsPaused(true)
    const elapsed = Date.now() - startTimeRef.current
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
  }

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now()
    setIsPaused(false)
  }

  const icon =
    type === 'error' ? (
      <AlertCircleIcon width={18} height={18} />
    ) : type === 'success' ? (
      <CheckCircleIcon width={18} height={18} />
    ) : (
      <InfoIcon width={18} height={18} />
    )

  const toastContent = (
    <div className="toast-floating-container" aria-live="polite">
      <div
        className={`toast-dock toast-${type} ${isClosing ? 'closing' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="alert"
      >
        <div className="toast-icon-box">{icon}</div>
        <div className="toast-body">
          <div className="toast-title">{displayTitle}</div>
          <div className="toast-message">{children}</div>
        </div>
        {onClose && (
          <button
            type="button"
            className="toast-close-btn"
            onClick={handleClose}
            aria-label="Đóng thông báo"
            title="Đóng thông báo"
          >
            ×
          </button>
        )}
        {duration > 0 && (
          <div className="toast-progress-track">
            <div
              className="toast-progress-bar"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
        )}
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(toastContent, document.body)
  }
  return toastContent
}

function InlineAlert({ type, title, children, onClose }) {
  const icon =
    type === 'error' ? (
      <AlertCircleIcon width={16} height={16} />
    ) : type === 'success' ? (
      <CheckCircleIcon width={16} height={16} />
    ) : (
      <InfoIcon width={16} height={16} />
    )

  return (
    <div className={`alert-inline alert-${type}`} role="alert">
      <span className="alert-icon">{icon}</span>
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="Đóng thông báo"
          style={{ width: 20, height: 20, marginLeft: 'auto' }}
        >
          ×
        </button>
      )}
    </div>
  )
}
