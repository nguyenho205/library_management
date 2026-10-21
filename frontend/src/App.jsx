import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import EmailActionPage from './pages/EmailActionPage'
import DashboardPage from './pages/DashboardPage'
import CustomerDashboardPage from './pages/CustomerDashboardPage'
import BooksPage from './pages/BooksPage'
import MembersPage from './pages/MembersPage'
import CirculationPage from './pages/CirculationPage'
import SettingsPage from './pages/SettingsPage'
import PermissionsPage from './pages/PermissionsPage'

export default function App() {
  return (
    <Routes>
      {/* Trang cong khai */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<EmailActionPage />} />
      <Route path="/confirm-email-change" element={<EmailActionPage />} />

      <Route element={<ProtectedRoute customerOnly><Layout mode="customer" /></ProtectedRoute>}>
        <Route path="/" element={<CustomerDashboardPage />} />
        <Route path="/catalog" element={<ProtectedRoute permission="BOOK_VIEW"><BooksPage /></ProtectedRoute>} />
        <Route path="/my-loans" element={<ProtectedRoute permission="BORROW_USE"><CirculationPage /></ProtectedRoute>} />
        <Route path="/account" element={<SettingsPage />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout mode="admin" /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="books" element={<ProtectedRoute permission="BOOK_VIEW"><BooksPage adminMode /></ProtectedRoute>} />
        <Route path="members" element={<ProtectedRoute permission="MEMBER_VIEW"><MembersPage /></ProtectedRoute>} />
        <Route path="permissions" element={<ProtectedRoute permission="PERMISSION_MANAGE"><PermissionsPage /></ProtectedRoute>} />
        <Route path="settings" element={<SettingsPage adminMode />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
