import { BookIcon } from '../components/Icons'
import '../styles/maintenance-page.css'

export default function MaintenancePage() {
  return (
    <main className="maintenance-screen">
      <section className="maintenance-card" aria-labelledby="maintenance-title">
        <span className="maintenance-card__icon"><BookIcon width={24} height={24} /></span>
        <p className="maintenance-card__eyebrow">THƯ VIỆN SỐ · THÔNG BÁO</p>
        <h1 id="maintenance-title">Hệ thống đang bảo trì</h1>
        <p className="maintenance-card__message">
          Các phiên đăng nhập đã được kết thúc. Đăng nhập và đăng ký sẽ mở lại khi bảo trì hoàn tất.
        </p>
        <p className="maintenance-card__hint">Trang này sẽ tự kiểm tra trạng thái hệ thống.</p>
      </section>
    </main>
  )
}
