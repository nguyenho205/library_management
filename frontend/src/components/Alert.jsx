import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircleIcon, CheckCircleIcon, InfoIcon } from './Icons'

const BADGE_TITLES = {
  success: 'Thành công',
  error: 'Lỗi',
  warning: 'Cảnh báo',
  info: 'Thông báo',
}

/**
 * Hệ thống Alert & Thông báo chính thức của hệ thống (Dynamic Island Capsule HUD)
 * - Nổi ở đỉnh giữa màn hình (Top-Center) với hiệu ứng kính mờ (blur), viền phát quang neon theo nhịp thở (breathing beacon)
 * - Tự động ẩn sau khoảng thời gian `duration`, tạm dừng khi rê chuột (pause on hover)
 * - Hỗ trợ cả chế độ nổi (Floating HUD - mặc định khi có onClose) và trong trang (Inline Alert)
 */
export default function Alert({
  type = 'info',
  title,
  children,
  onClose,
  duration = 4500,
  inline = false,
  floating,
  actionLabel,
  onAction,
}) {
  if (!children) return null

  // Tự động phân loại: Nếu có onClose và không chỉ định inline thì hiển thị dạng Floating HUD
  const isFloating = floating !== undefined ? floating : Boolean(onClose && !inline)

  if (isFloating) {
    return (
      <DynamicIslandHUD
        type={type}
        title={title}
        onClose={onClose}
        duration={duration}
        actionLabel={actionLabel}
        onAction={onAction}
      >
        {children}
      </DynamicIslandHUD>
    )
  }

  return (
    <InlineAlert type={type} title={title} onClose={onClose}>
      {children}
    </InlineAlert>
  )
}

function DynamicIslandHUD({
  type,
  title,
  children,
  onClose,
  duration,
  actionLabel,
  onAction,
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const startTimeRef = useRef(Date.now())
  const remainingTimeRef = useRef(duration)
  const timerRef = useRef(null)

  const badgeText = title || BADGE_TITLES[type] || 'Thông báo'

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      if (onClose) onClose()
    }, 220)
  }

  useEffect(() => {
    if (!duration || duration <= 0) return

    const scheduleTimer = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        handleClose()
      }, remainingTimeRef.current)
    }

    if (!isPaused) {
      startTimeRef.current = Date.now()
      scheduleTimer()
    }

    return () => clearTimeout(timerRef.current)
  }, [duration, isPaused])

  const handleMouseEnter = () => {
    setIsPaused(true)
    const elapsed = Date.now() - startTimeRef.current
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
    clearTimeout(timerRef.current)
  }

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now()
    setIsPaused(false)
  }

  const icon =
    type === 'error' ? (
      <AlertCircleIcon width={16} height={16} />
    ) : type === 'success' ? (
      <CheckCircleIcon width={16} height={16} />
    ) : (
      <InfoIcon width={16} height={16} />
    )

  const toastContent = (
    <div className="dynamic-island-container" aria-live="assertive">
      <div
        className={`dynamic-island-hud island-${type} ${isClosing ? 'closing' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="alert"
      >
        {/* Glow backdrop aura */}
        <div className="island-aura" />

        {/* Pulsing beacon / Icon circle */}
        <div className="island-beacon-wrap">
          <span className="island-pulsing-ring" />
          <div className="island-icon-disc">{icon}</div>
        </div>

        {/* Text body */}
        <div className="island-content">
          <span className="island-badge">{badgeText}</span>
          <span className="island-text">{children}</span>
        </div>

        {/* Optional Action Button */}
        {actionLabel && (
          <button
            type="button"
            className="island-action-btn"
            onClick={() => {
              if (onAction) onAction()
              handleClose()
            }}
          >
            {actionLabel}
          </button>
        )}

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            className="island-close-btn"
            onClick={handleClose}
            aria-label="Đóng thông báo"
            title="Đóng"
          >
            ×
          </button>
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
          className="island-close-btn"
          onClick={onClose}
          aria-label="Đóng thông báo"
          style={{ width: 20, height: 20, marginLeft: 'auto', background: 'transparent', color: 'inherit' }}
        >
          ×
        </button>
      )}
    </div>
  )
}
