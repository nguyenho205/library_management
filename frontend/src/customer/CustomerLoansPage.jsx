import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import DueStamp from '../components/DueStamp'
import {
  CirculationIcon,
  CheckCircleIcon,
  BookIcon,
  ClockIcon,
  SearchIcon,
  AlertCircleIcon,
  CalendarIcon,
  ChevronRightIcon,
} from '../components/Icons'
import {
  resolveBookCover,
  formatDate,
  formatMoney,
  isOverdue,
  getDaysRemaining,
  getLoanProgress,
  CONDITION_MAP,
} from './bookUtils'

export default function CustomerLoansPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)

  // Filter state for history section
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL' | 'RETURNED' | 'REJECTED' | 'PENALTY'
  const [timeRange, setTimeRange] = useState('ALL') // 'ALL' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 8

  // Modals
  const [confirmCancelRecord, setConfirmCancelRecord] = useState(null)
  const [guideRecord, setGuideRecord] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const records = await borrowApi.history()
      setHistory(records || [])
    } catch (err) {
      setError(readError(err) || 'Không thể tải lịch sử mượn sách. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Partition records
  const activeLoans = useMemo(() => history.filter((r) => r.status === 'BORROWED'), [history])
  const pendingRequests = useMemo(() => history.filter((r) => r.status === 'PENDING'), [history])
  const completedHistory = useMemo(() => history.filter((r) => r.status === 'RETURNED' || r.status === 'REJECTED'), [history])
  const overdueLoans = useMemo(() => activeLoans.filter((r) => isOverdue(r)), [activeLoans])

  const totalActiveLoans = activeLoans.length + pendingRequests.length

  // Filtered completed history
  const filteredHistory = useMemo(() => {
    return completedHistory.filter((r) => {
      // Tab filter
      if (activeTab === 'RETURNED' && r.status !== 'RETURNED') return false
      if (activeTab === 'REJECTED' && r.status !== 'REJECTED') return false
      if (activeTab === 'PENALTY') {
        const totalFine = Number(r.totalFineAmount) || (Number(r.penaltyAmount) || 0) + (Number(r.damageFee) || 0)
        if (totalFine <= 0) return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const title = (r.bookTitle || '').toLowerCase()
        if (!title.includes(q)) return false
      }

      return true
    })
  }, [completedHistory, activeTab, searchQuery])

  // Pagination for history
  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1
  const paginatedHistory = useMemo(() => {
    const start = currentPage * pageSize
    return filteredHistory.slice(start, start + pageSize)
  }, [filteredHistory, currentPage, pageSize])

  const handleCancelRequest = async () => {
    if (!confirmCancelRecord) return
    setBusyId(confirmCancelRecord.id)
    setError('')
    try {
      await borrowApi.cancel(confirmCancelRecord.id)
      setNotice(`Đã hủy yêu cầu mượn cuốn “${confirmCancelRecord.bookTitle}” thành công.`)
      setConfirmCancelRecord(null)
      await loadData()
    } catch (err) {
      setError(readError(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="customer-loans-page">
      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      {/* 1. Header Banner with Live Quota */}
      <section className="loans-header-banner">
        <div className="loans-header-left">
          <span className="loans-header-eyebrow">
            <CirculationIcon width={13} height={13} /> SỔ MƯỢN TRẢ & LƯU VẾT ĐỌC
          </span>
          <h1 className="loans-header-title">Quản Lý Mượn & Hoàn Trả Sách</h1>
          <p className="loans-header-desc">
            Theo dõi thời hạn các cuốn sách đang đọc, gia hạn hoặc chuẩn bị hoàn trả sách tại quầy lưu thông thư viện.
          </p>
        </div>

        <div className="loans-header-quota-card">
          <div className="quota-card-label">Hạn mức mượn sách</div>
          <div className="quota-card-val">{String(totalActiveLoans).padStart(2, '0')} / 02</div>
          <div className="quota-card-sub">
            {totalActiveLoans >= 2 ? 'Đã đạt hạn mức tối đa' : `Còn ${2 - totalActiveLoans} lượt mượn khả dụng`}
          </div>
          <div className="quota-card-bars">
            <div className={`quota-bar ${totalActiveLoans >= 1 ? 'filled' : ''}`} />
            <div className={`quota-bar ${totalActiveLoans >= 2 ? 'filled' : ''}`} />
          </div>
        </div>
      </section>

      {/* Overdue Alert Banner if any active loan is overdue */}
      {overdueLoans.length > 0 && (
        <div className="loans-overdue-alert-banner" role="alert">
          <div className="overdue-banner-icon">
            <AlertCircleIcon width={24} height={24} />
          </div>
          <div className="overdue-banner-text">
            <strong>Bạn có {overdueLoans.length} cuốn sách đã quá hạn hoàn trả quy định!</strong>
            <p>
              Phí trễ hạn theo quy định là <strong>5.000 đ/cuốn/ngày</strong>. Bạn vui lòng sớm mang tài liệu đến quầy lưu thông thư viện để thực hiện thủ tục hoàn trả.
            </p>
          </div>
        </div>
      )}

      {/* 2. Section: Active Loans (Sách đang đọc) */}
      <section className="loans-section">
        <div className="loans-section-head">
          <h2 className="loans-section-title">
            Sách Đang Mượn ({activeLoans.length}/2 cuốn)
          </h2>
        </div>

        {loading ? (
          <Skeleton rows={3} />
        ) : activeLoans.length > 0 ? (
          <div className="loans-cards-list">
            {activeLoans.map((loan) => {
              const cover = loan.bookImgUrl || resolveBookCover({ title: loan.bookTitle })
              const overdueStatus = isOverdue(loan)
              const daysLeft = getDaysRemaining(loan.dueDate)
              const progressPct = getLoanProgress(loan.borrowDate, loan.dueDate)

              return (
                <article key={loan.id} className={`loan-item-card ${overdueStatus ? 'is-overdue' : ''}`}>
                  <div className="loan-item-cover-wrap">
                    {cover ? (
                      <img src={cover} alt={loan.bookTitle} className="loan-item-cover-img" />
                    ) : (
                      <div className="loan-item-cover-fallback">
                        <BookIcon width={32} height={32} />
                      </div>
                    )}
                    <div className="loan-item-spine" />
                  </div>

                  <div className="loan-item-details">
                    <div className="loan-item-status-row">
                      <DueStamp dueDate={loan.dueDate} overdue={overdueStatus} />
                      {overdueStatus && (
                        <span className="loan-pill-danger">
                          <ClockIcon width={12} height={12} />
                          Quá hạn {loan.overdueDays || 1} ngày · Phí phạt: {formatMoney(loan.penaltyAmount)}
                        </span>
                      )}
                      <span className="loan-ref-id">Mã mượn #{loan.id}</span>
                    </div>

                    <h3 className="loan-item-title">{loan.bookTitle}</h3>

                    <div className="loan-item-dates">
                      <span>Ngày nhận sách: <strong>{formatDate(loan.borrowDate)}</strong></span>
                      <span>•</span>
                      <span>Hạn hoàn trả (10 ngày): <strong style={{ color: 'var(--neo-ink-950)' }}>{formatDate(loan.dueDate)}</strong></span>
                    </div>

                    {/* Progress Bar */}
                    <div className="loan-progress-container">
                      <div className="loan-progress-track">
                        <div
                          className={`loan-progress-fill ${overdueStatus ? 'fill-overdue' : ''}`}
                          style={{ width: `${overdueStatus ? 100 : progressPct}%` }}
                        />
                      </div>
                      <span className="loan-progress-label">
                        {overdueStatus ? 'Đã quá hạn' : `Đã qua ${progressPct}% thời hạn mượn (Còn ${daysLeft > 0 ? daysLeft : 0} ngày)`}
                      </span>
                    </div>
                  </div>

                  <div className="loan-item-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setGuideRecord(loan)}
                    >
                      Hướng dẫn trả sách
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="loans-empty-banner">
            <div className="empty-banner-icon">
              <BookIcon width={32} height={32} />
            </div>
            <div className="empty-banner-text">
              <h3>Hiện tại bạn không mượn cuốn sách nào</h3>
              <p>Mỗi bạn đọc được mượn tối đa 2 cuốn sách cùng lúc với thời hạn 10 ngày.</p>
            </div>
            <Link to="/catalog" className="btn btn-primary btn-sm">
              Khám phá kho sách
            </Link>
          </div>
        )}
      </section>

      {/* 3. Section: Pending Requests (Yêu cầu chờ duyệt) */}
      {pendingRequests.length > 0 && (
        <section className="loans-section">
          <div className="loans-section-head">
            <h2 className="loans-section-title">
              Yêu Cầu Mượn Đang Chờ Duyệt ({pendingRequests.length})
            </h2>
            <span style={{ fontSize: 13, color: 'var(--neo-text-muted)' }}>
              Thủ thư tiếp nhận & xử lý trong <strong>1 – 3 ngày làm việc</strong>
            </span>
          </div>

          <div className="loans-cards-list">
            {pendingRequests.map((req) => {
              const cover = req.bookImgUrl || resolveBookCover({ title: req.bookTitle })
              return (
                <article key={req.id} className="loan-item-card loan-card-pending">
                  <div className="loan-item-cover-wrap">
                    {cover ? (
                      <img src={cover} alt={req.bookTitle} className="loan-item-cover-img" />
                    ) : (
                      <div className="loan-item-cover-fallback">
                        <BookIcon width={32} height={32} />
                      </div>
                    )}
                  </div>

                  <div className="loan-item-details">
                    <div className="loan-item-status-row">
                      <span className="loan-pill-pending">
                        <ClockIcon width={12} height={12} /> Đang chờ thủ thư duyệt (1 – 3 ngày)
                      </span>
                      <span className="loan-ref-id">Mã #{req.id}</span>
                    </div>
                    <h3 className="loan-item-title">{req.bookTitle}</h3>
                    <div className="loan-item-dates">
                      <span>Đã gửi ngày: {formatDate(req.borrowDate)}</span>
                      <span>•</span>
                      <span>Hạn trả mong muốn: <strong style={{ color: 'var(--neo-cobalt-600)' }}>{formatDate(req.dueDate)}</strong></span>
                    </div>
                  </div>

                  <div className="loan-item-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmCancelRecord(req)}
                      disabled={busyId === req.id}
                      style={{ color: 'var(--neo-coral-600)' }}
                    >
                      Hủy yêu cầu
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* 4. Section: Completed Reading History Ledger */}
      <section className="loans-section">
        <div className="loans-section-head">
          <div>
            <h2 className="loans-section-title">Lịch Sử Mượn & Hoàn Trả</h2>
          </div>
        </div>

        {/* History Subtabs & Search Bar */}
        <div className="loans-history-controls-card">
          <div className="history-subtabs-row">
            <button
              type="button"
              className={`history-subtab ${activeTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('ALL'); setCurrentPage(0) }}
            >
              Tất cả ({completedHistory.length})
            </button>
            <button
              type="button"
              className={`history-subtab ${activeTab === 'RETURNED' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('RETURNED'); setCurrentPage(0) }}
            >
              Đã hoàn trả ({completedHistory.filter((r) => r.status === 'RETURNED').length})
            </button>
            <button
              type="button"
              className={`history-subtab ${activeTab === 'REJECTED' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('REJECTED'); setCurrentPage(0) }}
            >
              Bị từ chối ({completedHistory.filter((r) => r.status === 'REJECTED').length})
            </button>
            <button
              type="button"
              className={`history-subtab ${activeTab === 'PENALTY' ? 'is-active' : ''}`}
              onClick={() => { setActiveTab('PENALTY'); setCurrentPage(0) }}
            >
              Có phí phạt
            </button>
          </div>

          <div className="history-search-input-wrap">
            <SearchIcon width={14} height={14} />
            <input
              type="text"
              placeholder="Tìm kiếm tác phẩm trong lịch sử..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0) }}
            />
          </div>
        </div>

        {loading ? (
          <Skeleton rows={4} />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon="circulation"
            title="Không tìm thấy lịch sử phù hợp"
            description="Bạn chưa có lượt hoàn trả nào khớp với điều kiện lọc."
          />
        ) : (
          <div className="loans-history-table-card">
            <table className="loans-history-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Bìa</th>
                  <th>Tác phẩm</th>
                  <th style={{ width: 130 }}>Ngày mượn</th>
                  <th style={{ width: 130 }}>Hạn hoàn trả</th>
                  <th style={{ width: 130 }}>Ngày thực trả</th>
                  <th style={{ width: 140 }}>Tình trạng sách</th>
                  <th style={{ width: 130 }}>Chi phí</th>
                  <th style={{ width: 120 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((r) => {
                  const cover = r.bookImgUrl || resolveBookCover({ title: r.bookTitle })
                  const totalFine = Number(r.totalFineAmount) || (Number(r.penaltyAmount) || 0) + (Number(r.damageFee) || 0)
                  const cond = CONDITION_MAP[r.bookCondition]

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="history-table-thumb-wrap">
                          {cover ? (
                            <img src={cover} alt={r.bookTitle} className="history-table-thumb" />
                          ) : (
                            <div className="history-table-thumb-fallback">
                              <BookIcon width={18} height={18} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="history-book-title">{r.bookTitle}</div>
                        <span className="history-book-id">Mã #{r.id}</span>
                      </td>
                      <td>{formatDate(r.borrowDate)}</td>
                      <td>{formatDate(r.dueDate)}</td>
                      <td>{r.returnDate ? formatDate(r.returnDate) : '—'}</td>
                      <td>
                        {cond ? (
                          <span className={`badge ${cond.badgeClass}`}>{cond.label}</span>
                        ) : (
                          <span style={{ color: 'var(--neo-text-light)' }}>—</span>
                        )}
                      </td>
                      <td>
                        {totalFine > 0 ? (
                          <span style={{ color: 'var(--neo-coral-600)', fontWeight: 700 }}>
                            {formatMoney(totalFine)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--neo-text-light)' }}>0 đ</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${r.status === 'RETURNED' ? 'badge-neutral' : 'badge-danger'}`}>
                          {r.status === 'RETURNED' ? 'Đã hoàn trả' : 'Đã từ chối'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalElements={filteredHistory.length}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </section>

      {/* Return Guidance Modal */}
      {guideRecord && (
        <Modal
          title={`Quy Trình Hoàn Trả: ${guideRecord.bookTitle}`}
          onClose={() => setGuideRecord(null)}
          footer={
            <button type="button" className="btn btn-secondary" onClick={() => setGuideRecord(null)}>
              Đã hiểu
            </button>
          }
        >
          <div className="return-guide-modal-body">
            <div className="guide-steps-list">
              <div className="guide-step-item">
                <div className="step-num">1</div>
                <div className="step-content">
                  <h4>Mang sách đến Quầy Lưu Thông</h4>
                  <p>Vui lòng mang cuốn sách “{guideRecord.bookTitle}” cùng Thẻ bạn đọc đến quầy thủ thư thư viện.</p>
                </div>
              </div>
              <div className="guide-step-item">
                <div className="step-num">2</div>
                <div className="step-content">
                  <h4>Thủ thư kiểm định tình trạng sách</h4>
                  <p>Thủ thư sẽ kiểm tra sách (nguyên vẹn, hư hỏng nhẹ hoặc mất) và xác nhận ngày hoàn trả vào hệ thống.</p>
                </div>
              </div>
              <div className="guide-step-item">
                <div className="step-num">3</div>
                <div className="step-content">
                  <h4>Khôi phục hạn ngạch bạn đọc</h4>
                  <p>Ngay sau khi xác nhận trả thành công, hạn ngạch mượn sách của bạn sẽ lập tức được giải phóng để mượn cuốn sách tiếp theo.</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Cancel Request Modal */}
      {confirmCancelRecord && (
        <ConfirmModal
          title="Xác nhận hủy yêu cầu mượn"
          message={`Bạn có chắc chắn muốn hủy yêu cầu mượn cuốn “${confirmCancelRecord.bookTitle}”?`}
          confirmLabel="Hủy yêu cầu"
          danger
          busy={Boolean(busyId)}
          onConfirm={handleCancelRequest}
          onClose={() => setConfirmCancelRecord(null)}
        />
      )}
    </div>
  )
}

