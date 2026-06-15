import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export interface PlanInfo {
  idPlan: number
  nombre: string
  precio: number
  maxFacturas: number | null
  maxPrecioPorFactura: number
}

export interface User {
  idCliente: number
  nombre: string
  apellido: string
  name: string       // nombre + apellido — usado por las vistas existentes
  phone: string      // telefonoPrincipal
  telefonoSecundario: string | null
  address: string    // direccion
  correo: string
  role: 'client' | 'admin'
  plan: PlanInfo | null
  fechaProximoPago: string | null
}

interface ClienteResponse {
  idCliente: number
  nombre: string
  apellido: string
  correo: string
  telefonoPrincipal: number
  telefonoSecundario: number | null
  direccion: string | null
  activo: number
  suscripcion_activa?: { plan: PlanInfo; fechaProximoPago: string | null } | null
}

function mapCliente(c: ClienteResponse): User {
  return {
    idCliente:          c.idCliente,
    nombre:             c.nombre,
    apellido:           c.apellido,
    name:               `${c.nombre} ${c.apellido}`,
    phone:              String(c.telefonoPrincipal),
    telefonoSecundario: c.telefonoSecundario ? String(c.telefonoSecundario) : null,
    address:            c.direccion ?? '',
    correo:             c.correo,
    role:               'client',
    plan:               c.suscripcion_activa?.plan ?? null,
    fechaProximoPago:   c.suscripcion_activa?.fechaProximoPago ?? null,
  }
}

const USER_KEY  = 'auth_user'
const TOKEN_KEY = 'token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user  = ref<User | null>((() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') } catch { return null }
  })())

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin         = computed(() => user.value?.role === 'admin')

  async function login(cedula: string, password: string): Promise<void> {
    const res = await api.post<{ token: string; cliente: ClienteResponse }>(
      '/auth/login',
      { cedula: Number(cedula), clave: password },
    )
    token.value = res.token
    user.value  = mapCliente(res.cliente)
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  async function logout(): Promise<void> {
    await api.post('/auth/logout', {}, token.value).catch(() => {})
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

  async function register(data: {
    nombre: string
    apellido: string
    cedula: number
    correo: string
    clave: string
    telefonoPrincipal: number
    telefonoSecundario?: number | null
    whatsapp?: number | null
    direccion?: string
    idPlan: number
  }): Promise<void> {
    const { idPlan, ...clienteData } = data
    const cliente = await api.post<{ idCliente: number }>('/clientes', data)
    // await api.post('/suscripciones', { idCliente: cliente.idCliente, idPlan })
    await login(String(data.cedula), data.clave)
  }

  async function refreshUser(): Promise<void> {
    if (!user.value || !token.value) return
    const updated = await api.get<ClienteResponse>(`/clientes/${user.value.idCliente}`, token.value)
    user.value = mapCliente(updated)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  async function updateProfile(data: {
    nombre?: string
    apellido?: string
    telefonoPrincipal?: number
    telefonoSecundario?: number | null
    direccion?: string
    clave?: string
  }): Promise<void> {
    const updated = await api.put<ClienteResponse>(
      `/clientes/${user.value!.idCliente}`,
      data,
      token.value,
    )
    user.value = mapCliente(updated)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  return { user, token, isAuthenticated, isAdmin, login, logout, restoreSession, register, updateProfile, refreshUser }
})
