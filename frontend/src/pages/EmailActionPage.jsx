import { Link, useLocation } from 'react-router-dom'
import { LibraryLogo, InfoIcon } from '../components/Icons'

export default function EmailActionPage() {
  const { pathname } = useLocation()
  const isReset = pathname === '/reset-password'

  return (
    <div className="auth-neo-split-wrap">
      {/* Left Column: Atmospheric Library Visual & Editorial Quote */}
      <div className="auth-neo-art-side" aria-hidden="true">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LibraryLogo width={180} height={44} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#93c5fd', textTransform: 'uppercase' }}>
            DIGITAL ARCHIVE
          </span>
        </div>

        <div className="auth-neo-quote-box">
          <div className="auth-neo-quote-text">
            “Hệ thống bảo vệ tài khoản và chứng thực số hóa giúp thông tin độc giả luôn được bảo vệ an toàn.”
          </div>
          <div className="auth-neo-quote-author">
            — Trung Tâm Xác Thực Athenaeum
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: 18, fontSize: 12.5, color: '#94a3b8' }}>
          <span>© 2026 Thư Viện Số Athenaeum</span>
          <span>Khám phá · Tích lũy · Khai phóng</span>
        </div>
      </div>

      {/* Right Column: Clean Modern Form */}
      <div className="auth-neo-form-side">
        <div className="auth-neo-form-box">
          <div style={{ marginBottom: 24 }}>
            <h1 className="auth-neo-form-title">Liên kết không còn hiệu lực</h1>
            <p className="auth-neo-form-sub">
              {isReset
                ? 'Để đặt lại mật khẩu, hãy yêu cầu mã xác thực mới bằng địa chỉ email của bạn.'
                : 'Việc xác nhận đổi email hiện được thực hiện thông qua mã xác thực 6 chữ số. Hãy đăng nhập và gửi lại yêu cầu.'}
            </p>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 24, borderRadius: 12 }}>
            <span className="alert-icon"><InfoIcon width={18} height={18} /></span>
            <div className="alert-content">
              {isReset
                ? 'Mã xác thực mới sẽ có hiệu lực trong 10 phút sau khi gửi yêu cầu.'
                : 'Bạn có thể quản lý và thay đổi email trong mục Cài đặt sau khi đăng nhập.'}
            </div>
          </div>

          <Link
            className="btn btn-primary btn-block"
            to={isReset ? '/forgot-password' : '/login'}
            style={{ padding: '11px 16px', borderRadius: 8, fontSize: 14 }}
          >
            {isReset ? 'Yêu cầu mã đặt lại mật khẩu' : 'Đến trang đăng nhập'}
          </Link>
        </div>
      </div>
    </div>
  )
}
