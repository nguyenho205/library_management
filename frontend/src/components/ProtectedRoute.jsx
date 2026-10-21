import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// permission: ma quyen can co de vao route (vd 'MEMBER_VIEW'). Khong truyen = chi can dang nhap.
export default function ProtectedRoute({ children, permission, adminOnly = false, customerOnly = false }) {
  const { user, can, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  if (customerOnly && isAdmin) return <Navigate to="/admin" replace />
  if (permission && !can(permission)) return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  return children
}
