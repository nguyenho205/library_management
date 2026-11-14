import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { configApi } from './api/config'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import EmailActionPage from './pages/EmailActionPage'
import DashboardPage from './pages/DashboardPage'
import BooksPage from './pages/BooksPage'
import MembersPage from './pages/MembersPage'
import CirculationPage from './pages/CirculationPage'
import SettingsPage from './pages/SettingsPage'
import PermissionsPage from './pages/PermissionsPage'
import ProfilePage from './pages/ProfilePage'
import MaintenancePage from './pages/MaintenancePage'

// Customer Redesign — Immersive Reading Experience
import CustomerLayout from './customer/CustomerLayout'
import CustomerHomePage from './customer/CustomerHomePage'
import CustomerCatalogPage from './customer/CustomerCatalogPage'
import CustomerBookDetailPage from './customer/CustomerBookDetailPage'
import CustomerLoansPage from './customer/CustomerLoansPage'
import CustomerProfilePage from './customer/CustomerProfilePage'
import CustomerSettingsPage from './customer/CustomerSettingsPage'

function MaintenanceGate({ children }) {
  const { user, isAdmin, logoutLocally } = useAuth()
  const [maintenance, setMaintenance] = useState(false)

  useEffect(() => {
    let active = true
    let logoutStarted = false
    let checking = false

    const checkStatus = async () => {
      if (checking) return
      checking = true
      try {
        const status = await configApi.maintenanceStatus()
        if (!active) return
        const enabled = Boolean(status?.maintenanceMode)
        setMaintenance(enabled)
        if (enabled && user && !isAdmin && !logoutStarted) {
          logoutStarted = true
          logoutLocally()
        }
        if (!enabled) logoutStarted = false
      } catch {
        // Keep the current page available if the status endpoint is temporarily unreachable.
      } finally {
        checking = false
      }
    }

    checkStatus()
    const interval = window.setInterval(checkStatus, 5000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [user, isAdmin, logoutLocally])

  if (maintenance && !isAdmin) return <MaintenancePage />
  return children
}

export default function App() {
  return (
    <MaintenanceGate>
      <Routes>
        {/* Trang công khai */}
        <Route path="/maintenance" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<EmailActionPage />} />
        <Route path="/confirm-email-change" element={<EmailActionPage />} />

        {/* Customer Area — Immersive Reading Experience */}
        <Route element={<ProtectedRoute customerOnly><CustomerLayout /></ProtectedRoute>}>
          <Route path="/" element={<CustomerHomePage />} />
          <Route path="/catalog/:bookId" element={<ProtectedRoute permission="BOOK_VIEW"><CustomerBookDetailPage /></ProtectedRoute>} />
          <Route path="/catalog" element={<ProtectedRoute permission="BOOK_VIEW"><CustomerCatalogPage /></ProtectedRoute>} />
          <Route path="/my-loans" element={<ProtectedRoute permission="BORROW_USE"><CustomerLoansPage /></ProtectedRoute>} />
          <Route path="/account" element={<CustomerSettingsPage />} />
          <Route path="/profile" element={<CustomerProfilePage />} />
        </Route>

        {/* Admin Area — Untouched and preserved */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><Layout mode="admin" /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="books" element={<ProtectedRoute permission="BOOK_VIEW"><BooksPage adminMode /></ProtectedRoute>} />
          <Route path="circulation" element={<ProtectedRoute permission="BOOK_VIEW"><CirculationPage adminMode /></ProtectedRoute>} />
          <Route path="members" element={<ProtectedRoute permission="MEMBER_VIEW"><MembersPage /></ProtectedRoute>} />
          <Route path="permissions" element={<ProtectedRoute permission="PERMISSION_MANAGE"><PermissionsPage /></ProtectedRoute>} />
          <Route path="settings" element={<SettingsPage adminMode />} />
          <Route path="profile" element={<ProfilePage adminMode />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MaintenanceGate>
  )
}
