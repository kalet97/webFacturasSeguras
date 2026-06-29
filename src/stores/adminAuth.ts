import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export interface AdminUser {
  idUsuario: number
  nombre: string
  apellido: string
  correo: string
  activo: number
  idRol: number
}

interface AdminLoginResponse {
  token: string
  usuario: AdminUser
}

const TOKEN_KEY = 'admin_token'
const USER_KEY  = 'admin_user'

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user  = ref<AdminUser | null>((() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') } catch { return null }
  })())

  const isAuthenticated = computed(() => !!token.value)

  async function login(correo: string, clave: string): Promise<void> {
    const res = await api.post<AdminLoginResponse>('/auth/admin/login', { correo, clave })
    token.value = res.token
    user.value  = res.usuario
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.usuario))
  }

  async function logout(): Promise<void> {
    await api.post('/auth/admin/logout', {}, token.value).catch(() => {})
    clearSession()
  }

  function clearSession(): void {
    token.value = null
    user.value  = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  function restoreSession(): void {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser  = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value  = JSON.parse(savedUser)
      } catch {
        token.value = null
        user.value  = null
      }
    }
  }

  return { user, token, isAuthenticated, login, logout, clearSession, restoreSession }
})
