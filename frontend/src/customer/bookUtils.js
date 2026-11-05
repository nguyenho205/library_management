/**
 * Shared Utilities for Customer Immersive Reading Experience
 */

export const CURATED_COVERS = {
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

export function resolveBookCover(book) {
  if (book?.imgUrl) return book.imgUrl
  const title = (book?.title || '').toLowerCase()
  for (const [key, url] of Object.entries(CURATED_COVERS)) {
    if (title.includes(key)) return url
  }
  const cat = (book?.categoryName || '').toLowerCase()
  if (cat.includes('văn học') || cat.includes('tiểu thuyết')) return '/anhbia/truyenkieu.webp'
  if (cat.includes('lập trình') || cat.includes('công nghệ') || cat.includes('tin học')) return '/anhbia/javacore.jpg'
  if (cat.includes('khoa học') || cat.includes('toán') || cat.includes('vật lý')) return '/anhbia/luocsuthoigian.webp'
  return null
}

export function formatDate(iso) {
  if (!iso) return 'Chưa cập nhật'
  const parts = String(iso).split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return iso
}

export function formatMoney(amount) {
  if (!amount || Number(amount) === 0) return '0 đ'
  return Number(amount).toLocaleString('vi-VN') + ' đ'
}

export function getMinReturnDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export function getMaxReturnDate() {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  return d.toISOString().split('T')[0]
}

export function getDefaultReturnDate() {
  const d = new Date()
  d.setDate(d.getDate() + 10)
  return d.toISOString().split('T')[0]
}

export function getFutureDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function isOverdue(record) {
  if (!record) return false
  if (record.overdue) return true
  if (record.status === 'BORROWED' && record.dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(record.dueDate)
    return due < today
  }
  return false
}

export function getDaysRemaining(dueDateStr) {
  if (!dueDateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDateStr)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getLoanProgress(borrowDateStr, dueDateStr) {
  if (!borrowDateStr || !dueDateStr) return 0
  const start = new Date(borrowDateStr).getTime()
  const end = new Date(dueDateStr).getTime()
  const now = new Date().getTime()
  if (end <= start) return 100
  const pct = Math.round(((now - start) / (end - start)) * 100)
  return Math.max(0, Math.min(100, pct))
}

export const CONDITION_MAP = {
  INTACT: {
    key: 'INTACT',
    label: 'Nguyên vẹn',
    badgeClass: 'badge-ok',
    color: '#059669',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
    defaultFee: 0,
  },
  LIGHT_DAMAGE: {
    key: 'LIGHT_DAMAGE',
    label: 'Hư hỏng nhẹ',
    badgeClass: 'badge-warn',
    color: '#d97706',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: '#f59e0b',
    defaultFee: 20000,
  },
  HEAVY_DAMAGE: {
    key: 'HEAVY_DAMAGE',
    label: 'Hư hỏng nặng',
    badgeClass: 'badge-danger',
    color: '#dc2626',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#ef4444',
    defaultFee: 100000,
  },
  LOST: {
    key: 'LOST',
    label: 'Mất tài liệu',
    badgeClass: 'badge-danger',
    color: '#991b1b',
    bgColor: 'rgba(153, 27, 27, 0.1)',
    borderColor: '#b91c1c',
    defaultFee: 200000,
  },
}

