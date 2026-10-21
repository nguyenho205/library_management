import { Link, useLocation } from 'react-router-dom'
import { LibraryLogo, InfoIcon } from '../components/Icons'

export default function EmailActionPage() {
  const { pathname } = useLocation()
  const isReset = pathname === '/reset-password'

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <LibraryLogo width={32} height={32} />
          </div>
          <h1>Liên kết không còn hiệu lực</h1>
          <p className="sub">
            {isReset
              ? 'Để đặt lại mật khẩu, hãy yêu cầu mã xác thực mới bằng địa chỉ email của bạn.'
              : 'Việc xác nhận đổi email hiện được thực hiện thông qua mã xác thực 6 chữ số. Hãy đăng nhập và gửi lại yêu cầu.'}
          </p>
        </div>

        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <span className="alert-icon"><InfoIcon width={17} height={17} /></span>
          <div className="alert-content">
            {isReset
              ? 'Mã xác thực mới sẽ có hiệu lực trong 10 phút sau khi gửi yêu cầu.'
              : 'Bạn có thể quản lý và thay đổi email trong mục Cài đặt sau khi đăng nhập.'}
          </div>
        </div>

        <Link className="btn btn-primary btn-block" to={isReset ? '/forgot-password' : '/login'}>
          {isReset ? 'Yêu cầu mã đặt lại mật khẩu' : 'Đến trang đăng nhập'}
        </Link>
      </div>
    </div>
  )
}
