import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api/notifications'
import { BellIcon } from './Icons'

function timeAgo(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
  return `${Math.floor(seconds / 86400)} ngày trước`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)

  const refreshCount = useCallback(() => {
    notificationsApi.unreadCount().then(setUnread).catch(() => {})
  }, [])

  const refreshList = useCallback(() => {
    notificationsApi.list().then(setItems).catch(() => {})
    refreshCount()
  }, [refreshCount])

  useEffect(() => {
    refreshCount()
    const interval = window.setInterval(refreshCount, 20000)
    window.addEventListener('focus', refreshCount)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshCount)
    }
  }, [refreshCount])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) refreshList()
  }

  const openNotification = async (notification) => {
    if (!notification.read) {
      await notificationsApi.markRead(notification.id).catch(() => {})
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      setUnread((count) => Math.max(0, count - 1))
    }
    setOpen(false)
    if (notification.targetUrl) navigate(notification.targetUrl)
  }

  const markAll = async () => {
    await notificationsApi.markAllRead().catch(() => {})
    setItems((current) => current.map((item) => ({ ...item, read: true })))
    setUnread(0)
  }

  return (
    <div className="notification-bell" ref={rootRef}>
      <button className="notification-bell__trigger" type="button" onClick={toggle} aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`} aria-expanded={open}>
        <BellIcon width={19} height={19} />
        {unread > 0 && <span className="notification-bell__badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <section className="notification-bell__panel" aria-label="Thông báo">
          <header className="notification-bell__header">
            <div><strong>Thông báo</strong><span>{unread ? `${unread} chưa đọc` : 'Bạn đã cập nhật'}</span></div>
            {unread > 0 && <button type="button" onClick={markAll}>Đọc tất cả</button>}
          </header>
          <div className="notification-bell__list">
            {items.length ? items.map((item) => (
              <button key={item.id} type="button" className={`notification-bell__item${item.read ? '' : ' is-unread'}`} onClick={() => openNotification(item)}>
                <span className="notification-bell__dot" />
                <span className="notification-bell__content"><strong>{item.title}</strong><span>{item.message}</span><time>{timeAgo(item.createdAt)}</time></span>
              </button>
            )) : <p className="notification-bell__empty">Chưa có thông báo nào.</p>}
          </div>
        </section>
      )}
    </div>
  )
}
