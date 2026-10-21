import { BookIcon, UsersIcon, SearchIcon, CirculationIcon } from './Icons'

export default function EmptyState({
  icon = 'search',
  title = 'Không tìm thấy dữ liệu',
  description,
  action,
}) {
  const renderIcon = () => {
    switch (icon) {
      case 'book':
        return <BookIcon width={24} height={24} />
      case 'users':
        return <UsersIcon width={24} height={24} />
      case 'circulation':
        return <CirculationIcon width={24} height={24} />
      default:
        return <SearchIcon width={24} height={24} />
    }
  }

  return (
    <div className="empty-state">
      <div className="empty-state-icon">{renderIcon()}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}
