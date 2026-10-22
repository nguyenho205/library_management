import { Navigate } from 'react-router-dom'

// Trang thử nghiệm đã kết thúc sau khi chốt Phương án 2. Chuyển hướng về trang chủ.
export default function AlertPreviewPage() {
  return <Navigate to="/" replace />
}
