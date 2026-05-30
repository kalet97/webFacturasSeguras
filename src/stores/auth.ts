import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export interface User {
  idCliente: number
  name: string
  phone: string
  address: string
  correo: string
  role: 'client' | 'admin'
}

interface ClienteResponse {
  idCliente: number
  nombre: string
  apellido: string
  correo: string
  telefonoPrincipal: number
  direccion: string | null
  activo: number
}

function mapCliente(c: ClienteResponse): User {
  return {
    idCliente: c.idCliente,
    name: `${c.nombre} ${c.apellido}`,
    phone: String(c.telefonoPrincipal),
    address: c.direccion ?? '',
    correo: c.correo,
    role: 'client',
  }
}

const USER_KEY = 'auth_user'
const TOKEN_KEY = 'token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>((() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') } catch { return null }
  })())

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(cedula: string, password: string): Promise<void> {
    const res = await api.post<{ token: string; cliente: ClienteResponse }>(
      '/auth/login',
      { cedula: Number(cedula), clave: password },
    )
    token.value = res.token
    user.value = mapCliente(res.cliente)
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  async function logout(): Promise<void> {
    await api.post('/auth/logout', {}, token.value).catch(() => {})
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  function restoreSession(): void {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch {
        token.value = null
        user.value = null
      }
    }
  }

  // TODO: conectar a POST /api/clientes cuando se integre el registro
  async function register(_data: { name: string; phone: string; address: string }): Promise<void> {
    throw new Error('Registro no disponible aún')
  }

  return { user, token, isAuthenticated, isAdmin, login, logout, restoreSession, register }
})
