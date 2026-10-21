import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

export default function Pagination({ page, totalPages, totalElements, onChange }) {
  if (!totalPages || totalPages <= 1) {
    return totalElements > 0 ? (
      <div className="pagination">
        <span className="pagination-info num">{totalElements} kết quả</span>
      </div>
    ) : null
  }

  return (
    <div className="pagination">
      <span className="pagination-info num">
        Trang {page + 1} / {totalPages} · Tổng {totalElements} kết quả
      </span>
      <div className="page-controls">
        <button
          className="btn btn-small"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
          type="button"
        >
          <ChevronLeftIcon width={14} height={14} />
          Trang trước
        </button>
        <button
          className="btn btn-small"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
          type="button"
        >
          Trang sau
          <ChevronRightIcon width={14} height={14} />
        </button>
      </div>
    </div>
  )
}
