export default function Skeleton({ rows = 4 }) {
  return (
    <div className="loading-skeleton" role="status" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{
            width: i === 0 ? '45%' : i === rows - 1 ? '70%' : `${85 - (i % 3) * 15}%`,
            height: i === 0 ? 18 : 14,
            marginBottom: 14,
          }}
        />
      ))}
    </div>
  )
}
