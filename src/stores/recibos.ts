import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

export type ReciboStatus = 'pending' | 'soon' | 'overdue' | 'paid' | 'processing' | 'reviewing'
export type ServiceType = 'energia' | 'agua' | 'gas' | 'internet' | 'telefono' | 'tv'

export interface Notification {
  id: string
  date: string
  type: 'sms' | 'call' | 'visit' | 'payment'
  description: string
}

export interface Recibo {
  id: string
  serviceType: ServiceType
  company: string
  clientNumber: string
  dueDate: string
  address: string
  amount?: number
  surcharge?: number
  status: ReciboStatus
  daysLeft: number
  notifications: Notification[]
}

export interface HistoryItem {
  id: string
  date: string
  reciboId: string
  reciboName: string
  valorRecibo: number
  comision: number | null
  valorTotal: number
  pagado: boolean
}

interface ApiReciboSimple { idRecibo: number; nombre: string }
interface ApiHistorialPagoRecibo {
  idHistorialPagoRecibo: number
  idRecibo: number
  valorRecibo: number
  comision: number | null
  valorTotal: number
  pagado: number
  fechaSolicitud: string | null
  fechaPago: string | null
  recibo: ApiReciboSimple | null
}

function mapHistorialPago(h: ApiHistorialPagoRecibo): HistoryItem {
  return {
    id:          String(h.idHistorialPagoRecibo),
    date:        h.fechaPago ?? h.fechaSolicitud ?? '',
    reciboId:    String(h.idRecibo),
    reciboName:  h.recibo?.nombre ?? `Recibo #${h.idRecibo}`,
    valorRecibo: h.valorRecibo,
    comision:    h.comision,
    valorTotal:  h.valorTotal,
    pagado:      !!h.pagado,
  }
}

// --- Mapeo desde la API ---

interface ApiEmpresa  { idEmpresaServicio: number; nombre: string; color: string | null }
interface ApiTipo     { idTipoFactura: number; nombre: string }
interface ApiEstado   { idEstadoRecibo: number; nombre: string }

interface ApiRecibo {
  idRecibo: number
  idCliente: number
  codigoRecibo: string | null
  nombre: string
  precio: number | null
  cargoAdicional: number | null
  fechaOportuna: string | null
  fechaMaxima: string | null
  fechaSistem: string | null
  observacion: string | null
  empresa_servicio: ApiEmpresa | null
  tipo_factura: ApiTipo | null
  estado_recibo: ApiEstado | null
}

const SERVICE_TYPE_MAP: Record<string, ServiceType> = {
  energia: 'energia', eléctrica: 'energia', electrica: 'energia',
  agua: 'agua', acueducto: 'agua',
  gas: 'gas',
  internet: 'internet', fibra: 'internet',
  telefono: 'telefono', teléfono: 'telefono', celular: 'telefono', movil: 'telefono',
  tv: 'tv', television: 'tv', televisión: 'tv', cable: 'tv',
}

const PAID_NAMES = ['pagado', 'pago', 'paid', 'cancelado']

function inferServiceType(empresa: ApiEmpresa | null, tipo: ApiTipo | null): ServiceType {
  const tokens = [empresa?.nombre ?? '', tipo?.nombre ?? '']
    .join(' ')
    .toLowerCase()
    .split(/\s+/)

  for (const token of tokens) {
    if (SERVICE_TYPE_MAP[token]) return SERVICE_TYPE_MAP[token]
  }
  return 'internet'
}

function parseDate(s: string) {
  return new Date(s.replace(' ', 'T'))
}

function calcStatus(api: ApiRecibo): ReciboStatus {
  if (api.estado_recibo?.idEstadoRecibo === 4) return 'processing'
  if (api.estado_recibo?.idEstadoRecibo === 5) return 'reviewing'
  if (api.estado_recibo?.idEstadoRecibo === 7) return 'paid' // consultarFactura: uso interno del admin, para el cliente se ve como pagado

  const estadoNombre = (api.estado_recibo?.nombre ?? '').toLowerCase()
  if (PAID_NAMES.some(p => estadoNombre.includes(p))) return 'paid'

  if (!api.fechaMaxima) return 'pending'
  const days = Math.ceil(
    (parseDate(api.fechaMaxima).getTime() - Date.now()) / 86_400_000,
  )
  if (days < 0) return 'overdue'
  if (days <= 5) return 'soon'
  return 'pending'
}

function calcDaysLeft(fechaMaxima: string | null): number {
  if (!fechaMaxima) return 0
  return Math.ceil((parseDate(fechaMaxima).getTime() - Date.now()) / 86_400_000)
}

function mapRecibo(r: ApiRecibo, clienteAddress: string): Recibo {
  const status = calcStatus(r)
  return {
    id: String(r.idRecibo),
    serviceType: inferServiceType(r.empresa_servicio, r.tipo_factura),
    company: r.nombre || r.empresa_servicio?.nombre || '',
    clientNumber: r.codigoRecibo ?? String(r.idRecibo),
    dueDate: r.fechaMaxima ?? r.fechaOportuna ?? '',
    address: clienteAddress,
    amount: r.precio ?? undefined,
    surcharge: r.cargoAdicional ?? undefined,
    status,
    daysLeft: status === 'paid' || status === 'reviewing' ? 0 : calcDaysLeft(r.fechaMaxima),
    notifications: [],
  }
}

// --- Store ---

export const useRecibosStore = defineStore('recibos', () => {
  const recibos        = ref<Recibo[]>([])
  const history        = ref<HistoryItem[]>([])
  const loading        = ref(false)
  const loadingHistory = ref(false)

  async function fetchRecibos() {
    const auth = useAuthStore()
    if (!auth.user) return

    loading.value = true
    try {
      const data = await api.get<ApiRecibo[]>(
        `/clientes/${auth.user.idCliente}/recibos`,
        auth.token,
      )
      const address = auth.user.address ?? ''
      recibos.value = data.map(r => mapRecibo(r, address))
    } finally {
      loading.value = false
    }
  }

  function getReciboById(id: string) {
    return recibos.value.find(r => r.id === id)
  }

  async function createRecibo(payload: {
    idEmpresaServicio: number
    idTipoFactura: number
    idEstadoRecibo: number
    codigoRecibo: string
    nombre: string
    precio: number | null
    fechaOportuna: string | null
    fechaMaxima: string | null
    fechaSuspencion: string | null
    observacion: string | null
  }): Promise<void> {
    const auth = useAuthStore()
    await api.post('/recibos', { ...payload, idCliente: auth.user!.idCliente }, auth.token)
    await fetchRecibos()
  }

  function addRecibo(data: Omit<Recibo, 'id' | 'status' | 'daysLeft' | 'notifications'>) {
    const dueDate = new Date(data.dueDate)
    const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86_400_000)
    let status: ReciboStatus = 'pending'
    if (daysLeft < 0) status = 'overdue'
    else if (daysLeft <= 5) status = 'soon'

    const newRecibo: Recibo = { ...data, id: Date.now().toString(), status, daysLeft, notifications: [] }
    recibos.value.unshift(newRecibo)
    return newRecibo
  }

  async function renameRecibo(id: string, nombre: string): Promise<void> {
    const auth = useAuthStore()
    await api.put(`/recibos/${id}`, { nombre }, auth.token)
    updateRecibo(id, { company: nombre })
  }

  async function fetchHistory(): Promise<void> {
    const auth = useAuthStore()
    if (!auth.user) return
    loadingHistory.value = true
    try {
      const data = await api.get<ApiHistorialPagoRecibo[]>(
        `/historial-pago-recibos?idCliente=${auth.user.idCliente}`,
        auth.token,
      )
      history.value = data.map(mapHistorialPago)
    } finally {
      loadingHistory.value = false
    }
  }

  async function markAsPaid(id: string): Promise<void> {
    const auth  = useAuthStore()
    const valor = recibos.value.find(r => r.id === id)?.amount ?? 0
    await Promise.all([
      api.put(`/recibos/${id}`, { idEstadoRecibo: 5 }, auth.token),
      api.post('/historial-pago-recibos', {
        idRecibo:   Number(id),
        idUsuario:  null,
        valorRecibo: valor,
        comision:   0,
        valorTotal: valor,
        pagado:     1,
      }, auth.token),
    ])
    updateRecibo(id, { status: 'reviewing', daysLeft: 0 })
  }

  async function requestPayment(id: string, valorRecibo: number, comision: number, file: File): Promise<void> {
    const auth = useAuthStore()
    const valorTotal = valorRecibo + comision

    const formData = new FormData()
    formData.append('archivo', file)
    const { url } = await api.upload<{ url: string }>('/upload/comprobante', formData, auth.token)

    await Promise.all([
      api.post('/historial-pago-recibos', {
        idRecibo: Number(id),
        valorRecibo,
        comision,
        valorTotal,
        pagado: 0,
        urlComprobante: url,
      }, auth.token),
      api.put(`/recibos/${id}`, { idEstadoRecibo: 4 }, auth.token),
    ])
    await fetchRecibos()
  }

  async function requestPaymentMultiple(
    items: { id: string; valorRecibo: number; comision: number }[],
    file: File,
  ): Promise<void> {
    const auth = useAuthStore()

    const formData = new FormData()
    formData.append('archivo', file)
    const { url } = await api.upload<{ url: string }>('/upload/comprobante', formData, auth.token)

    await Promise.all(
      items.map(({ id, valorRecibo, comision }) => {
        const valorTotal = valorRecibo + comision
        return Promise.all([
          api.post('/historial-pago-recibos', {
            idRecibo: Number(id),
            valorRecibo,
            comision,
            valorTotal,
            pagado: 0,
            urlComprobante: url,
          }, auth.token),
          api.put(`/recibos/${id}`, { idEstadoRecibo: 4 }, auth.token),
        ])
      }),
    )
    await fetchRecibos()
  }

  function updateRecibo(id: string, updates: Partial<Recibo>) {
    const index = recibos.value.findIndex(r => r.id === id)
    if (index !== -1) recibos.value[index] = { ...recibos.value[index], ...updates }
  }

  const serviceLabels: Record<ServiceType, string> = {
    energia: 'Energía Eléctrica', agua: 'Agua', gas: 'Gas Natural',
    internet: 'Internet', telefono: 'Teléfono', tv: 'TV por Cable',
  }
  const serviceIcons: Record<ServiceType, string> = {
    energia: '⚡', agua: '💧', gas: '🔥',
    internet: '📶', telefono: '📞', tv: '📺',
  }
  const serviceColors: Record<ServiceType, string> = {
    energia: 'bg-warning-50 text-warning-600',
    agua: 'bg-primary-50 text-primary-600',
    gas: 'bg-orange-50 text-orange-600',
    internet: 'bg-purple-50 text-purple-600',
    telefono: 'bg-success-50 text-success-600',
    tv: 'bg-pink-50 text-pink-600',
  }

  return {
    recibos, history, loading, loadingHistory,
    fetchRecibos, fetchHistory, createRecibo, getReciboById, addRecibo, updateRecibo, renameRecibo, markAsPaid, requestPayment, requestPaymentMultiple,
    serviceLabels, serviceIcons, serviceColors,
  }
})
