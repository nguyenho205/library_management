import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import { setTokens, clearTokens } from '../api/client'

const AuthContext = createContext(null)

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setTokens(data)
    const u = { email: data.email, role: data.role, permissions: data.permissions || [] }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // token co the da het han - van tiep tuc xoa phien o phia client
    }
    clearTokens()
    setUser(null)
  }, [])

  const can = useCallback((code) => Boolean(user?.permissions?.includes(code)), [user])

  const isAdmin = user?.role === 'ADMIN'
  const isLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'

  const value = { user, isAdmin, isLibrarian, can, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
