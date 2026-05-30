import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  name: string
  phone: string
  address: string
  role: 'client' | 'admin'
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function login(phone: string, _password: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: User = phone === '3001234567'
          ? { id: '1', name: 'Admin Sistema', phone, address: 'Calle 100 #15-20', role: 'admin' }
          : { id: '2', name: 'María García', phone, address: 'Carrera 7 #45-12, Bogotá', role: 'client' }

        user.value = mockUser
        token.value = 'mock-token-' + Date.now()
        localStorage.setItem('token', token.value)
        resolve()
      }, 1000)
    })
  }

  function register(data: Omit<User, 'id' | 'role'>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        user.value = { ...data, id: Date.now().toString(), role: 'client' }
        token.value = 'mock-token-' + Date.now()
        localStorage.setItem('token', token.value)
        resolve()
      }, 1000)
    })
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  function restoreSession() {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      user.value = {
        id: '2',
        name: 'María García',
        phone: '3109876543',
        address: 'Carrera 7 #45-12, Bogotá',
        role: 'client',
      }
    }
  }

  return { user, token, isAuthenticated, isAdmin, login, register, logout, restoreSession }
})
