import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/api/client'

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone?: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      // /me returns raw DB row with snake_case fields
      const { data } = await api.get<AuthUser>('/auth/me')
      setUser(data)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const { data } = await api.post<{
      token: string
      user: { id: string; email: string; firstName: string; lastName: string; role: string }
    }>('/auth/login', { email, password })

    localStorage.setItem('token', data.token)

    // Normalize camelCase login response → snake_case
    setUser({
      id: data.user.id,
      email: data.user.email,
      first_name: data.user.firstName,
      last_name: data.user.lastName,
      role: data.user.role,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
