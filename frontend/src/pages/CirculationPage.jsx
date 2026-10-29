import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import DueStamp from '../components/DueStamp'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import {
  CirculationIcon,
  CheckCircleIcon,
  BookIcon,
  ClockIcon,
  SearchIcon,
  AlertCircleIcon,
  CalendarIcon,
  FilterIcon,
  CheckIcon,
  CloseIcon,
  RefreshIcon,
  MailIcon,
} from '../components/Icons'

function formatDate(iso) {
  if (!iso) return 'Chưa cập nhật'
  const parts = String(iso).split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return iso
}

function formatMoney(amount) {
  if (!amount || Number(amount) === 0) return '0 đ'
  return Number(amount).toLocaleString('vi-VN') + ' đ'
}

export const CONDITION_MAP = {
  INTACT: {
    key: 'INTACT',
    label: 'Nguyên vẹn',
    badgeClass: 'badge-ok',
    color: '#059669',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
    description: 'Sách nguyên vẹn, sạch sẽ, không rách bìa/trang. Sẵn sàng tiếp tục lưu thông.',
    defaultFee: 0,
    restock: true,
    tag: 'Đạt chuẩn (+1 tồn kho)',
  },
  LIGHT_DAMAGE: {
    key: 'LIGHT_DAMAGE',
    label: 'Hư hỏng nhẹ',
    badgeClass: 'badge-warn',
    color: '#d97706',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: '#f59e0b',
    description: 'Sờn góc bìa, nếp gấp, bẩn nhẹ không mất nội dung. Vẫn tiếp tục phục vụ bạn đọc.',
    defaultFee: 20000,
    restock: true,
    tag: 'Chấp nhận (+1 tồn kho)',
  },
  HEAVY_DAMAGE: {
    key: 'HEAVY_DAMAGE',
    label: 'Hư hỏng nặng',
    badgeClass: 'badge-danger',
    color: '#dc2626',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: '#ef4444',
    description: 'Rách nát nhiều trang, bong gáy, ướt nước, mất nội dung. Chuyển thanh lý/phục chế.',
    defaultFee: 100000,
    restock: false,
    tag: 'Loại bỏ (Không tăng kho)',
  },
  LOST: {
    key: 'LOST',
    label: 'Mất tài liệu',
    badgeClass: 'badge-danger',
    color: '#991b1b',
    bgColor: 'rgba(153, 27, 27, 0.1)',
    borderColor: '#b91c1c',
    description: 'Độc giả làm mất sách. Bồi thường x3 giá bìa + 50.000 đ phí kỹ thuật theo quy định.',
    defaultFee: 200000,
    restock: false,
    tag: 'Mất sách (Không tăng kho)',
  },
}

function renderConditionBadge(conditionKey, notes) {
  if (!conditionKey) return <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Chưa kiểm định</span>
  const cond = CONDITION_MAP[conditionKey] || {
    label: conditionKey,
    badgeClass: 'badge-neutral',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span className={`badge ${cond.badgeClass}`} style={{ width: 'fit-content' }}>
        <span className="badge-dot" />
        {cond.label}
      </span>
      {notes && (
        <span
          title={notes}
          style={{
            fontSize: 11,
            color: 'var(--color-text-tertiary)',
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {notes}
        </span>
      )}
    </div>
  )
}

function isWithinDateRange(dateStr, rangePreset, customFrom, customTo) {
  if (rangePreset === 'ALL') return true
  if (!dateStr) return false

  const parts = String(dateStr).split('-')
  if (parts.length !== 3) return false
  const targetYear = parseInt(parts[0], 10)
  const targetMonth = parseInt(parts[1], 10) - 1
  const targetDay = parseInt(parts[2], 10)
  const targetDate = new Date(targetYear, targetMonth, targetDay)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (rangePreset === 'TODAY') {
    return targetDate.getTime() === today.getTime()
  }

  if (rangePreset === 'THIS_WEEK') {
    const day = today.getDay()
    const diffToMonday = (day === 0 ? -6 : 1) - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return targetDate >= monday && targetDate <= sunday
  }

  if (rangePreset === '7_DAYS') {
    const diffTime = today.getTime() - targetDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= 7
  }

  if (rangePreset === '30_DAYS') {
    const diffTime = today.getTime() - targetDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= 30
  }

  if (rangePreset === 'THIS_MONTH') {
    return targetDate.getFullYear() === now.getFullYear() && targetDate.getMonth() === now.getMonth()
  }

  if (rangePreset === 'THIS_YEAR') {
    return targetDate.getFullYear() === now.getFullYear()
  }

  if (rangePreset === 'CUSTOM') {
    if (customFrom && dateStr < customFrom) return false
    if (customTo && dateStr > customTo) return false
    return true
  }

  return true
}

function recordMatchesDate(record, rangePreset, customFrom, customTo) {
  if (rangePreset === 'ALL') return true
  const matchReturn = record.returnDate && isWithinDateRange(record.returnDate, rangePreset, customFrom, customTo)
  const matchBorrow = record.borrowDate && isWithinDateRange(record.borrowDate, rangePreset, customFrom, customTo)
  return Boolean(matchReturn || matchBorrow)
}

export default function CirculationPage({ adminMode = false }) {
  const { user, isAdmin } = useAuth()
  const isLibrarian = Boolean(adminMode || isAdmin)

  const [history, setHistory] = useState([])
  const [adminRecords, setAdminRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Admin main tabs: 'PENDING' | 'ACTIVE' | 'HISTORY'
  const [adminTab, setAdminTab] = useState('PENDING')
  const [confirmAction, setConfirmAction] = useState(null)
  const [busyReminderId, setBusyReminderId] = useState(null)
  const [batchReminderBusy, setBatchReminderBusy] = useState(false)

  // Return inspection state (Thủ thư kiểm định tình trạng & chốt phí khi nhận lại sách)
  const [inspectionRecord, setInspectionRecord] = useState(null)
  const [inspectionCondition, setInspectionCondition] = useState('INTACT')
  const [inspectionDamageFee, setInspectionDamageFee] = useState(0)
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [inspectionSubmitting, setInspectionSubmitting] = useState(false)

  // Customer return guide modal
  const [customerGuideRecord, setCustomerGuideRecord] = useState(null)

  // -------------------------------------------------------------
  // CUSTOMER HISTORY STATE & FILTERS
  // -------------------------------------------------------------
  const [customerHistTab, setCustomerHistTab] = useState('ALL') // 'ALL' | 'RETURNED' | 'REJECTED' | 'PENALTY'
  const [customerTimeRange, setCustomerTimeRange] = useState('ALL') // 'ALL' | '30_DAYS' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM'
  const [customerCustomFrom, setCustomerCustomFrom] = useState('')
  const [customerCustomTo, setCustomerCustomTo] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerPage, setCustomerPage] = useState(0)

  // -------------------------------------------------------------
  // ADMIN TAB 3 (CIRCULATION HISTORY) STATE & FILTERS
  // -------------------------------------------------------------
  const [adminHistTab, setAdminHistTab] = useState('ALL') // 'ALL' | 'RETURNED' | 'REJECTED' | 'PENALTY'
  const [adminTimeRange, setAdminTimeRange] = useState('ALL') // 'ALL' | 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH' | 'CUSTOM'
  const [adminCustomFrom, setAdminCustomFrom] = useState('')
  const [adminCustomTo, setAdminCustomTo] = useState('')
  const [adminHistSearch, setAdminHistSearch] = useState('')
  const [adminHistPage, setAdminHistPage] = useState(0)

  // -------------------------------------------------------------
  // ADMIN TAB 2 (ACTIVE & OVERDUE) STATE & FILTERS
  // -------------------------------------------------------------
  const [adminActiveSubtab, setAdminActiveSubtab] = useState('ALL') // 'ALL' | 'OVERDUE' | 'ON_TIME'
  const [adminActiveSearch, setAdminActiveSearch] = useState('')
  const [adminActivePage, setAdminActivePage] = useState(0)

  // -------------------------------------------------------------
  // ADMIN TAB 1 (PENDING) STATE & FILTERS
  // -------------------------------------------------------------
  const [adminPendingSearch, setAdminPendingSearch] = useState('')
  const [adminPendingPage, setAdminPendingPage] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isLibrarian) {
        const records = await borrowApi.adminAll()
        setAdminRecords(records || [])
      } else {
        const userHistory = await borrowApi.history()
        setHistory(userHistory || [])
      }
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [isLibrarian])

  useEffect(() => {
    loadData()
  }, [loadData])

  // =============================================================
  // CUSTOMER DERIVED DATA
  // =============================================================
  const activeLoans = useMemo(() => history.filter((r) => r.status === 'BORROWED'), [history])
  const pendingRequests = useMemo(() => history.filter((r) => r.status === 'PENDING'), [history])
  const totalActiveLoans = activeLoans.length + pendingRequests.length
  const overdueLoans = useMemo(() => activeLoans.filter((r) => r.overdue || r.overdueDays > 0), [activeLoans])
  const completedHistory = useMemo(() => {
    return history.filter((r) => r.status !== 'PENDING')
  }, [history])

  const customerCounts = useMemo(() => {
    return {
      all: completedHistory.length,
      returned: completedHistory.filter((r) => r.status === 'RETURNED').length,
      rejected: completedHistory.filter((r) => r.status === 'REJECTED').length,
      penalty: completedHistory.filter((r) => r.penaltyAmount && Number(r.penaltyAmount) > 0).length,
    }
  }, [completedHistory])

  const filteredCustomerHistory = useMemo(() => {
    return completedHistory.filter((r) => {
      // Subtab filter
      if (customerHistTab === 'RETURNED' && r.status !== 'RETURNED') return false
      if (customerHistTab === 'REJECTED' && r.status !== 'REJECTED') return false
      if (customerHistTab === 'PENALTY' && (!r.penaltyAmount || Number(r.penaltyAmount) <= 0)) return false

      // Time range filter
      if (!recordMatchesDate(r, customerTimeRange, customerCustomFrom, customerCustomTo)) return false

      // Search filter
      if (customerSearch.trim()) {
        const query = customerSearch.trim().toLowerCase()
        const titleMatch = r.bookTitle?.toLowerCase().includes(query)
        if (!titleMatch) return false
      }

      return true
    })
  }, [completedHistory, customerHistTab, customerTimeRange, customerCustomFrom, customerCustomTo, customerSearch])

  const isCustomerFilterActive =
    customerHistTab !== 'ALL' ||
    customerTimeRange !== 'ALL' ||
    customerCustomFrom !== '' ||
    customerCustomTo !== '' ||
    customerSearch.trim() !== ''

  const resetCustomerFilters = () => {
    setCustomerHistTab('ALL')
    setCustomerTimeRange('ALL')
    setCustomerCustomFrom('')
    setCustomerCustomTo('')
    setCustomerSearch('')
    setCustomerPage(0)
  }

  const CUSTOMER_PAGE_SIZE = 8
  const customerTotalPages = Math.ceil(filteredCustomerHistory.length / CUSTOMER_PAGE_SIZE) || 1
  const paginatedCustomerHistory = useMemo(() => {
    const start = customerPage * CUSTOMER_PAGE_SIZE
    return filteredCustomerHistory.slice(start, start + CUSTOMER_PAGE_SIZE)
  }, [filteredCustomerHistory, customerPage])

  // =============================================================
  // ADMIN TAB 1: PENDING DERIVED DATA
  // =============================================================
  const pendingList = useMemo(() => {
    return adminRecords.filter((r) => r.status === 'PENDING')
  }, [adminRecords])

  const filteredPendingList = useMemo(() => {
    if (!adminPendingSearch.trim()) return pendingList
    const query = adminPendingSearch.trim().toLowerCase()
    return pendingList.filter((r) => {
      const titleMatch = r.bookTitle?.toLowerCase().includes(query)
      const nameMatch = r.memberName?.toLowerCase().includes(query)
      const emailMatch = r.memberEmail?.toLowerCase().includes(query)
      return titleMatch || nameMatch || emailMatch
    })
  }, [pendingList, adminPendingSearch])

  const ADMIN_PENDING_PAGE_SIZE = 10
  const adminPendingTotalPages = Math.ceil(filteredPendingList.length / ADMIN_PENDING_PAGE_SIZE) || 1
  const paginatedPendingList = useMemo(() => {
    const start = adminPendingPage * ADMIN_PENDING_PAGE_SIZE
    return filteredPendingList.slice(start, start + ADMIN_PENDING_PAGE_SIZE)
  }, [filteredPendingList, adminPendingPage])

  // =============================================================
  // ADMIN TAB 2: ACTIVE & OVERDUE DERIVED DATA
  // =============================================================
  const activeList = useMemo(() => {
    return adminRecords.filter((r) => r.status === 'BORROWED')
  }, [adminRecords])

  const overdueList = useMemo(() => {
    return activeList.filter((r) => r.overdue || r.overdueDays > 0)
  }, [activeList])

  const onTimeList = useMemo(() => {
    return activeList.filter((r) => !r.overdue && !(r.overdueDays > 0))
  }, [activeList])

  const filteredActiveList = useMemo(() => {
    return activeList.filter((r) => {
      const isOver = r.overdue || r.overdueDays > 0
      if (adminActiveSubtab === 'OVERDUE' && !isOver) return false
      if (adminActiveSubtab === 'ON_TIME' && isOver) return false

      if (adminActiveSearch.trim()) {
        const query = adminActiveSearch.trim().toLowerCase()
        const titleMatch = r.bookTitle?.toLowerCase().includes(query)
        const nameMatch = r.memberName?.toLowerCase().includes(query)
        const emailMatch = r.memberEmail?.toLowerCase().includes(query)
        const idMatch = String(r.id) === query.replace('#', '')
        if (!titleMatch && !nameMatch && !emailMatch && !idMatch) return false
      }

      return true
    })
  }, [activeList, adminActiveSubtab, adminActiveSearch])

  const ADMIN_ACTIVE_PAGE_SIZE = 10
  const adminActiveTotalPages = Math.ceil(filteredActiveList.length / ADMIN_ACTIVE_PAGE_SIZE) || 1
  const paginatedActiveList = useMemo(() => {
    const start = adminActivePage * ADMIN_ACTIVE_PAGE_SIZE
    return filteredActiveList.slice(start, start + ADMIN_ACTIVE_PAGE_SIZE)
  }, [filteredActiveList, adminActivePage])

  // =============================================================
  // ADMIN TAB 3: CIRCULATION HISTORY DERIVED DATA
  // =============================================================
  const adminRawHistory = useMemo(() => {
    return adminRecords.filter((r) => r.status === 'RETURNED' || r.status === 'REJECTED')
  }, [adminRecords])

  const adminHistCounts = useMemo(() => {
    return {
      all: adminRawHistory.length,
      returned: adminRawHistory.filter((r) => r.status === 'RETURNED').length,
      rejected: adminRawHistory.filter((r) => r.status === 'REJECTED').length,
      penalty: adminRawHistory.filter((r) => r.penaltyAmount && Number(r.penaltyAmount) > 0).length,
    }
  }, [adminRawHistory])

  const filteredAdminHistory = useMemo(() => {
    return adminRawHistory.filter((r) => {
      // Subtab filter
      if (adminHistTab === 'RETURNED' && r.status !== 'RETURNED') return false
      if (adminHistTab === 'REJECTED' && r.status !== 'REJECTED') return false
      if (adminHistTab === 'PENALTY' && (!r.penaltyAmount || Number(r.penaltyAmount) <= 0)) return false

      // Time range filter
      if (!recordMatchesDate(r, adminTimeRange, adminCustomFrom, adminCustomTo)) return false

      // Search filter
      if (adminHistSearch.trim()) {
        const query = adminHistSearch.trim().toLowerCase()
        const titleMatch = r.bookTitle?.toLowerCase().includes(query)
        const nameMatch = r.memberName?.toLowerCase().includes(query)
        const emailMatch = r.memberEmail?.toLowerCase().includes(query)
        const idMatch = String(r.id) === query.replace('#', '')
        if (!titleMatch && !nameMatch && !emailMatch && !idMatch) return false
      }

      return true
    })
  }, [adminRawHistory, adminHistTab, adminTimeRange, adminCustomFrom, adminCustomTo, adminHistSearch])

  const totalFilteredPenalty = useMemo(() => {
    return filteredAdminHistory.reduce((acc, r) => acc + (Number(r.penaltyAmount) || 0), 0)
  }, [filteredAdminHistory])

  const isAdminHistFilterActive =
    adminHistTab !== 'ALL' ||
    adminTimeRange !== 'ALL' ||
    adminCustomFrom !== '' ||
    adminCustomTo !== '' ||
    adminHistSearch.trim() !== ''

  const resetAdminHistFilters = () => {
    setAdminHistTab('ALL')
    setAdminTimeRange('ALL')
    setAdminCustomFrom('')
    setAdminCustomTo('')
    setAdminHistSearch('')
    setAdminHistPage(0)
  }

  const ADMIN_HIST_PAGE_SIZE = 10
  const adminHistTotalPages = Math.ceil(filteredAdminHistory.length / ADMIN_HIST_PAGE_SIZE) || 1
  const paginatedAdminHistory = useMemo(() => {
    const start = adminHistPage * ADMIN_HIST_PAGE_SIZE
    return filteredAdminHistory.slice(start, start + ADMIN_HIST_PAGE_SIZE)
  }, [filteredAdminHistory, adminHistPage])

  // =============================================================
  // ACTION HANDLERS
  // =============================================================
  const openInspectionModal = (record) => {
    setInspectionRecord(record)
    setInspectionCondition('INTACT')
    setInspectionDamageFee(0)
    setInspectionNotes('')
    setError('')
  }

  const handleSelectCondition = (condKey) => {
    setInspectionCondition(condKey)
    const preset = CONDITION_MAP[condKey]?.defaultFee ?? 0
    setInspectionDamageFee(preset)
  }

  const handleConfirmReturnInspection = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!inspectionRecord) return
    setInspectionSubmitting(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        condition: inspectionCondition,
        damageFee: Number(inspectionDamageFee) || 0,
        notes: inspectionNotes.trim() || undefined,
      }
      await borrowApi.giveBack(inspectionRecord.id, payload)
      const condInfo = CONDITION_MAP[inspectionCondition]
      const restockNote = condInfo?.restock
        ? 'Tồn kho khả dụng của sách đã được tăng thêm +1.'
        : 'Do sách bị hư hỏng nặng hoặc mất, sách không được cộng lại vào tồn kho khả dụng.'
      setNotice(
        `Đã tiếp nhận và duyệt hoàn trả cuốn "${inspectionRecord.bookTitle}". Tình trạng: ${condInfo?.label || inspectionCondition}. ${restockNote}`
      )
      setInspectionRecord(null)
      await loadData()
    } catch (err) {
      setError(readError(err))
    } finally {
      setInspectionSubmitting(false)
    }
  }

  const handleAction = async () => {
    if (!confirmAction) return
    const { type, record } = confirmAction
    setBusyId(record.id)
    setError('')
    setNotice('')
    try {
      if (type === 'APPROVE') {
        await borrowApi.approve(record.id)
        setNotice(`Đã phê duyệt yêu cầu mượn cuốn "${record.bookTitle}". Kho sách đã được cập nhật.`)
      } else if (type === 'REJECT') {
        await borrowApi.reject(record.id)
        setNotice(`Đã từ chối yêu cầu mượn cuốn "${record.bookTitle}".`)
      } else if (type === 'RETURN') {
        await borrowApi.giveBack(record.id)
        setNotice(`Đã xác nhận hoàn trả cuốn "${record.bookTitle}". Tồn kho khả dụng đã tăng thêm 1.`)
      } else if (type === 'CANCEL') {
        await borrowApi.cancel(record.id)
        setNotice(`Đã huỷ yêu cầu mượn cuốn "${record.bookTitle}".`)
      }
      setConfirmAction(null)
      await loadData()
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusyId(null)
    }
  }

  const handleSendReminder = async (record) => {
    setBusyReminderId(record.id)
    setError('')
    try {
      await borrowApi.sendReminder(record.id)
      setNotice(
        `Đã gửi email nhắc nhở hạn trả sách tới bạn đọc ${record.memberEmail || ''} (${record.memberName || 'Độc giả'}) thành công!`
      )
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusyReminderId(null)
    }
  }

  const handleSendBatchReminders = async () => {
    setBatchReminderBusy(true)
    setError('')
    try {
      const res = await borrowApi.sendDueRemindersBatch()
      const count = res?.data ?? 0
      setNotice(`Đã quét toàn bộ hệ thống và gửi thành công ${count} email nhắc nhở hạn trả sách tới các bạn đọc!`)
    } catch (err) {
      setError(readError(err))
    } finally {
      setBatchReminderBusy(false)
    }
  }

  // Cover image fallback renderer
  const renderCoverThumbnail = (record, size = 38) => {
    const height = Math.round((size * 4) / 3)
    if (record.bookImgUrl) {
      return (
        <img
          src={record.bookImgUrl}
          alt={record.bookTitle}
          style={{
            width: size,
            height,
            objectFit: 'cover',
            borderRadius: 'var(--radius-xs)',
            flexShrink: 0,
            boxShadow: 'var(--shadow-xs)',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex'
            }
          }}
        />
      )
    }
    return (
      <div
        style={{
          width: size,
          height,
          borderRadius: 'var(--radius-xs)',
          backgroundColor: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border-default)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-text-tertiary)',
          flexShrink: 0,
        }}
      >
        <BookIcon width={16} height={16} />
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isLibrarian ? 'Quản lý lưu thông & mượn trả sách' : 'Mượn và trả sách'}</h1>
        </div>
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-small btn-secondary"
              onClick={loadData}
              style={{ marginLeft: 12 }}
            >
              Thử tải lại
            </button>
          </div>
        </Alert>
      )}

      {/* =========================================================================
          ADMIN VIEW: CIRCULATION & APPROVAL MANAGEMENT
          ========================================================================= */}
      {isLibrarian ? (
        <section>
          {/* Segmented Main Tabs for Admin */}
          <div className="segmented-tabs" role="tablist" aria-label="Phân loại nghiệp vụ lưu thông">
            <button
              type="button"
              role="tab"
              aria-selected={adminTab === 'PENDING'}
              className={`segmented-tab ${adminTab === 'PENDING' ? 'active' : ''}`}
              onClick={() => {
                setAdminTab('PENDING')
                setAdminPendingPage(0)
              }}
            >
              <span>Yêu cầu chờ duyệt</span>
              {pendingList.length > 0 && (
                <span className="segmented-tab-count" style={{ backgroundColor: 'var(--color-warn)', color: '#fff' }}>
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={adminTab === 'ACTIVE'}
              className={`segmented-tab ${adminTab === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => {
                setAdminTab('ACTIVE')
                setAdminActivePage(0)
              }}
            >
              <span>Đang mượn & Quá hạn</span>
              {overdueList.length > 0 ? (
                <span className="segmented-tab-count" style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}>
                  {overdueList.length} quá hạn
                </span>
              ) : (
                <span className="segmented-tab-count">{activeList.length}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={adminTab === 'HISTORY'}
              className={`segmented-tab ${adminTab === 'HISTORY' ? 'active' : ''}`}
              onClick={() => {
                setAdminTab('HISTORY')
                setAdminHistPage(0)
              }}
            >
              <span>Lịch sử lưu thông</span>
              <span className="segmented-tab-count">{adminRawHistory.length}</span>
            </button>
          </div>

          {loading ? (
            <Skeleton rows={6} />
          ) : adminTab === 'PENDING' ? (
            /* =================================================================
               ADMIN TAB 1: PENDING REQUESTS FOR APPROVAL
               ================================================================= */
            pendingList.length === 0 ? (
              <EmptyState
                icon="circulation"
                title="Không có yêu cầu mượn nào chờ duyệt"
                description="Khi độc giả gửi yêu cầu mượn sách từ danh mục, danh sách chờ duyệt sẽ xuất hiện tại đây."
              />
            ) : (
              <div>
                {/* Search Bar for Pending if multiple */}
                {pendingList.length > 4 && (
                  <div style={{ marginBottom: 14, maxWidth: 360 }}>
                    <div className="history-search-wrap">
                      <span className="history-search-icon">
                        <SearchIcon width={14} height={14} />
                      </span>
                      <input
                        type="text"
                        className="history-search-input"
                        placeholder="Tìm theo tên độc giả, email hoặc sách..."
                        value={adminPendingSearch}
                        onChange={(e) => {
                          setAdminPendingSearch(e.target.value)
                          setAdminPendingPage(0)
                        }}
                      />
                      {adminPendingSearch && (
                        <button
                          type="button"
                          className="history-search-clear"
                          onClick={() => {
                            setAdminPendingSearch('')
                            setAdminPendingPage(0)
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Bìa</th>
                        <th>Tác phẩm mượn</th>
                        <th style={{ width: 220 }}>Độc giả yêu cầu</th>
                        <th style={{ width: 130 }}>Ngày gửi</th>
                        <th style={{ width: 140 }}>Hạn mong muốn</th>
                        <th style={{ width: 130 }}>Trạng thái</th>
                        <th style={{ width: 190, textAlign: 'right' }}>Thao tác duyệt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPendingList.map((r) => (
                        <tr key={r.id}>
                          <td>{renderCoverThumbnail(r)}</td>
                          <td>
                            <div className="title">{r.bookTitle}</div>
                            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Mã sách #{r.bookId}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.memberName || 'Độc giả'}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.memberEmail}</div>
                          </td>
                          <td className="num">{formatDate(r.borrowDate)}</td>
                          <td className="num" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                            {formatDate(r.dueDate)}
                          </td>
                          <td>
                            <span className="badge badge-warn">
                              <span className="badge-dot" />
                              Chờ duyệt
                            </span>
                          </td>
                          <td className="col-actions">
                            <div className="table-action-group">
                              <button
                                className="btn btn-small btn-primary"
                                onClick={() => setConfirmAction({ type: 'APPROVE', record: r })}
                                disabled={busyId === r.id}
                                type="button"
                                title="Phê duyệt cho mượn sách này"
                              >
                                Duyệt mượn
                              </button>
                              <button
                                className="btn btn-small btn-secondary"
                                onClick={() => setConfirmAction({ type: 'REJECT', record: r })}
                                disabled={busyId === r.id}
                                type="button"
                                title="Từ chối yêu cầu này"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={adminPendingPage}
                  totalPages={adminPendingTotalPages}
                  totalElements={filteredPendingList.length}
                  onChange={setAdminPendingPage}
                />
              </div>
            )
          ) : adminTab === 'ACTIVE' ? (
            /* =================================================================
               ADMIN TAB 2: ACTIVE & OVERDUE LOANS (DIVIDED BY SUBTABS & SEARCH)
               ================================================================= */
            activeList.length === 0 ? (
              <EmptyState
                icon="check"
                title="Hiện chưa có cuốn sách nào đang được mượn"
                description="Khi bạn đọc được phê duyệt mượn sách, hồ sơ đang mượn và theo dõi hạn trả sẽ hiển thị tại đây."
              />
            ) : (
              <div>
                {/* Active Loans Filter Toolbar */}
                <div className="history-toolbar-card">
                  <div className="history-toolbar-row">
                    {/* Subtabs for Active vs Overdue vs On-time */}
                    <div className="history-subtabs" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={adminActiveSubtab === 'ALL'}
                        className={`history-subtab-btn ${adminActiveSubtab === 'ALL' ? 'active' : ''}`}
                        onClick={() => {
                          setAdminActiveSubtab('ALL')
                          setAdminActivePage(0)
                        }}
                      >
                        <span>Tất cả đang mượn</span>
                        <span className="history-subtab-badge">{activeList.length}</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={adminActiveSubtab === 'OVERDUE'}
                        className={`history-subtab-btn ${adminActiveSubtab === 'OVERDUE' ? 'active' : ''}`}
                        onClick={() => {
                          setAdminActiveSubtab('OVERDUE')
                          setAdminActivePage(0)
                        }}
                      >
                        <ClockIcon width={13} height={13} />
                        <span>Quá hạn cần xử lý</span>
                        <span
                          className="history-subtab-badge"
                          style={
                            overdueList.length > 0
                              ? { backgroundColor: 'var(--color-danger-surface)', color: 'var(--color-danger)' }
                              : undefined
                          }
                        >
                          {overdueList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={adminActiveSubtab === 'ON_TIME'}
                        className={`history-subtab-btn ${adminActiveSubtab === 'ON_TIME' ? 'active' : ''}`}
                        onClick={() => {
                          setAdminActiveSubtab('ON_TIME')
                          setAdminActivePage(0)
                        }}
                      >
                        <span>Trong thời hạn</span>
                        <span className="history-subtab-badge">{onTimeList.length}</span>
                      </button>
                    </div>

                    {/* Search active loans */}
                    <div className="history-controls">
                      <div className="history-search-wrap">
                        <span className="history-search-icon">
                          <SearchIcon width={14} height={14} />
                        </span>
                        <input
                          type="text"
                          className="history-search-input"
                          placeholder="Tìm bạn đọc, email hoặc tên sách..."
                          value={adminActiveSearch}
                          onChange={(e) => {
                            setAdminActiveSearch(e.target.value)
                            setAdminActivePage(0)
                          }}
                        />
                        {adminActiveSearch && (
                          <button
                            type="button"
                            className="history-search-clear"
                            onClick={() => {
                              setAdminActiveSearch('')
                              setAdminActivePage(0)
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {(adminActiveSubtab !== 'ALL' || adminActiveSearch) && (
                        <button
                          type="button"
                          className="btn btn-small btn-secondary history-reset-btn"
                          onClick={() => {
                            setAdminActiveSubtab('ALL')
                            setAdminActiveSearch('')
                            setAdminActivePage(0)
                          }}
                        >
                          Đặt lại bộ lọc
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-small btn-secondary history-reset-btn"
                        onClick={handleSendBatchReminders}
                        disabled={batchReminderBusy}
                        title="Tự động quét và gửi email nhắc nhở cho tất cả sách tới hạn hoặc quá hạn"
                      >
                        <MailIcon width={14} height={14} />
                        <span>{batchReminderBusy ? 'Đang gửi mail...' : 'Gửi mail nhắc tới hạn'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {filteredActiveList.length === 0 ? (
                  <EmptyState
                    icon="search"
                    title="Không tìm thấy cuốn sách đang mượn nào"
                    description="Không có lượt mượn nào khớp với bộ lọc hoặc từ khoá tìm kiếm."
                  />
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>Bìa</th>
                          <th>Tác phẩm</th>
                          <th style={{ width: 200 }}>Độc giả</th>
                          <th style={{ width: 120 }}>Ngày mượn</th>
                          <th style={{ width: 120 }}>Hạn hoàn trả</th>
                          <th style={{ width: 150 }}>Tình trạng</th>
                          <th style={{ width: 140 }}>Tiền phạt ước tính</th>
                          <th style={{ width: 230, textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedActiveList.map((r) => {
                          const isOver = r.overdue || r.overdueDays > 0
                          return (
                            <tr key={r.id} style={isOver ? { backgroundColor: 'var(--color-danger-bg)' } : undefined}>
                              <td>{renderCoverThumbnail(r)}</td>
                              <td>
                                <div className="title">{r.bookTitle}</div>
                                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Mã mượn #{r.id}</span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{r.memberName || 'Độc giả'}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.memberEmail}</div>
                              </td>
                              <td className="num">{formatDate(r.borrowDate)}</td>
                              <td
                                className="num"
                                style={isOver ? { color: 'var(--color-danger-text)', fontWeight: 700 } : undefined}
                              >
                                {formatDate(r.dueDate)}
                              </td>
                              <td>
                                {isOver ? (
                                  <span className="badge badge-danger">
                                    <ClockIcon width={12} height={12} />
                                    Quá hạn {r.overdueDays} ngày
                                  </span>
                                ) : (
                                  <span className="badge badge-ok">
                                    <span className="badge-dot" />
                                    Đang mượn
                                  </span>
                                )}
                              </td>
                              <td>
                                {isOver ? (
                                  <span style={{ fontWeight: 700, color: 'var(--color-danger-text)' }}>
                                    {formatMoney(r.penaltyAmount)}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--color-text-tertiary)' }}>0 đ</span>
                                )}
                              </td>
                              <td className="col-actions">
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-small btn-secondary"
                                    onClick={() => handleSendReminder(r)}
                                    disabled={busyReminderId === r.id}
                                    type="button"
                                    title={`Gửi email nhắc nhở hạn trả tới ${r.memberEmail}`}
                                  >
                                    <MailIcon width={13} height={13} />
                                    <span>{busyReminderId === r.id ? 'Đang gửi...' : 'Gửi mail nhắc'}</span>
                                  </button>
                                  <button
                                    className="btn btn-small btn-primary"
                                    onClick={() => openInspectionModal(r)}
                                    disabled={busyId === r.id}
                                    type="button"
                                    title="Kiểm tra tình trạng sách & Xác nhận duyệt trả"
                                  >
                                    <CheckCircleIcon width={13} height={13} />
                                    <span>Kiểm tra & Duyệt trả</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Pagination
                  page={adminActivePage}
                  totalPages={adminActiveTotalPages}
                  totalElements={filteredActiveList.length}
                  onChange={setAdminActivePage}
                />
              </div>
            )
          ) : (
            /* =================================================================
               ADMIN TAB 3: CIRCULATION HISTORY (TABBED + DATE FILTER + SEARCH + PAGINATION)
               ================================================================= */
            <div>
              {/* Comprehensive History Toolbar */}
              <div className="history-toolbar-card">
                <div className="history-toolbar-row">
                  {/* Status Subtabs */}
                  <div className="history-subtabs" role="tablist" aria-label="Bộ lọc trạng thái lịch sử">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={adminHistTab === 'ALL'}
                      className={`history-subtab-btn ${adminHistTab === 'ALL' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminHistTab('ALL')
                        setAdminHistPage(0)
                      }}
                    >
                      <span>Tất cả lịch sử</span>
                      <span className="history-subtab-badge">{adminHistCounts.all}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={adminHistTab === 'RETURNED'}
                      className={`history-subtab-btn ${adminHistTab === 'RETURNED' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminHistTab('RETURNED')
                        setAdminHistPage(0)
                      }}
                    >
                      <CheckCircleIcon width={13} height={13} />
                      <span>Đã hoàn trả</span>
                      <span className="history-subtab-badge">{adminHistCounts.returned}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={adminHistTab === 'REJECTED'}
                      className={`history-subtab-btn ${adminHistTab === 'REJECTED' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminHistTab('REJECTED')
                        setAdminHistPage(0)
                      }}
                    >
                      <AlertCircleIcon width={13} height={13} />
                      <span>Đã từ chối</span>
                      <span className="history-subtab-badge">{adminHistCounts.rejected}</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={adminHistTab === 'PENALTY'}
                      className={`history-subtab-btn ${adminHistTab === 'PENALTY' ? 'active' : ''}`}
                      onClick={() => {
                        setAdminHistTab('PENALTY')
                        setAdminHistPage(0)
                      }}
                    >
                      <ClockIcon width={13} height={13} />
                      <span>Phạt vi phạm</span>
                      <span className="history-subtab-badge">{adminHistCounts.penalty}</span>
                    </button>
                  </div>

                  {/* Date and Search Controls */}
                  <div className="history-controls">
                    {/* Time Range Select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CalendarIcon width={15} height={15} style={{ color: 'var(--color-text-tertiary)' }} />
                      <select
                        className="history-date-select"
                        value={adminTimeRange}
                        onChange={(e) => {
                          setAdminTimeRange(e.target.value)
                          setAdminHistPage(0)
                        }}
                        aria-label="Lọc theo khoảng thời gian"
                      >
                        <option value="ALL">Tất cả thời gian</option>
                        <option value="TODAY">Hôm nay</option>
                        <option value="THIS_WEEK">Tuần này</option>
                        <option value="THIS_MONTH">Trong tháng này</option>
                        <option value="CUSTOM">Tùy chọn khoảng ngày...</option>
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="history-search-wrap">
                      <span className="history-search-icon">
                        <SearchIcon width={14} height={14} />
                      </span>
                      <input
                        type="text"
                        className="history-search-input"
                        placeholder="Tìm tên sách, độc giả, email hoặc #mã..."
                        value={adminHistSearch}
                        onChange={(e) => {
                          setAdminHistSearch(e.target.value)
                          setAdminHistPage(0)
                        }}
                      />
                      {adminHistSearch && (
                        <button
                          type="button"
                          className="history-search-clear"
                          onClick={() => {
                            setAdminHistSearch('')
                            setAdminHistPage(0)
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {isAdminHistFilterActive && (
                      <button
                        type="button"
                        className="btn btn-small btn-secondary history-reset-btn"
                        onClick={resetAdminHistFilters}
                      >
                        Đặt lại bộ lọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Date Pickers if selected */}
                {adminTimeRange === 'CUSTOM' && (
                  <div className="history-custom-dates">
                    <span style={{ fontWeight: 600 }}>Khoảng ngày:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Từ ngày:
                      <input
                        type="date"
                        className="history-date-input"
                        value={adminCustomFrom}
                        onChange={(e) => {
                          setAdminCustomFrom(e.target.value)
                          setAdminHistPage(0)
                        }}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Đến ngày:
                      <input
                        type="date"
                        className="history-date-input"
                        value={adminCustomTo}
                        onChange={(e) => {
                          setAdminCustomTo(e.target.value)
                          setAdminHistPage(0)
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              {filteredAdminHistory.length === 0 ? (
                <EmptyState
                  icon="circulation"
                  title="Không tìm thấy hồ sơ lưu thông phù hợp"
                  description="Thử thay đổi bộ lọc trạng thái, mở rộng mốc thời gian hoặc xoá từ khoá tìm kiếm."
                  action={
                    isAdminHistFilterActive ? (
                      <button type="button" className="btn btn-secondary btn-small" onClick={resetAdminHistFilters}>
                        Đặt lại bộ lọc
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Bìa</th>
                        <th>Tác phẩm</th>
                        <th style={{ width: 190 }}>Độc giả</th>
                        <th style={{ width: 105 }}>Ngày mượn</th>
                        <th style={{ width: 105 }}>Hạn trả</th>
                        <th style={{ width: 105 }}>Ngày thực trả</th>
                        <th style={{ width: 140 }}>Tình trạng khi trả</th>
                        <th style={{ width: 150 }}>Khoản thu / Phạt</th>
                        <th style={{ width: 110 }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAdminHistory.map((r) => {
                        const penalty = Number(r.penaltyAmount) || 0
                        const damage = Number(r.damageFee) || 0
                        const total = Number(r.totalFineAmount) || (penalty + damage)
                        return (
                          <tr key={r.id}>
                            <td>{renderCoverThumbnail(r)}</td>
                            <td>
                              <div className="title">{r.bookTitle}</div>
                              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Mã mượn #{r.id}</span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.memberName || 'Độc giả'}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{r.memberEmail}</div>
                            </td>
                            <td className="num">{formatDate(r.borrowDate)}</td>
                            <td className="num">{formatDate(r.dueDate)}</td>
                            <td className="num">{formatDate(r.returnDate)}</td>
                            <td>
                              {r.status === 'RETURNED' ? (
                                renderConditionBadge(r.bookCondition, r.returnNotes)
                              ) : (
                                <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                              )}
                            </td>
                            <td>
                              {total > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <span style={{ color: 'var(--color-danger-text)', fontWeight: 700 }}>
                                    {formatMoney(total)}
                                  </span>
                                  {(penalty > 0 || damage > 0) && (
                                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                      {penalty > 0 && `Trễ: ${formatMoney(penalty)}`}
                                      {penalty > 0 && damage > 0 && ' · '}
                                      {damage > 0 && `Hư hại: ${formatMoney(damage)}`}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--color-text-tertiary)' }}>0 đ</span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  r.status === 'RETURNED'
                                    ? 'badge-neutral'
                                    : r.status === 'REJECTED'
                                    ? 'badge-danger'
                                    : 'badge-warn'
                                }`}
                              >
                                <span className="badge-dot" />
                                {r.status === 'RETURNED'
                                  ? 'Đã hoàn trả'
                                  : r.status === 'REJECTED'
                                  ? 'Đã từ chối'
                                  : r.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination
                page={adminHistPage}
                totalPages={adminHistTotalPages}
                totalElements={filteredAdminHistory.length}
                onChange={setAdminHistPage}
              />
            </div>
          )}
        </section>
      ) : (
        /* =========================================================================
            CUSTOMER VIEW: MY ACTIVE LOAN, PENDING REQUESTS & TABBED/PAGINATED HISTORY
            ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Bảng Quy định mượn trả & Biểu phí dịch vụ */}
          <div className="regulation-card">
            <div className="regulation-header">
              <div className="regulation-header-left">
                <div style={{ color: 'var(--color-brand)' }}>
                  <BookIcon width={20} height={20} />
                </div>
                <h3 className="regulation-title">Quy định mượn trả & Biểu phí dịch vụ thư viện</h3>
              </div>
              <span className="badge badge-neutral">Áp dụng toàn hệ thống</span>
            </div>

            <div className="regulation-grid">
              {/* Section 1: Quy định mượn tài liệu */}
              <div className="regulation-section">
                <div className="regulation-section-title">
                  <CirculationIcon width={14} height={14} />
                  Quy định mượn tài liệu
                </div>
                <ul className="regulation-list">
                  <li>
                    <span className="regulation-dot" />
                    <span><strong>Số lượng mượn:</strong> 2 cuốn / 1 lần mượn.</span>
                  </li>
                  <li>
                    <span className="regulation-dot" />
                    <span><strong>Thời hạn mượn:</strong> 10 ngày kể từ ngày nhận tài liệu.</span>
                  </li>
                  <li>
                    <span className="regulation-dot" />
                    <span><strong>Thời gian đáp ứng yêu cầu:</strong> 1 – 3 ngày làm việc.</span>
                  </li>
                  <li>
                    <span className="regulation-dot" />
                    <span><strong>Tài liệu được mượn:</strong> Thực hiện theo quy định của thư viện.</span>
                  </li>
                  <li>
                    <span className="regulation-dot" />
                    <span><strong>Tài liệu không được mượn:</strong> Chỉ được đọc tại chỗ theo quy định.</span>
                  </li>
                </ul>
              </div>

              {/* Section 2: Biểu phí sử dụng dịch vụ */}
              <div className="regulation-section">
                <div className="regulation-section-title">
                  <ClockIcon width={14} height={14} />
                  Biểu phí sử dụng dịch vụ
                </div>
                <div className="fee-list">
                  <div className="fee-item">
                    <span className="fee-item-name">Phí dịch vụ mượn sách</span>
                    <span className="fee-item-val fee-highlight">20.000 đ/lần mượn</span>
                  </div>
                  <div className="fee-item">
                    <span className="fee-item-name">Phí phạt trễ hạn</span>
                    <span className="fee-item-val" style={{ color: 'var(--color-danger)' }}>5.000 đ/cuốn/ngày</span>
                  </div>
                  <div className="fee-item">
                    <span className="fee-item-name">Mất tài liệu</span>
                    <span className="fee-item-val">3x giá bìa + 50.000 đ kỹ thuật</span>
                  </div>
                  <div className="fee-item">
                    <span className="fee-item-name">Tài liệu hư hỏng</span>
                    <span className="fee-item-val">Đền bù theo mức độ hư hỏng</span>
                  </div>
                  <div className="fee-item">
                    <span className="fee-item-name">Gửi bưu điện (EMS, thường,...)</span>
                    <span className="fee-item-val">Theo cước bưu điện</span>
                  </div>
                  <div className="fee-item">
                    <span className="fee-item-name">Chi phí khác (chuyển khoản, liên lạc)</span>
                    <span className="fee-item-val">Thoả thuận theo giá</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Banner if any current loan is overdue */}
          {overdueLoans.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
              role="alert"
            >
              <div style={{ color: 'var(--color-danger)', marginTop: 2 }}>
                <AlertCircleIcon width={22} height={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-danger-text)', marginBottom: 4 }}>
                  Bạn có {overdueLoans.length} cuốn sách đã quá hạn hoàn trả!
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Phí phạt trễ hạn quy định là <strong style={{ color: 'var(--color-danger-text)' }}>5.000 đ/cuốn/ngày</strong>.
                  Tổng tiền phạt ước tính hiện tại: <strong style={{ color: 'var(--color-danger-text)' }}>
                    {formatMoney(overdueLoans.reduce((sum, r) => sum + (Number(r.penaltyAmount) || 0), 0))}
                  </strong>.
                  Bạn hãy sớm hoàn trả sách tại thư viện để tránh phát sinh thêm phí phạt.
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Sách đang mượn (Tối đa 2 cuốn) */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2>Sách đang mượn ({activeLoans.length}/2 cuốn)</h2>
              {totalActiveLoans < 2 && (
                <Link to="/catalog" className="btn btn-small btn-secondary">
                  + Mượn thêm sách ({2 - totalActiveLoans} lượt khả dụng)
                </Link>
              )}
            </div>

            {loading ? (
              <Skeleton rows={3} />
            ) : activeLoans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className={`circulation-slip ${loan.overdue ? 'slip-danger' : 'slip-primary'}`}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {renderCoverThumbnail(loan, 50)}
                      <div className="slip-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <DueStamp dueDate={loan.dueDate} overdue={Boolean(loan.overdue)} />
                          {loan.overdue && (
                            <span className="badge badge-danger">
                              <ClockIcon width={12} height={12} />
                              Quá hạn {loan.overdueDays} ngày · Tiền phạt: {formatMoney(loan.penaltyAmount)}
                            </span>
                          )}
                        </div>
                        <div className="slip-book">{loan.bookTitle}</div>
                        <div className="slip-meta">
                          Ngày mượn: <span className="data">{formatDate(loan.borrowDate)}</span>
                          <span style={{ marginLeft: 16 }}>
                            Hạn hoàn trả (10 ngày): <span className="data" style={{ fontWeight: 600 }}>{formatDate(loan.dueDate)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setCustomerGuideRecord(loan)}
                      type="button"
                      title="Xem quy trình hoàn trả sách tại quầy thư viện"
                    >
                      Trả sách tại quầy
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-brand-surface)',
                    color: 'var(--color-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BookIcon width={20} height={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
                    Hiện tại bạn không mượn cuốn sách nào
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    Theo quy định, bạn có thể mượn tối đa 2 cuốn sách cùng lúc với thời hạn 10 ngày.
                  </div>
                </div>
                <Link to="/catalog" className="btn btn-primary">
                  Xem danh mục sách
                </Link>
              </div>
            )}
          </section>

          {/* Section 2: Yêu cầu mượn đang chờ duyệt */}
          {pendingRequests.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <h2>Yêu cầu mượn đang chờ duyệt ({pendingRequests.length})</h2>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Thời gian tiếp nhận & xử lý yêu cầu: <strong>1 – 3 ngày làm việc</strong>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-warn-bg)',
                      border: '1px solid var(--color-warn-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {renderCoverThumbnail(req, 42)}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
                          {req.bookTitle}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                          Ngày gửi yêu cầu: <strong>{formatDate(req.borrowDate)}</strong> · Hạn trả mong muốn:{' '}
                          <strong style={{ color: 'var(--color-brand)' }}>{formatDate(req.dueDate)}</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="badge badge-warn">
                        <span className="badge-dot" />
                        Đang chờ duyệt (1 – 3 ngày)
                      </span>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => setConfirmAction({ type: 'CANCEL', record: req })}
                        disabled={busyId === req.id}
                        type="button"
                        style={{ color: 'var(--color-danger-text)' }}
                      >
                        Huỷ yêu cầu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Lich su muon tra cua ban (TABBED + DATE FILTER + SEARCH + PAGINATED) */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div>
                <h2>Lịch sử mượn & trả sách của bạn</h2>
              </div>
            </div>

            {loading ? (
              <Skeleton rows={4} />
            ) : completedHistory.length === 0 ? (
              <EmptyState
                icon="circulation"
                title="Chưa có lượt mượn nào trong lịch sử"
                description="Các cuốn sách bạn đã mượn và hoàn trả sẽ được lưu lại toàn bộ tại đây để bạn tiện theo dõi hành trình đọc."
              />
            ) : (
              <div>
                {/* Customer History Toolbar Card */}
                <div className="history-toolbar-card">
                  <div className="history-toolbar-row">
                    {/* Status Subtabs */}
                    <div className="history-subtabs" role="tablist" aria-label="Bộ lọc lịch sử của bạn">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={customerHistTab === 'ALL'}
                        className={`history-subtab-btn ${customerHistTab === 'ALL' ? 'active' : ''}`}
                        onClick={() => {
                          setCustomerHistTab('ALL')
                          setCustomerPage(0)
                        }}
                      >
                        <span>Tất cả</span>
                        <span className="history-subtab-badge">{customerCounts.all}</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={customerHistTab === 'RETURNED'}
                        className={`history-subtab-btn ${customerHistTab === 'RETURNED' ? 'active' : ''}`}
                        onClick={() => {
                          setCustomerHistTab('RETURNED')
                          setCustomerPage(0)
                        }}
                      >
                        <CheckCircleIcon width={13} height={13} />
                        <span>Đã hoàn trả</span>
                        <span className="history-subtab-badge">{customerCounts.returned}</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={customerHistTab === 'REJECTED'}
                        className={`history-subtab-btn ${customerHistTab === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => {
                          setCustomerHistTab('REJECTED')
                          setCustomerPage(0)
                        }}
                      >
                        <AlertCircleIcon width={13} height={13} />
                        <span>Bị từ chối</span>
                        <span className="history-subtab-badge">{customerCounts.rejected}</span>
                      </button>

                      {customerCounts.penalty > 0 && (
                        <button
                          type="button"
                          role="tab"
                          aria-selected={customerHistTab === 'PENALTY'}
                          className={`history-subtab-btn ${customerHistTab === 'PENALTY' ? 'active' : ''}`}
                          onClick={() => {
                            setCustomerHistTab('PENALTY')
                            setCustomerPage(0)
                          }}
                        >
                          <ClockIcon width={13} height={13} />
                          <span>Có phí phạt</span>
                          <span className="history-subtab-badge">{customerCounts.penalty}</span>
                        </button>
                      )}
                    </div>

                    {/* Time Range and Search */}
                    <div className="history-controls">
                      {/* Time Select */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CalendarIcon width={15} height={15} style={{ color: 'var(--color-text-tertiary)' }} />
                        <select
                          className="history-date-select"
                          value={customerTimeRange}
                          onChange={(e) => {
                            setCustomerTimeRange(e.target.value)
                            setCustomerPage(0)
                          }}
                          aria-label="Lọc thời gian mượn"
                        >
                          <option value="ALL">Tất cả thời gian</option>
                          <option value="THIS_WEEK">Tuần này</option>
                          <option value="THIS_MONTH">Tháng này</option>
                          <option value="THIS_YEAR">Năm nay</option>
                          <option value="CUSTOM">Tùy chọn khoảng ngày...</option>
                        </select>
                      </div>

                      {/* Search */}
                      <div className="history-search-wrap">
                        <span className="history-search-icon">
                          <SearchIcon width={14} height={14} />
                        </span>
                        <input
                          type="text"
                          className="history-search-input"
                          placeholder="Tìm kiếm tác phẩm..."
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value)
                            setCustomerPage(0)
                          }}
                        />
                        {customerSearch && (
                          <button
                            type="button"
                            className="history-search-clear"
                            onClick={() => {
                              setCustomerSearch('')
                              setCustomerPage(0)
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {isCustomerFilterActive && (
                        <button
                          type="button"
                          className="btn btn-small btn-secondary history-reset-btn"
                          onClick={resetCustomerFilters}
                        >
                          Đặt lại bộ lọc
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Custom Dates Input if selected */}
                  {customerTimeRange === 'CUSTOM' && (
                    <div className="history-custom-dates">
                      <span style={{ fontWeight: 600 }}>Khoảng ngày:</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Từ ngày:
                        <input
                          type="date"
                          className="history-date-input"
                          value={customerCustomFrom}
                          onChange={(e) => {
                            setCustomerCustomFrom(e.target.value)
                            setCustomerPage(0)
                          }}
                        />
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Đến ngày:
                        <input
                          type="date"
                          className="history-date-input"
                          value={customerCustomTo}
                          onChange={(e) => {
                            setCustomerCustomTo(e.target.value)
                            setCustomerPage(0)
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {filteredCustomerHistory.length === 0 ? (
                  <EmptyState
                    icon="circulation"
                    title="Không tìm thấy lịch sử phù hợp"
                    description="Không có lượt mượn nào khớp với trạng thái, mốc thời gian hoặc từ khoá tìm kiếm của bạn."
                    action={
                      isCustomerFilterActive ? (
                        <button type="button" className="btn btn-secondary btn-small" onClick={resetCustomerFilters}>
                          Đặt lại bộ lọc
                        </button>
                      ) : undefined
                    }
                  />
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>Bìa</th>
                          <th>Tên tác phẩm</th>
                          <th style={{ width: 130 }}>Ngày mượn</th>
                          <th style={{ width: 130 }}>Hạn hoàn trả</th>
                          <th style={{ width: 130 }}>Ngày thực trả</th>
                          <th style={{ width: 140 }}>Tình trạng sách</th>
                          <th style={{ width: 140 }}>Chi phí phát sinh</th>
                          <th style={{ width: 120 }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCustomerHistory.map((r) => {
                          const isOver = r.overdue || r.overdueDays > 0
                          const penalty = Number(r.penaltyAmount) || 0
                          const damage = Number(r.damageFee) || 0
                          const total = Number(r.totalFineAmount) || (penalty + damage)
                          return (
                            <tr key={r.id}>
                              <td>{renderCoverThumbnail(r, 34)}</td>
                              <td className="title">{r.bookTitle}</td>
                              <td className="num">{formatDate(r.borrowDate)}</td>
                              <td className="num">{formatDate(r.dueDate)}</td>
                              <td className="num">{r.returnDate ? formatDate(r.returnDate) : 'Đang giữ sách'}</td>
                              <td>
                                {r.status === 'RETURNED' ? (
                                  renderConditionBadge(r.bookCondition, r.returnNotes)
                                ) : (
                                  <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                                )}
                              </td>
                              <td>
                                {total > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span style={{ color: 'var(--color-danger-text)', fontWeight: 700 }}>
                                      {formatMoney(total)}
                                    </span>
                                    {(penalty > 0 || damage > 0) && (
                                      <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                        {penalty > 0 && `Trễ: ${formatMoney(penalty)}`}
                                        {penalty > 0 && damage > 0 && ' · '}
                                        {damage > 0 && `Bồi thường: ${formatMoney(damage)}`}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--color-text-tertiary)' }}>0 đ</span>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    r.status === 'RETURNED'
                                      ? 'badge-neutral'
                                      : r.status === 'REJECTED'
                                      ? 'badge-danger'
                                      : isOver
                                      ? 'badge-danger'
                                      : 'badge-warn'
                                  }`}
                                >
                                  <span className="badge-dot" />
                                  {r.status === 'RETURNED'
                                    ? 'Đã hoàn trả'
                                    : r.status === 'REJECTED'
                                    ? 'Đã từ chối'
                                    : isOver
                                    ? `Quá hạn ${r.overdueDays} ngày`
                                    : 'Đang mượn'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Pagination
                  page={customerPage}
                  totalPages={customerTotalPages}
                  totalElements={filteredCustomerHistory.length}
                  onChange={setCustomerPage}
                />
              </div>
            )}
          </section>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'APPROVE'
            ? 'Xác nhận phê duyệt yêu cầu mượn sách'
            : confirmAction?.type === 'REJECT'
            ? 'Xác nhận từ chối yêu cầu mượn sách'
            : confirmAction?.type === 'CANCEL'
            ? 'Xác nhận huỷ yêu cầu mượn'
            : 'Xác nhận trả sách'
        }
        message={
          confirmAction?.type === 'APPROVE'
            ? `Bạn có chắc chắn muốn phê duyệt cho độc giả "${confirmAction?.record?.memberName || confirmAction?.record?.memberEmail}" mượn cuốn "${confirmAction?.record?.bookTitle}" với hạn trả đến ngày ${formatDate(confirmAction?.record?.dueDate)}? Số lượng sách trong kho sẽ giảm 1.`
            : confirmAction?.type === 'REJECT'
            ? `Bạn có chắc chắn muốn từ chối yêu cầu mượn cuốn "${confirmAction?.record?.bookTitle}"?`
            : confirmAction?.type === 'CANCEL'
            ? `Bạn có chắc chắn muốn huỷ yêu cầu mượn cuốn sách "${confirmAction?.record?.bookTitle}"?`
            : `Xác nhận hoàn tất trả cuốn sách "${confirmAction?.record?.bookTitle}"? Số lượng sách khả dụng trong kho sẽ tăng thêm 1.`
        }
        confirmLabel={
          confirmAction?.type === 'APPROVE'
            ? 'Phê duyệt cho mượn'
            : confirmAction?.type === 'REJECT'
            ? 'Từ chối yêu cầu'
            : confirmAction?.type === 'CANCEL'
            ? 'Huỷ yêu cầu'
            : 'Xác nhận trả sách'
        }
        isDanger={confirmAction?.type === 'REJECT' || confirmAction?.type === 'CANCEL'}
        busy={busyId != null}
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />

      {/* =========================================================================
          LIBRARIAN RETURN INSPECTION MODAL (THỦ THƯ KIỂM ĐỊNH & XÁC NHẬN TRẢ SÁCH)
          ========================================================================= */}
      {inspectionRecord && (
        <div className="modal-overlay" onClick={() => !inspectionSubmitting && setInspectionRecord(null)}>
          <div
            className="modal inspection-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="inspection-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="inspection-header-icon">
                  <CheckCircleIcon width={22} height={22} />
                </div>
                <div>
                  <h3 className="inspection-modal-title">Kiểm tra tình trạng sách & Xác nhận hoàn trả</h3>
                  <p className="inspection-modal-subtitle">
                    Thủ thư thẩm định hiện trạng tài liệu và chốt các khoản phí phát sinh trước khi duyệt hoàn tất.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => !inspectionSubmitting && setInspectionRecord(null)}
                disabled={inspectionSubmitting}
                aria-label="Đóng modal"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnInspection} className="inspection-modal-body">
              {/* Box 1: Thông tin sách & độc giả */}
              <div className="inspection-book-summary">
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {renderCoverThumbnail(inspectionRecord, 54)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="inspection-book-title">{inspectionRecord.bookTitle}</div>
                    <div className="inspection-book-meta">
                      <span>Mã phiếu: <strong>#{inspectionRecord.id}</strong></span>
                      <span> · Độc giả: <strong>{inspectionRecord.memberName || 'Độc giả'}</strong> ({inspectionRecord.memberEmail})</span>
                    </div>
                    <div className="inspection-loan-dates">
                      <span>Ngày mượn: <strong>{formatDate(inspectionRecord.borrowDate)}</strong></span>
                      <span> · Hạn trả: <strong style={{ color: inspectionRecord.overdue ? 'var(--color-danger-text)' : 'inherit' }}>{formatDate(inspectionRecord.dueDate)}</strong></span>
                      <span> · Ngày duyệt trả: <strong>Hôm nay</strong></span>
                    </div>

                    {inspectionRecord.overdue && (
                      <div className="inspection-overdue-alert">
                        <AlertCircleIcon width={16} height={16} />
                        <span>
                          Sách đã <strong>quá hạn {inspectionRecord.overdueDays} ngày</strong>.
                          Tiền phạt trễ hạn tự động: <strong>{formatMoney(inspectionRecord.penaltyAmount)}</strong> (5.000 đ/ngày).
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Box 2: Lựa chọn tình trạng sách */}
              <div className="inspection-section">
                <div className="inspection-section-title">
                  <BookIcon width={16} height={16} />
                  <span>1. Đánh giá tình trạng vật lý của sách khi nhận lại</span>
                </div>

                <div className="condition-card-grid">
                  {Object.values(CONDITION_MAP).map((c) => {
                    const isSelected = inspectionCondition === c.key
                    return (
                      <button
                        type="button"
                        key={c.key}
                        className={`condition-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectCondition(c.key)}
                        style={{
                          borderColor: isSelected ? c.borderColor : undefined,
                          backgroundColor: isSelected ? c.bgColor : undefined,
                        }}
                      >
                        <div className="condition-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              className="condition-radio-circle"
                              style={{
                                borderColor: isSelected ? c.borderColor : 'var(--color-border-default)',
                                backgroundColor: isSelected ? c.borderColor : 'transparent',
                              }}
                            >
                              {isSelected && <span className="condition-radio-inner" />}
                            </span>
                            <span className="condition-name" style={{ color: isSelected ? c.color : 'inherit' }}>
                              {c.label}
                            </span>
                          </div>
                          <span className={`badge ${c.badgeClass}`} style={{ fontSize: 11 }}>
                            {c.defaultFee === 0 ? 'Miễn phí' : `Gợi ý ${formatMoney(c.defaultFee)}`}
                          </span>
                        </div>
                        <p className="condition-desc">{c.description}</p>
                        <div className="condition-tag" style={{ color: c.color }}>
                          {c.tag}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Box 3: Chi phí bồi thường hư hại & Gợi ý nhanh */}
              <div className="inspection-section">
                <div className="inspection-section-title">
                  <span>2. Mức phí bồi thường hư hại / mất tài liệu</span>
                  {inspectionCondition === 'INTACT' ? (
                    <span className="inspection-optional-tag">(Sách nguyên vẹn: 0 đ)</span>
                  ) : (
                    <span className="inspection-required-tag">(Có thể điều chỉnh theo giá bìa thực tế)</span>
                  )}
                </div>

                <div className="inspection-fee-input-wrap">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: 220 }}>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        className="input inspection-fee-input"
                        value={inspectionDamageFee}
                        onChange={(e) => setInspectionDamageFee(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        disabled={inspectionCondition === 'INTACT'}
                        style={{ paddingRight: 45, fontWeight: 700, fontSize: 16 }}
                      />
                      <span className="inspection-fee-currency">VNĐ</span>
                    </div>

                    <div className="inspection-fee-presets">
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginRight: 4 }}>Gợi ý nhanh:</span>
                      {[0, 20000, 50000, 100000, 200000, 300000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className={`btn-preset ${inspectionDamageFee === preset ? 'active' : ''}`}
                          onClick={() => setInspectionDamageFee(preset)}
                          disabled={inspectionCondition === 'INTACT'}
                        >
                          {preset === 0 ? '0 đ' : formatMoney(preset)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 4: Ghi chú tình trạng của thủ thư */}
              <div className="inspection-section">
                <div className="inspection-section-title">
                  <span>3. Ghi chú kiểm tra của thủ thư (tuỳ chọn)</span>
                </div>
                <textarea
                  className="input inspection-notes-input"
                  rows={2}
                  placeholder="Ví dụ: Gáy sách bị bong góc trên, sờn bìa nhẹ; hoặc độc giả báo thất lạc trên xe bus..."
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                />
              </div>

              {/* Box 5: Bảng chốt thanh toán & Tác động kho */}
              <div className="inspection-bill-card">
                <div className="inspection-bill-title">Chốt các khoản thu khi tiếp nhận hoàn trả</div>
                <div className="inspection-bill-rows">
                  <div className="inspection-bill-row">
                    <span>Phí trễ hạn {inspectionRecord.overdue ? `(${inspectionRecord.overdueDays} ngày quá hạn)` : ''}:</span>
                    <span style={{ fontWeight: 600 }}>{formatMoney(inspectionRecord.penaltyAmount || 0)}</span>
                  </div>
                  <div className="inspection-bill-row">
                    <span>Phí bồi thường hư hỏng / mất sách:</span>
                    <span style={{ fontWeight: 600 }}>{formatMoney(inspectionDamageFee || 0)}</span>
                  </div>
                  <div className="inspection-bill-divider" />
                  <div className="inspection-bill-row total">
                    <span>Tổng số tiền thủ thư cần thu:</span>
                    <span className="inspection-bill-total">
                      {formatMoney((Number(inspectionRecord.penaltyAmount) || 0) + (Number(inspectionDamageFee) || 0))}
                    </span>
                  </div>
                </div>

                <div className="inspection-restock-info">
                  {CONDITION_MAP[inspectionCondition]?.restock ? (
                    <div style={{ color: 'var(--color-success-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckIcon width={15} height={15} />
                      <span>Sách đạt yêu cầu tiếp tục lưu thông: <strong>Tồn kho khả dụng sẽ tăng thêm +1</strong>.</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-danger-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircleIcon width={15} height={15} />
                      <span>Sách bị hư hỏng nặng hoặc mất: <strong>Tồn kho khả dụng sẽ KHÔNG tăng</strong>.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer actions */}
              <div className="inspection-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInspectionRecord(null)}
                  disabled={inspectionSubmitting}
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={inspectionSubmitting}
                  style={{ minWidth: 200 }}
                >
                  {inspectionSubmitting ? 'Đang duyệt trả...' : 'Xác nhận duyệt trả sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CUSTOMER RETURN GUIDE MODAL (HƯỚNG DẪN TRẢ SÁCH TẠI QUẦY CHO BẠN ĐỌC)
          ========================================================================= */}
      {customerGuideRecord && (
        <Modal
          title="Quy trình hoàn trả sách tại quầy"
          onClose={() => setCustomerGuideRecord(null)}
          footer={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCustomerGuideRecord(null)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Tôi đã hiểu quy trình
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-hover)',
                border: '1px solid var(--color-border-default)',
              }}
            >
              {renderCoverThumbnail(customerGuideRecord, 42)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {customerGuideRecord.bookTitle}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Mã phiếu mượn: <strong>#{customerGuideRecord.id}</strong> · Hạn trả: <strong>{formatDate(customerGuideRecord.dueDate)}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="guide-step-number">1</div>
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
                  <strong>Mang sách đến quầy lưu thông thư viện:</strong>
                  <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Bạn đọc đem trực tiếp cuốn sách cùng mã phiếu mượn (#{customerGuideRecord.id}) tới gặp thủ thư trong giờ phục vụ.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="guide-step-number">2</div>
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
                  <strong>Thủ thư kiểm định tình trạng sách:</strong>
                  <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Thủ thư sẽ trực tiếp thẩm định hiện trạng bìa, gáy sách và các trang nội dung để xác nhận tình trạng sách nguyên vẹn hoặc ghi nhận hư hại (nếu có).
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="guide-step-number">3</div>
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
                  <strong>Thanh toán chi phí phát sinh (nếu có):</strong>
                  <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {customerGuideRecord.overdue ? (
                      <span style={{ color: 'var(--color-danger-text)', fontWeight: 600 }}>
                        Sách quá hạn {customerGuideRecord.overdueDays} ngày: Phí trễ hạn {formatMoney(customerGuideRecord.penaltyAmount)} (5.000 đ/ngày).
                      </span>
                    ) : (
                      'Nếu sách trả đúng hạn và còn nguyên vẹn, bạn đọc không mất thêm bất kỳ chi phí nào.'
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="guide-step-number">4</div>
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
                  <strong>Thủ thư xác nhận duyệt hoàn trả:</strong>
                  <div style={{ color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Sau khi kiểm tra, thủ thư bấm duyệt hoàn tất trên hệ thống. Phiếu mượn sẽ được chuyển sang trạng thái "Đã hoàn trả" và số lượng sách được nhập lại kho lưu thông.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
