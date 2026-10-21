import { CalendarIcon, ClockIcon } from './Icons'

export default function DueStamp({ dueDate, overdue = false }) {
  const d = new Date(dueDate)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return (
    <span className={`due-badge${overdue ? ' overdue' : ''}`}>
      {overdue ? <ClockIcon width={14} height={14} /> : <CalendarIcon width={14} height={14} />}
      <span>Hạn trả: {day}/{month}/{year}</span>
    </span>
  )
}
