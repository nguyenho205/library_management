import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi } from '../api/auth'
import { STORAGE_KEYS } from '../constants/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from AsyncStorage on app boot
  useEffect(() => {
    async function loadStorage() {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER)

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (e) {
        console.error('Lỗi khi khôi phục phiên đăng nhập:', e)
      } finally {
        setLoading(false)
      }
    }
    loadStorage()
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    // data is JwtResponse: { accessToken, refreshToken, tokenType, email, role, permissions }
    const accessToken = data?.accessToken || data?.token
    const refreshToken = data?.refreshToken

    if (!accessToken) {
      throw new Error('Máy chủ phản hồi nhưng không có mã xác thực (accessToken).')
    }

    const account = {
      email: data.email || email,
      role: data.role || 'MEMBER',
      permissions: data.permissions || [],
    }

    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken)
    if (refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    }
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(account))

    setToken(accessToken)
    setUser(account)
    return account
  }, [])

  const register = useCallback(async (payload) => {
    return await authApi.register(payload)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    } finally {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN)
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      await AsyncStorage.removeItem(STORAGE_KEYS.USER)
      setToken(null)
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.me()
      if (freshUser) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser))
        setUser(freshUser)
      }
    } catch {
      // ignore
    }
  }, [])

  const can = useCallback(
    (code) => Boolean(user?.role === 'ADMIN' || user?.permissions?.includes(code)),
    [user]
  )

  const isAdmin = user?.role === 'ADMIN'
  const isLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
  const isMember = user?.role === 'MEMBER'

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token),
        isAdmin,
        isLibrarian,
        isMember,
        can,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
