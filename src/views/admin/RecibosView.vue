<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Search, FileText, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, Eye, X, Phone, Mail, MapPin, CreditCard,
  Building2, Calendar, Hash, MessageCircle, CheckCircle, Bell,
  Banknote, ImageOff, ArrowLeftRight, ImagePlus, History, Copy,
} from 'lucide-vue-next'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

const adminAuth = useAdminAuthStore()

// --- Tipos ---
interface Empresa { idEmpresaServicio: number; nombre: string; color: string | null; link: string | null }
interface Tipo    { idTipoFactura: number; nombre: string }
interface Estado  { idEstadoRecibo: number; nombre: string; color: string | null }
interface Cliente {
  idCliente: number; nombre: string; apellido: string; cedula: number
  correo: string; telefonoPrincipal: number; telefonoSecundario: number | null
  whatsapp: number | null; direccion: string | null
}

interface Recibo {
  idRecibo: number; nombre: string; codigoRecibo: string | null
  precio: number | null; fechaOportuna: string | null; fechaMaxima: string | null
  fechaSuspencion: string | null; observacion: string | null
  cliente: Cliente | null
  empresa_servicio: Empresa | null
  tipo_factura: Tipo | null
  estado_recibo: Estado | null
}

interface Paginator {
  data: Recibo[]; current_page: number; last_page: number; total: number; per_page: number
}

interface TipoNotificacion {
  idTipoNotificacion: number
  nombre: string
  precio: number | null
  color: string | null
  requiereCobro: number
}

interface HistorialPagoRecibo {
  idHistorialPagoRecibo: number
  idRecibo: number
  idUsuario: number | null
  valorRecibo: number
  comision: number | null
  valorTotal: number
  pagado: number
  fechaSolicitud: string | null
  urlComprobante: string | null
}


// --- Estado lista ---
const recibos      = ref<Recibo[]>([])
const loading      = ref(false)
const error        = ref('')
const search       = ref('')
const estadoFiltro = ref('')
const currentPage  = ref(1)
const lastPage     = ref(1)
const total        = ref(0)
const perPage      = ref(20)
const estados      = ref<Estado[]>([])

// --- Contadores por estado ---
const contadores       = ref<Record<number, number>>({})
const totalGeneral     = ref(0)
const loadingContadores = ref(false)

// --- Panel detalle ---
const selected  = ref<Recibo | null>(null)
const showPanel = ref(false)

function openDetail(r: Recibo) {
  selected.value = r
  showPanel.value = true
}
function closePanel() { showPanel.value = false }

// --- Modal historial ---
const showHistorial      = ref(false)
const historialRecibo    = ref<Recibo | null>(null)
const historialPagos     = ref<HistorialPagoRecibo[]>([])
const loadingHistorial   = ref(false)

async function openHistorial(r: Recibo) {
  historialRecibo.value  = r
  historialPagos.value   = []
  showHistorial.value    = true
  loadingHistorial.value = true
  try {
    historialPagos.value = await api.get<HistorialPagoRecibo[]>(`/historial-pago-recibos?idRecibo=${r.idRecibo}`, adminAuth.token)
  } catch {
    // silencioso — se muestra vacío
  } finally {
    loadingHistorial.value = false
  }
}

// --- Helper: subir comprobante de pago ---
async function uploadComprobante(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('archivo', file)
  const res = await api.upload<{ url: string }>('/upload/comprobante', fd, adminAuth.token)
  return res.url
}

// --- Parámetros EPM (código de barras: indicativoEPM + código + consecutivoEPM) ---
const epmIndicativo  = ref<string | null>(null)
const epmConsecutivo = ref<string | null>(null)

async function fetchParametrosEPM() {
  try {
    const [indicativo, consecutivo] = await Promise.all([
      api.get<{ valor: string }>('/parametros-generales/indicativoEPM',  adminAuth.token),
      api.get<{ valor: string }>('/parametros-generales/consecutivoEPM', adminAuth.token),
    ])
    epmIndicativo.value  = indicativo?.valor  ?? null
    epmConsecutivo.value = consecutivo?.valor ?? null
  } catch {}
}

function isEmpresaEPM(r: Recibo | null) {
  return r?.empresa_servicio?.idEmpresaServicio === 1
}

function buildBarcode(codigoRecibo: string | null) {
  if (!codigoRecibo || !epmIndicativo.value || !epmConsecutivo.value) return null
  return `${epmIndicativo.value}${codigoRecibo}${epmConsecutivo.value}`
}

const confirmBarcode = computed(() => {
  if (!confirmRecibo.value || !isEmpresaEPM(confirmRecibo.value)) return null
  return buildBarcode(confirmRecibo.value.codigoRecibo)
})

const confirmBarcode2 = computed(() => {
  if (!confirmRecibo.value || !isEmpresaEPM(confirmRecibo.value)) return null
  if (!confirmRecibo.value.codigoRecibo || !epmIndicativo.value || !epmConsecutivo.value) return null
  const num = parseInt(epmConsecutivo.value, 10)
  if (isNaN(num) || num <= 0) return null
  const consecutivoMenos1 = String(num - 1).padStart(epmConsecutivo.value.length, '0')
  return `${epmIndicativo.value}${confirmRecibo.value.codigoRecibo}${consecutivoMenos1}`
})

const pagoBarcode = computed(() => {
  if (!pagoEncargo.value || !isEmpresaEPM(pagoEncargo.value)) return null
  return buildBarcode(pagoEncargo.value.codigoRecibo)
})

const pagoBarcode2 = computed(() => {
  if (!pagoEncargo.value || !isEmpresaEPM(pagoEncargo.value)) return null
  if (!pagoEncargo.value.codigoRecibo || !epmIndicativo.value || !epmConsecutivo.value) return null
  const num = parseInt(epmConsecutivo.value, 10)
  if (isNaN(num) || num <= 0) return null
  const consecutivoMenos1 = String(num - 1).padStart(epmConsecutivo.value.length, '0')
  return `${epmIndicativo.value}${pagoEncargo.value.codigoRecibo}${consecutivoMenos1}`
})

// --- Confirmación marcar como pagado ---
const confirmRecibo        = ref<Recibo | null>(null)
const showConfirm          = ref(false)
const confirmLoading       = ref(false)
const confirmError         = ref('')
const confirmFile          = ref<File | null>(null)
const confirmPreview       = ref('')
const confirmCodigoCopied  = ref(false)
const confirmBarcodeCopied  = ref(false)
const confirmBarcodeCopied2 = ref(false)

function copiarConfirmCodigo() {
  const codigo = confirmRecibo.value?.codigoRecibo
  if (!codigo) return
  navigator.clipboard.writeText(codigo).then(() => {
    confirmCodigoCopied.value = true
    setTimeout(() => { confirmCodigoCopied.value = false }, 2500)
  })
}
function copiarConfirmBarcode() {
  if (!confirmBarcode.value) return
  navigator.clipboard.writeText(confirmBarcode.value).then(() => {
    confirmBarcodeCopied.value = true
    setTimeout(() => { confirmBarcodeCopied.value = false }, 2500)
  })
}
function copiarConfirmBarcode2() {
  if (!confirmBarcode2.value) return
  navigator.clipboard.writeText(confirmBarcode2.value).then(() => {
    confirmBarcodeCopied2.value = true
    setTimeout(() => { confirmBarcodeCopied2.value = false }, 2500)
  })
}

function onConfirmFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  confirmFile.value    = file
  confirmPreview.value = file ? URL.createObjectURL(file) : ''
}
function clearConfirmFile() { confirmFile.value = null; confirmPreview.value = '' }

function openConfirmPago(r: Recibo) {
  confirmRecibo.value  = r
  confirmError.value   = ''
  confirmFile.value    = null
  confirmPreview.value = ''
  showConfirm.value    = true
}

function closeConfirm() {
  showConfirm.value           = false
  confirmRecibo.value         = null
  confirmError.value          = ''
  confirmFile.value           = null
  confirmPreview.value        = ''
  confirmCodigoCopied.value   = false
  confirmBarcodeCopied.value  = false
  confirmBarcodeCopied2.value = false
}

async function markAsPagado() {
  if (!confirmRecibo.value) return
  confirmLoading.value = true
  confirmError.value   = ''
  try {
    let urlComprobanteRecibo: string | null = null
    if (confirmFile.value) {
      urlComprobanteRecibo = await uploadComprobante(confirmFile.value)
    }

    await api.put(`/recibos/${confirmRecibo.value.idRecibo}`, { idEstadoRecibo: 2, idUsuario: adminAuth.user?.idUsuario ?? null }, adminAuth.token)

    if (urlComprobanteRecibo) {
      await api.post('/historial-pago-recibos', {
        idRecibo:            confirmRecibo.value.idRecibo,
        valorRecibo:         confirmRecibo.value.precio ?? 0,
        comision:            0,
        valorTotal:          confirmRecibo.value.precio ?? 0,
        pagado:              1,
        urlComprobanteRecibo,
        idUsuario:           adminAuth.user?.idUsuario ?? null,
      }, adminAuth.token)
    }

    const estadoPagado = estados.value.find(e => e.idEstadoRecibo === 2) ?? { idEstadoRecibo: 2, nombre: 'Pagado', color: null }
    const idx = recibos.value.findIndex(r => r.idRecibo === confirmRecibo.value!.idRecibo)
    if (idx !== -1) recibos.value[idx] = { ...recibos.value[idx], estado_recibo: estadoPagado }
    if (selected.value?.idRecibo === confirmRecibo.value.idRecibo) {
      selected.value = { ...selected.value, estado_recibo: estadoPagado }
    }
    closeConfirm()
    fetchContadores()
  } catch (e: unknown) {
    confirmError.value = e instanceof Error ? e.message : 'Error al actualizar el recibo'
  } finally {
    confirmLoading.value = false
  }
}

// --- Modal cambio de estado ---
const estadoRecibo      = ref<Recibo | null>(null)
const showEstadoModal   = ref(false)
const estadoSelected    = ref<number | null>(null)
const estadoLoading     = ref(false)
const estadoError       = ref('')

function openEstadoModal(r: Recibo) {
  estadoRecibo.value   = r
  estadoSelected.value = r.estado_recibo?.idEstadoRecibo ?? null
  estadoError.value    = ''
  showEstadoModal.value = true
}

function closeEstadoModal() {
  showEstadoModal.value = false
  estadoRecibo.value    = null
  estadoError.value     = ''
}

async function cambiarEstado() {
  if (!estadoRecibo.value || estadoSelected.value === null) return
  estadoLoading.value = true
  estadoError.value   = ''
  try {
    await api.put(`/recibos/${estadoRecibo.value.idRecibo}`, { idEstadoRecibo: estadoSelected.value, idUsuario: adminAuth.user?.idUsuario ?? null }, adminAuth.token)
    const nuevoEstado = estados.value.find(e => e.idEstadoRecibo === estadoSelected.value) ?? null
    const idx = recibos.value.findIndex(r => r.idRecibo === estadoRecibo.value!.idRecibo)
    if (idx !== -1) recibos.value[idx] = { ...recibos.value[idx], estado_recibo: nuevoEstado }
    if (selected.value?.idRecibo === estadoRecibo.value.idRecibo) {
      selected.value = { ...selected.value, estado_recibo: nuevoEstado }
    }
    closeEstadoModal()
    fetchContadores()
  } catch (e: unknown) {
    estadoError.value = e instanceof Error ? e.message : 'Error al cambiar el estado'
  } finally {
    estadoLoading.value = false
  }
}

// --- Modal pago por encargo (estado 4) ---
const pagoEncargo       = ref<Recibo | null>(null)
const showPagoModal     = ref(false)
const pagoLoading       = ref(false)
const pagoError         = ref('')
const historialPago     = ref<HistorialPagoRecibo | null>(null)
const historialLoading  = ref(false)
const pagoFile          = ref<File | null>(null)
const pagoPreview       = ref('')

function onPagoFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  pagoFile.value    = file
  pagoPreview.value = file ? URL.createObjectURL(file) : ''
}
function clearPagoFile() { pagoFile.value = null; pagoPreview.value = '' }

async function openPagoModal(r: Recibo) {
  pagoEncargo.value  = r
  pagoError.value    = ''
  historialPago.value = null
  showPagoModal.value = true
  historialLoading.value = true
  try {
    const data = await api.get<HistorialPagoRecibo[]>(
      `/historial-pago-recibos?idRecibo=${r.idRecibo}`,
      adminAuth.token,
    )
    historialPago.value = data.find(h => h.pagado === 0) ?? data[0] ?? null
  } catch {
    pagoError.value = 'No se pudo cargar el comprobante'
  } finally {
    historialLoading.value = false
  }
}

function closePagoModal() {
  showPagoModal.value  = false
  pagoEncargo.value    = null
  historialPago.value  = null
  pagoError.value      = ''
  codigoCopied.value   = false
  barcodeCopied.value  = false
  barcodeCopied2.value = false
  pagoFile.value       = null
  pagoPreview.value    = ''
}

const codigoCopied   = ref(false)
const barcodeCopied  = ref(false)
const barcodeCopied2 = ref(false)

function copiarCodigo() {
  const codigo = pagoEncargo.value?.codigoRecibo
  if (!codigo) return
  navigator.clipboard.writeText(codigo).then(() => {
    codigoCopied.value = true
    setTimeout(() => { codigoCopied.value = false }, 2500)
  })
}

function copiarBarcode() {
  if (!pagoBarcode.value) return
  navigator.clipboard.writeText(pagoBarcode.value).then(() => {
    barcodeCopied.value = true
    setTimeout(() => { barcodeCopied.value = false }, 2500)
  })
}

function copiarBarcode2() {
  if (!pagoBarcode2.value) return
  navigator.clipboard.writeText(pagoBarcode2.value).then(() => {
    barcodeCopied2.value = true
    setTimeout(() => { barcodeCopied2.value = false }, 2500)
  })
}

async function confirmarPagoEncargo() {
  if (!pagoEncargo.value) return
  pagoLoading.value = true
  pagoError.value   = ''
  try {
    let urlComprobanteRecibo: string | null = null
    if (pagoFile.value) {
      urlComprobanteRecibo = await uploadComprobante(pagoFile.value)
    }

    const estadoPagado = estados.value.find(e => e.idEstadoRecibo === 2) ?? { idEstadoRecibo: 2, nombre: 'Pagado', color: null }
    await Promise.all([
      api.put(`/recibos/${pagoEncargo.value.idRecibo}`, { idEstadoRecibo: 2, idUsuario: adminAuth.user?.idUsuario ?? null }, adminAuth.token),
      historialPago.value
        ? api.put(
            `/historial-pago-recibos/${historialPago.value.idHistorialPagoRecibo}`,
            {
              pagado:    1,
              idUsuario: adminAuth.user?.idUsuario,
              ...(urlComprobanteRecibo ? { urlComprobanteRecibo } : {}),
            },
            adminAuth.token,
          )
        : Promise.resolve(),
    ])
    const idx = recibos.value.findIndex(r => r.idRecibo === pagoEncargo.value!.idRecibo)
    if (idx !== -1) recibos.value[idx] = { ...recibos.value[idx], estado_recibo: estadoPagado }
    if (selected.value?.idRecibo === pagoEncargo.value.idRecibo) {
      selected.value = { ...selected.value, estado_recibo: estadoPagado }
    }
    closePagoModal()
    fetchContadores()
  } catch (e: unknown) {
    pagoError.value = e instanceof Error ? e.message : 'Error al confirmar el pago'
  } finally {
    pagoLoading.value = false
  }
}

// --- Tipos de notificación ---
const tiposNotificacion = ref<TipoNotificacion[]>([])

async function fetchTiposNotificacion() {
  try { tiposNotificacion.value = await api.get<TipoNotificacion[]>('/tipo-notificaciones', adminAuth.token) } catch {}
}

// --- Modal cobro notificación ---
const notifRecibo      = ref<Recibo | null>(null)
const showNotifModal   = ref(false)
const notifLoading     = ref(false)
const notifError       = ref('')
const selectedTipo     = ref<TipoNotificacion | null>(null)
const notifObservacion = ref('')

function openNotifModal(r: Recibo) {
  notifRecibo.value      = r
  selectedTipo.value     = null
  notifObservacion.value = ''
  notifError.value       = ''
  showNotifModal.value   = true
}

function closeNotifModal() {
  showNotifModal.value = false
  notifRecibo.value    = null
  notifError.value     = ''
}

async function registrarNotificacion() {
  if (!notifRecibo.value || !selectedTipo.value || !adminAuth.user) return
  notifLoading.value = true
  notifError.value   = ''
  try {
    const notif = await api.post<{ idHistorialNotificacion: number }>(
      '/historial-notificaciones',
      {
        idCliente:          notifRecibo.value.cliente!.idCliente,
        idUsuario:          adminAuth.user.idUsuario,
        idRecibo:           notifRecibo.value.idRecibo,
        idTipoNotificacion: selectedTipo.value.idTipoNotificacion,
        observacion:        notifObservacion.value.trim() || null,
      },
      adminAuth.token,
    )
    if (selectedTipo.value.requiereCobro) {
      await api.post(
        '/historial-pago-notificaciones',
        {
          idCliente:               notifRecibo.value.cliente!.idCliente,
          idHistorialNotificacion: notif.idHistorialNotificacion,
          precio:                  selectedTipo.value.precio,
        },
        adminAuth.token,
      )
    }
    closeNotifModal()
  } catch (e: unknown) {
    notifError.value = e instanceof Error ? e.message : 'Error al registrar la notificación'
  } finally {
    notifLoading.value = false
  }
}

// --- Fetch ---
async function fetchEstados() {
  try { estados.value = await api.get<Estado[]>('/estado-recibos', adminAuth.token) } catch {}
}

async function fetchRecibos() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(currentPage.value) })
    if (search.value.trim()) params.set('search', search.value.trim())
    if (estadoFiltro.value)  params.set('estado', estadoFiltro.value)
    const data = await api.get<Paginator>(`/recibos?${params}`, adminAuth.token)
    recibos.value  = data.data
    lastPage.value = data.last_page
    total.value    = data.total
    perPage.value  = data.per_page
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar los recibos'
  } finally {
    loading.value = false
  }
}

async function fetchContadores() {
  if (estados.value.length === 0) return
  loadingContadores.value = true
  try {
    const [todosRes, ...estadoRes] = await Promise.all([
      api.get<Paginator>('/recibos?page=1', adminAuth.token),
      ...estados.value.map(e =>
        api.get<Paginator>(`/recibos?page=1&estado=${e.idEstadoRecibo}`, adminAuth.token)
      ),
    ])
    totalGeneral.value = todosRes.total
    estados.value.forEach((e, i) => {
      contadores.value[e.idEstadoRecibo] = estadoRes[i].total
    })
  } catch {}
  loadingContadores.value = false
}

function selectEstadoCard(idEstado: number | null) {
  estadoFiltro.value = idEstado != null ? String(idEstado) : ''
}

const estadoIconColors: Record<string, { bg: string; text: string; ring: string }> = {
  pendiente:  { bg: 'bg-slate-100',   text: 'text-slate-600',   ring: 'ring-slate-300' },
  pagado:     { bg: 'bg-success-50',   text: 'text-success-600', ring: 'ring-success-400' },
  pago:       { bg: 'bg-success-50',   text: 'text-success-600', ring: 'ring-success-400' },
  vencido:    { bg: 'bg-danger-50',    text: 'text-danger',      ring: 'ring-danger' },
  encargo:    { bg: 'bg-orange-50',    text: 'text-orange-600',  ring: 'ring-orange-400' },
  revisar:    { bg: 'bg-amber-50',     text: 'text-amber-600',   ring: 'ring-amber-400' },
}

function cardStyle(e: Estado) {
  const nombre = e.nombre.toLowerCase()
  for (const key of Object.keys(estadoIconColors)) {
    if (nombre.includes(key)) return estadoIconColors[key]
  }
  return { bg: 'bg-primary-50', text: 'text-primary-600', ring: 'ring-primary-400' }
}

// --- Pegar imagen desde portapapeles (Ctrl+V) ---
function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of Array.from(items)) {
    if (!item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (!file) continue
    const preview = URL.createObjectURL(file)
    if (showConfirm.value) {
      confirmFile.value    = file
      confirmPreview.value = preview
    } else if (showPagoModal.value) {
      pagoFile.value    = file
      pagoPreview.value = preview
    }
    break
  }
}

onMounted(async () => {
  await fetchEstados()
  fetchContadores()
  fetchTiposNotificacion()
  fetchParametrosEPM()
  fetchRecibos()
  document.addEventListener('paste', handlePaste)
})
onUnmounted(() => document.removeEventListener('paste', handlePaste))

watch([search, estadoFiltro], () => { currentPage.value = 1; fetchRecibos() })
watch(currentPage, fetchRecibos)

// --- WhatsApp recordatorio ---
const loadingWa = ref(false)

function whatsappNumero(c: Cliente): number | null {
  return c.whatsapp ?? c.telefonoPrincipal ?? null
}

async function shareWhatsapp(r: Recibo) {
  const numero = r.cliente ? whatsappNumero(r.cliente) : null
  if (!numero) return
  loadingWa.value = true
  try {
    const param = await api.get<{ valor: string }>('/parametros-generales/mensajeWhatsapp', adminAuth.token)

    const monto = r.precio != null
      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(r.precio)
      : '—'

    const fechaMaxima = r.fechaMaxima
      ? new Date(r.fechaMaxima).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—'

    const dias = daysLeft(r.fechaMaxima) ?? 0

    const mensaje = param.valor
      .replace(/{nombre}/g,        `${r.cliente.nombre} ${r.cliente.apellido}`)
      .replace(/{empresa}/g,       r.empresa_servicio?.nombre ?? '')
      .replace(/{servicio}/g,      r.tipo_factura?.nombre ?? '')
      .replace(/{monto}/g,         monto)
      .replace(/{fechaMaxima}/g,   fechaMaxima)
      .replace(/{diasRestantes}/g, String(dias))

    window.open(`https://wa.me/57${numero}?text=${encodeURIComponent(mensaje)}`, '_blank')
  } catch {
    // si falla el fetch del parámetro, no se abre nada
  } finally {
    loadingWa.value = false
  }
}

// --- Helpers ---
function clienteNombre(r: Recibo) {
  return r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : '—'
}

function formatPrecio(precio: number | null) {
  if (precio == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio)
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(fecha: string | null) {
  if (!fecha) return null
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000)
}

function isPagoEncargo(r: Recibo) {
  return r.estado_recibo?.idEstadoRecibo === 4
}

function isPendienteRevisar(r: Recibo) {
  return r.estado_recibo?.idEstadoRecibo === 5
}

function statusClass(r: Recibo) {
  if (isPagoEncargo(r)) return 'bg-orange-100 text-orange-700 ring-2 ring-orange-400 ring-offset-1 font-semibold'
  if (isPendienteRevisar(r)) return 'bg-amber-100 text-amber-700 ring-2 ring-amber-400 ring-offset-1 font-semibold'
  const nombre = (r.estado_recibo?.nombre ?? '').toLowerCase()
  if (['pagado', 'pago', 'paid', 'cancelado'].some(p => nombre.includes(p))) return 'bg-success-50 text-success-600'
  const days = daysLeft(r.fechaMaxima)
  if (days === null) return 'bg-slate-100 text-slate-500'
  if (days < 0)      return 'bg-danger-50 text-danger'
  if (days <= 5)     return 'bg-warning-50 text-warning-600'
  return 'bg-slate-100 text-slate-500'
}

function statusLabel(r: Recibo) {
  if (isPagoEncargo(r)) return '💰 ' + (r.estado_recibo?.nombre ?? 'Pago por encargo')
  if (isPendienteRevisar(r)) return '🔎 ' + (r.estado_recibo?.nombre ?? 'Pendiente por revisar')
  const nombre = (r.estado_recibo?.nombre ?? '').toLowerCase()
  if (['pagado', 'pago', 'paid', 'cancelado'].some(p => nombre.includes(p))) return r.estado_recibo?.nombre ?? 'Pagado'
  const days = daysLeft(r.fechaMaxima)
  if (days === null) return r.estado_recibo?.nombre ?? 'Pendiente'
  if (days < 0)      return `Vencido hace ${Math.abs(days)}d`
  if (days <= 5)     return `Vence en ${days}d`
  return r.estado_recibo?.nombre ?? 'Pendiente'
}

const pages = computed(() => {
  const p: number[] = []
  for (let i = Math.max(1, currentPage.value - 2); i <= Math.min(lastPage.value, currentPage.value + 2); i++) p.push(i)
  return p
})
</script>

<template>
  <div class="p-6 lg:p-8 mx-4">

    <!-- Cards contadores por estado -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      <!-- Card: Todos -->
      <button
        @click="selectEstadoCard(null)"
        :class="[
          'flex flex-col items-center gap-1 px-4 py-4 rounded-2xl border-2 transition-all text-center',
          estadoFiltro === ''
            ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-200'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
        ]"
      >
        <p :class="['text-2xl font-black', estadoFiltro === '' ? 'text-primary-600' : 'text-slate-800']">
          {{ loadingContadores ? '...' : totalGeneral }}
        </p>
        <p class="text-xs font-medium text-slate-500">Todos</p>
      </button>

      <!-- Cards por estado -->
      <button
        v-for="e in estados"
        :key="e.idEstadoRecibo"
        @click="selectEstadoCard(e.idEstadoRecibo)"
        :class="[
          'flex flex-col items-center gap-1 px-4 py-4 rounded-2xl border-2 transition-all text-center',
          estadoFiltro === String(e.idEstadoRecibo)
            ? `border-transparent ${cardStyle(e).bg} shadow-sm ring-2 ${cardStyle(e).ring}`
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
        ]"
      >
        <p :class="['text-2xl font-black', estadoFiltro === String(e.idEstadoRecibo) ? cardStyle(e).text : 'text-slate-800']">
          {{ loadingContadores ? '...' : (contadores[e.idEstadoRecibo] ?? 0) }}
        </p>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: e.color ?? '#94a3b8' }" />
          <p class="text-xs font-medium text-slate-500 truncate">{{ e.nombre }}</p>
        </div>
      </button>
    </div>

    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Recibos</h2>
        <p class="text-slate-500 text-sm mt-0.5">{{ total }} recibo{{ total !== 1 ? 's' : '' }} en total</p>
      </div>
      <button
        @click="fetchRecibos"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
      >
        <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
        Actualizar
      </button>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="search" type="text" placeholder="Buscar por nombre, código o cliente..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        />
      </div>
      <select
        v-model="estadoFiltro"
        class="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
      >
        <option value="">Todos los estados</option>
        <option v-for="e in estados" :key="e.idEstadoRecibo" :value="e.idEstadoRecibo">{{ e.nombre }}</option>
      </select>
    </div>

    

    <!-- Error -->
    <div v-if="error" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-4 py-3 mb-5">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ error }}
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>

      <template v-else>
        <div v-if="recibos.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <FileText class="w-10 h-10 mb-3 opacity-30" />
          <p class="text-sm font-medium">Sin recibos</p>
          <p class="text-xs mt-1">Intenta cambiar los filtros de búsqueda</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th class="text-left px-5 py-3.5">ID</th>
                <th class="text-left px-5 py-3.5">Recibo</th>
                <th class="text-left px-5 py-3.5">Cliente</th>
                <th class="text-left px-5 py-3.5">Teléfono</th>
                <th class="text-left px-5 py-3.5">Empresa</th>
                <th class="text-left px-5 py-3.5">Tipo</th>
                <th class="text-right px-5 py-3.5">Valor</th>
                <th class="text-left px-5 py-3.5">Fecha límite</th>
                <th class="text-right px-5 py-3.5">Días</th>
                <th class="text-left px-5 py-3.5">Estado</th>
                <th class="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="recibo in recibos"
                :key="recibo.idRecibo"
                :class="[
                  'transition-colors',
                  isPagoEncargo(recibo)
                    ? 'bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-400'
                    : isPendienteRevisar(recibo)
                    ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-400'
                    : 'hover:bg-slate-50',
                ]"
              >
                <td class="px-5 py-3.5 text-slate-400 font-mono text-xs">#{{ recibo.idRecibo }}</td>

                <td class="px-5 py-3.5">
                  <p class="font-medium text-slate-800 truncate max-w-[160px]">{{ recibo.nombre }}</p>
                  <p v-if="recibo.codigoRecibo" class="text-slate-400 text-xs font-mono">{{ recibo.codigoRecibo }}</p>
                </td>

                <td class="px-5 py-3.5">
                  <p class="text-slate-700 truncate max-w-[140px]">{{ clienteNombre(recibo) }}</p>
                  <p v-if="recibo.cliente" class="text-slate-400 text-xs font-mono">{{ recibo.cliente.cedula }}</p>
                </td>

                <td class="px-5 py-3.5 whitespace-nowrap">
                  <p v-if="recibo.cliente" class="text-slate-700 text-sm">{{ recibo.cliente.telefonoPrincipal }}</p>
                  <p v-else class="text-slate-400">—</p>
                </td>

                <td class="px-5 py-3.5 text-slate-600 truncate max-w-[120px]">
                  {{ recibo.empresa_servicio?.nombre ?? '—' }}
                </td>

                <td class="px-5 py-3.5 text-slate-500 truncate max-w-[100px]">
                  {{ recibo.tipo_factura?.nombre ?? '—' }}
                </td>

                <td class="px-5 py-3.5 text-right font-medium text-slate-800 whitespace-nowrap">
                  {{ formatPrecio(recibo.precio) }}
                </td>

                <td class="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                  {{ formatFecha(recibo.fechaMaxima) }}
                </td>

                <td class="px-5 py-3.5 text-right whitespace-nowrap">
                  <template v-if="['pagado', 'pago', 'paid', 'cancelado'].some(p => (recibo.estado_recibo?.nombre ?? '').toLowerCase().includes(p))">
                    <span class="text-slate-300 text-sm">—</span>
                  </template>
                  <template v-else-if="daysLeft(recibo.fechaMaxima) === null">
                    <span class="text-slate-300 text-sm">—</span>
                  </template>
                  <template v-else>
                    <span :class="[
                      'text-sm font-medium tabular-nums',
                      daysLeft(recibo.fechaMaxima)! < 0  ? 'text-danger' :
                      daysLeft(recibo.fechaMaxima)! <= 5 ? 'text-warning-600' :
                                                           'text-slate-600'
                    ]">
                      {{ daysLeft(recibo.fechaMaxima)! < 0
                          ? `−${Math.abs(daysLeft(recibo.fechaMaxima)!)}d`
                          : `${daysLeft(recibo.fechaMaxima)}d` }}
                    </span>
                  </template>
                </td>

                <td class="px-5 py-3.5">
                  <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', statusClass(recibo)]">
                    {{ statusLabel(recibo) }}
                  </span>
                </td>

                <td class="px-5 py-3.5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="isPagoEncargo(recibo)"
                      @click="openPagoModal(recibo)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition shadow-sm animate-pulse hover:animate-none"
                      title="Ver comprobante y confirmar pago"
                    >
                      <Banknote class="w-3.5 h-3.5" /> Pagar
                    </button>
                    <button
                      v-if="[1, 5].includes(recibo.estado_recibo?.idEstadoRecibo ?? 0)"
                      @click="openConfirmPago(recibo)"
                      :class="[
                        'transition p-1.5 rounded-lg',
                        isPendienteRevisar(recibo)
                          ? 'text-amber-600 hover:text-success-600 bg-amber-50 hover:bg-success-50 animate-pulse hover:animate-none'
                          : 'text-slate-400 hover:text-success-600 hover:bg-success-50',
                      ]"
                      title="Marcar como pagado"
                    >
                      <CheckCircle class="w-4 h-4" />
                    </button>
                    <button
                      v-if="recibo.cliente"
                      @click="openNotifModal(recibo)"
                      class="text-slate-400 hover:text-warning-600 transition p-1.5 rounded-lg hover:bg-warning-50"
                      title="Registrar notificación"
                    >
                      <Bell class="w-4 h-4" />
                    </button>
                    <button
                      @click="openEstadoModal(recibo)"
                      class="text-slate-400 hover:text-violet-600 transition p-1.5 rounded-lg hover:bg-violet-50"
                      title="Cambiar estado"
                    >
                      <ArrowLeftRight class="w-4 h-4" />
                    </button>
                    <button
                      @click="openDetail(recibo)"
                      class="text-slate-400 hover:text-primary-600 transition p-1.5 rounded-lg hover:bg-primary-50"
                      title="Ver detalle"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p class="text-xs text-slate-500">
            {{ total === 0 ? 'Sin resultados' : `Mostrando ${(currentPage - 1) * perPage + 1}–${Math.min(currentPage * perPage, total)} de ${total}` }}
          </p>
          <div class="flex items-center gap-1">
            <button @click="currentPage--" :disabled="currentPage === 1" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              v-for="p in pages" :key="p" @click="currentPage = p"
              :class="['min-w-[32px] h-8 rounded-lg text-xs font-medium transition', p === currentPage ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100']"
            >{{ p }}</button>
            <button @click="currentPage++" :disabled="currentPage === lastPage" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- ===================== Modal cambio de estado ===================== -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showEstadoModal && estadoRecibo" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeEstadoModal" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">

          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                <ArrowLeftRight class="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-800 text-sm">Cambiar estado</p>
                <p class="text-xs text-slate-400 truncate max-w-[180px]">{{ estadoRecibo.nombre }}</p>
              </div>
            </div>
            <button @click="closeEstadoModal" class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Lista de estados -->
          <div class="flex flex-col gap-2">
            <button
              v-for="e in estados"
              :key="e.idEstadoRecibo"
              type="button"
              @click="estadoSelected = e.idEstadoRecibo"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition',
                estadoSelected === e.idEstadoRecibo
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              ]"
            >
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: e.color ?? '#94a3b8' }"
              />
              <span class="text-sm font-medium text-slate-800 flex-1">{{ e.nombre }}</span>
              <span
                v-if="estadoRecibo.estado_recibo?.idEstadoRecibo === e.idEstadoRecibo"
                class="text-xs text-slate-400 font-normal"
              >actual</span>
              <div
                v-if="estadoSelected === e.idEstadoRecibo"
                class="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0"
              >
                <svg class="w-2.5 h-2.5 fill-white" viewBox="0 0 10 10">
                  <path d="M8.5 2.5L4 7.5 1.5 5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
              </div>
            </button>
          </div>

          <div v-if="estadoError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
            <AlertCircle class="w-4 h-4 shrink-0" /> {{ estadoError }}
          </div>

          <!-- Footer -->
          <div class="flex gap-3">
            <button
              @click="closeEstadoModal"
              :disabled="estadoLoading"
              class="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              @click="cambiarEstado"
              :disabled="estadoLoading || estadoSelected === estadoRecibo.estado_recibo?.idEstadoRecibo"
              class="flex-1 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg v-if="estadoLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {{ estadoLoading ? 'Guardando...' : 'Confirmar cambio' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ===================== Modal pago por encargo ===================== -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showPagoModal && pagoEncargo" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closePagoModal" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                <Banknote class="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-800 text-sm">Pago por encargo</p>
                <p class="text-xs text-slate-400">
                  {{ pagoEncargo.nombre }} &mdash; {{ pagoEncargo.cliente?.nombre }} {{ pagoEncargo.cliente?.apellido }}
                </p>
              </div>
            </div>
            <button @click="closePagoModal" class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <!-- Comprobante -->
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Comprobante del cliente</p>
              <div v-if="historialLoading" class="flex items-center justify-center h-48 bg-slate-50 rounded-2xl">
                <div class="w-6 h-6 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              </div>
              <div v-else-if="historialPago?.urlComprobante" class="rounded-2xl overflow-hidden border border-slate-200">
                <img
                  :src="historialPago.urlComprobante"
                  alt="Comprobante de pago"
                  class="w-full object-contain max-h-72"
                />
              </div>
              <div v-else class="flex flex-col items-center justify-center h-32 bg-slate-50 rounded-2xl gap-2 text-slate-400">
                <ImageOff class="w-7 h-7 opacity-50" />
                <p class="text-sm">Sin comprobante</p>
              </div>
            </div>

            <!-- Resumen de montos -->
            <div class="bg-orange-50 rounded-2xl divide-y divide-orange-100">
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-sm text-slate-600">Valor del recibo</span>
                <span class="font-semibold text-slate-800">{{ formatPrecio(pagoEncargo.precio) }}</span>
              </div>
              <template v-if="historialPago?.comision != null">
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-sm text-slate-600">Comisión (5%)</span>
                  <span class="font-semibold text-slate-800">{{ formatPrecio(historialPago!.comision) }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="font-bold text-slate-800">Total recibido</span>
                  <span class="text-lg font-black text-orange-600">{{ formatPrecio(historialPago!.valorTotal) }}</span>
                </div>
              </template>
            </div>

            <!-- Código de barras EPM -->
            <div v-if="pagoBarcode" class="flex flex-col gap-2">
              <div class="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-2.5">
                <div>
                  <p class="text-xs text-slate-400">Código de barras</p>
                  <p class="text-sm font-mono font-bold text-slate-800 mt-0.5 select-all break-all">{{ pagoBarcode }}</p>
                </div>
                <button
                  type="button"
                  @click="copiarBarcode"
                  class="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ml-3 transition"
                  :class="barcodeCopied ? 'bg-success-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'"
                >
                  {{ barcodeCopied ? '¡Copiado!' : 'Copiar' }}
                </button>
              </div>
              <div v-if="pagoBarcode2" class="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-2.5">
                <div>
                  <p class="text-xs text-slate-400">Código de barras <span class="text-slate-400">(Opción 2)</span></p>
                  <p class="text-sm font-mono font-bold text-slate-800 mt-0.5 select-all break-all">{{ pagoBarcode2 }}</p>
                </div>
                <button
                  type="button"
                  @click="copiarBarcode2"
                  class="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ml-3 transition"
                  :class="barcodeCopied2 ? 'bg-success-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'"
                >
                  {{ barcodeCopied2 ? '¡Copiado!' : 'Copiar' }}
                </button>
              </div>
            </div>

            <!-- Link de pago de la empresa -->
            <div v-if="pagoEncargo.empresa_servicio?.link" class="flex flex-col gap-2">
              <div v-if="pagoEncargo.codigoRecibo && !pagoBarcode" class="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-2.5">
                <div>
                  <p class="text-xs text-slate-400">Código a pegar en la plataforma</p>
                  <p class="text-sm font-mono font-bold text-slate-800 mt-0.5">{{ pagoEncargo.codigoRecibo }}</p>
                </div>
                <Transition name="fade-quick">
                  <span v-if="codigoCopied" class="text-xs font-medium text-success-600 shrink-0">¡Copiado!</span>
                </Transition>
              </div>
              <a
                :href="pagoEncargo.empresa_servicio.link"
                target="_blank"
                rel="noopener"
                @click="copiarCodigo"
                class="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {{ codigoCopied ? '¡Código copiado!' : `Ir a pagar en ${pagoEncargo.empresa_servicio.nombre}` }}
              </a>
            </div>

            <!-- Info recibo -->
            <div class="bg-slate-50 rounded-2xl divide-y divide-slate-100">
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-xs text-slate-400">Empresa de servicio</span>
                <span class="text-sm font-medium text-slate-700">{{ pagoEncargo.empresa_servicio?.nombre ?? '—' }}</span>
              </div>
              <div v-if="pagoEncargo.codigoRecibo" class="flex items-center justify-between px-4 py-3">
                <span class="text-xs text-slate-400">Código / N° cuenta</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-mono text-slate-700">{{ pagoEncargo.codigoRecibo }}</span>
                  <button
                    type="button"
                    @click="copiarCodigo"
                    class="p-1 rounded-md transition"
                    :class="codigoCopied ? 'text-success-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'"
                    title="Copiar código"
                  >
                    <CheckCircle v-if="codigoCopied" class="w-3.5 h-3.5" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div v-if="pagoEncargo.cliente" class="flex items-center justify-between px-4 py-3">
                <span class="text-xs text-slate-400">Cliente</span>
                <span class="text-sm text-slate-700">{{ clienteNombre(pagoEncargo) }}</span>
              </div>
              <div v-if="pagoEncargo.cliente" class="flex items-center justify-between px-4 py-3">
                <span class="text-xs text-slate-400">Teléfono</span>
                <a :href="`tel:${pagoEncargo.cliente.telefonoPrincipal}`" class="text-sm font-medium text-primary-600 hover:underline">
                  {{ pagoEncargo.cliente.telefonoPrincipal }}
                </a>
              </div>
            </div>

            <!-- Comprobante del admin (prueba del pago realizado) -->
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Tu comprobante de pago
                <span class="normal-case font-normal text-slate-400">(opcional)</span>
              </p>
              <!-- Preview -->
              <div v-if="pagoPreview" class="relative rounded-2xl overflow-hidden border border-slate-200">
                <img :src="pagoPreview" alt="Comprobante" class="w-full max-h-56 object-contain bg-slate-50" />
                <button
                  type="button"
                  @click="clearPagoFile"
                  class="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center transition"
                >
                  <X class="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
              <!-- Picker -->
              <label v-else class="flex flex-col items-center gap-2.5 border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl p-5 cursor-pointer transition-colors group">
                <ImagePlus class="w-7 h-7 text-slate-300 group-hover:text-orange-400 transition-colors" />
                <span class="text-xs text-slate-400 text-center">
                  Adjunta el recibo que te dio la empresa de servicio
                  <span class="block mt-0.5 text-slate-300">o pega con <kbd class="font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[10px]">Ctrl+V</kbd></span>
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onPagoFileChange" />
              </label>
            </div>

            <div v-if="pagoError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
              <AlertCircle class="w-4 h-4 shrink-0" /> {{ pagoError }}
            </div>

          </div>

          <!-- Footer -->
          <div class="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              @click="closePagoModal"
              :disabled="pagoLoading"
              class="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              @click="confirmarPagoEncargo"
              :disabled="pagoLoading || historialLoading"
              class="flex-1 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg v-if="pagoLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <CheckCircle v-else class="w-4 h-4" />
              {{ pagoLoading ? 'Procesando...' : 'Confirmar pago realizado' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ===================== Modal cobro notificación ===================== -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showNotifModal && notifRecibo" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeNotifModal" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-warning-50 rounded-xl flex items-center justify-center">
                <Bell class="w-4 h-4 text-warning-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-800 text-sm">Registrar notificación</p>
                <p class="text-xs text-slate-400">
                  {{ notifRecibo.nombre }} &mdash; {{ notifRecibo.cliente?.nombre }} {{ notifRecibo.cliente?.apellido }}
                </p>
              </div>
            </div>
            <button @click="closeNotifModal" class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selecciona el tipo de notificación</p>

            <div class="space-y-2">
              <button
                v-for="tipo in tiposNotificacion"
                :key="tipo.idTipoNotificacion"
                type="button"
                @click="selectedTipo = tipo"
                :class="[
                  'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition',
                  selectedTipo?.idTipoNotificacion === tipo.idTipoNotificacion
                    ? 'border-warning-500 bg-warning-50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                ]"
              >
                <span
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: tipo.color ?? '#94a3b8' }"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800">{{ tipo.nombre }}</p>
                  <p v-if="tipo.precio" class="text-xs text-warning-600 font-medium mt-0.5">
                    {{ formatPrecio(tipo.precio) }}
                  </p>
                  <p v-else class="text-xs text-slate-400 mt-0.5">Sin costo</p>
                </div>
                <div
                  v-if="selectedTipo?.idTipoNotificacion === tipo.idTipoNotificacion"
                  class="w-5 h-5 rounded-full bg-warning-500 flex items-center justify-center shrink-0"
                >
                  <svg class="w-3 h-3 fill-white" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  </svg>
                </div>
              </button>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Observación <span class="normal-case font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                v-model="notifObservacion"
                rows="3"
                placeholder="Ej: Cliente contestó, se comprometió a pagar esta semana..."
                class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-transparent transition resize-none"
              />
            </div>

            <div v-if="notifError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
              <AlertCircle class="w-4 h-4 shrink-0" /> {{ notifError }}
            </div>

          </div>

          <!-- Footer -->
          <div class="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              @click="closeNotifModal"
              :disabled="notifLoading"
              class="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              @click="registrarNotificacion"
              :disabled="!selectedTipo || notifLoading"
              class="flex-1 py-2.5 text-sm font-medium text-white bg-warning-600 hover:bg-warning-700 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg v-if="notifLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {{ notifLoading ? 'Registrando...' : 'Registrar notificación' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ===================== Modal confirmar pago ===================== -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showConfirm && confirmRecibo" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeConfirm" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div class="flex flex-col items-center text-center gap-4">

            <div class="w-14 h-14 bg-success-50 rounded-full flex items-center justify-center">
              <CheckCircle class="w-7 h-7 text-success-600" />
            </div>

            <div class="w-full">
              <h3 class="font-semibold text-slate-800 text-base">¿Marcar como pagado?</h3>
              <p class="text-slate-500 text-sm mt-1 mb-4">
                Esta acción no se puede deshacer.
              </p>

              <div class="bg-slate-50 rounded-xl divide-y divide-slate-100 text-left">
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Recibo</span>
                  <span class="text-sm font-medium text-slate-800">{{ confirmRecibo.nombre }}</span>
                </div>
                <div v-if="confirmRecibo.codigoRecibo" class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Código</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono text-slate-700">{{ confirmRecibo.codigoRecibo }}</span>
                    <button
                      type="button"
                      @click="copiarConfirmCodigo"
                      class="p-1 rounded-md transition"
                      :class="confirmCodigoCopied ? 'text-success-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'"
                      title="Copiar código"
                    >
                      <CheckCircle v-if="confirmCodigoCopied" class="w-3.5 h-3.5" />
                      <Copy v-else class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div v-if="confirmBarcode" class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Código de barras</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono text-slate-700 break-all text-right">{{ confirmBarcode }}</span>
                    <button
                      type="button"
                      @click="copiarConfirmBarcode"
                      class="p-1 rounded-md transition shrink-0"
                      :class="confirmBarcodeCopied ? 'text-success-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'"
                      title="Copiar código de barras"
                    >
                      <CheckCircle v-if="confirmBarcodeCopied" class="w-3.5 h-3.5" />
                      <Copy v-else class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div v-if="confirmBarcode2" class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Código de barras <span class="text-slate-300">(Opción 2)</span></span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono text-slate-700 break-all text-right">{{ confirmBarcode2 }}</span>
                    <button
                      type="button"
                      @click="copiarConfirmBarcode2"
                      class="p-1 rounded-md transition shrink-0"
                      :class="confirmBarcodeCopied2 ? 'text-success-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'"
                      title="Copiar código de barras (Opción 2)"
                    >
                      <CheckCircle v-if="confirmBarcodeCopied2" class="w-3.5 h-3.5" />
                      <Copy v-else class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div v-if="confirmRecibo.tipo_factura" class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Tipo de factura</span>
                  <span class="text-sm text-slate-700">{{ confirmRecibo.tipo_factura.nombre }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Valor</span>
                  <span class="text-sm font-semibold text-slate-800">{{ formatPrecio(confirmRecibo.precio) }}</span>
                </div>
                <div v-if="confirmRecibo.cliente" class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Cliente</span>
                  <span class="text-sm text-slate-700">{{ clienteNombre(confirmRecibo) }}</span>
                </div>
                <div v-if="confirmRecibo.cliente" class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Teléfono</span>
                  <span class="text-sm font-mono text-slate-700">{{ confirmRecibo.cliente.telefonoPrincipal }}</span>
                </div>
              </div>
            </div>

            <!-- Adjuntar comprobante -->
            <div class="w-full">
              <p class="text-xs text-slate-500 font-medium mb-2 text-left">
                Comprobante de pago <span class="font-normal text-slate-400">(opcional)</span>
              </p>
              <!-- Preview -->
              <div v-if="confirmPreview" class="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
                <img :src="confirmPreview" alt="Comprobante" class="w-full max-h-44 object-contain bg-slate-50" />
                <button
                  type="button"
                  @click="clearConfirmFile"
                  class="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center transition"
                >
                  <X class="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
              <!-- Picker -->
              <label v-else class="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 hover:border-success-400 rounded-xl p-4 cursor-pointer transition-colors group">
                <ImagePlus class="w-6 h-6 text-slate-300 group-hover:text-success-500 transition-colors" />
                <span class="text-xs text-slate-400 text-center">
                  Toca para seleccionar
                  <span class="block mt-0.5 text-slate-300">o pega con <kbd class="font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded text-[10px]">Ctrl+V</kbd></span>
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onConfirmFileChange" />
              </label>
            </div>

            <div v-if="confirmError" class="w-full flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
              <AlertCircle class="w-4 h-4 shrink-0" /> {{ confirmError }}
            </div>

            <div class="flex gap-3 w-full pt-1">
              <button
                @click="closeConfirm"
                :disabled="confirmLoading"
                class="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                @click="markAsPagado"
                :disabled="confirmLoading"
                class="flex-1 py-2.5 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <svg v-if="confirmLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {{ confirmLoading ? 'Guardando...' : 'Sí, marcar pagado' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ===================== Panel de detalle ===================== -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="showPanel && selected" class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="closePanel" />

        <!-- Drawer -->
        <div class="relative w-full max-w-md bg-white h-full flex flex-col shadow-xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                <FileText class="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-800 text-sm leading-tight">Detalle del recibo</p>
                <p class="text-slate-400 text-xs font-mono">#{{ selected.idRecibo }}</p>
              </div>
            </div>
            <button @click="closePanel" class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            <!-- Estado badge -->
            <span :class="['inline-flex px-3 py-1.5 rounded-full text-xs font-semibold', statusClass(selected)]">
              {{ statusLabel(selected) }}
            </span>

            <!-- Info del recibo -->
            <section>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Información del recibo</h3>
              <div class="space-y-3">

                <div class="flex items-start gap-3">
                  <Hash class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Nombre</p>
                    <p class="text-sm font-medium text-slate-800">{{ selected.nombre }}</p>
                  </div>
                </div>

                <div v-if="selected.codigoRecibo" class="flex items-start gap-3">
                  <Hash class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Código / N° de cuenta</p>
                    <p class="text-sm font-mono text-slate-800">{{ selected.codigoRecibo }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <Building2 class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Empresa de servicio</p>
                    <p class="text-sm text-slate-800">{{ selected.empresa_servicio?.nombre ?? '—' }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <FileText class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Tipo de factura</p>
                    <p class="text-sm text-slate-800">{{ selected.tipo_factura?.nombre ?? '—' }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <CreditCard class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Valor</p>
                    <p class="text-sm font-semibold text-slate-800">{{ formatPrecio(selected.precio) }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="flex items-start gap-3">
                    <Calendar class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p class="text-xs text-slate-400">Pago oportuno</p>
                      <p class="text-sm text-slate-800">{{ formatFecha(selected.fechaOportuna) }}</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <Calendar class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p class="text-xs text-slate-400">Fecha límite</p>
                      <p class="text-sm font-medium text-slate-800">{{ formatFecha(selected.fechaMaxima) }}</p>
                    </div>
                  </div>
                </div>

                <div v-if="selected.fechaSuspencion" class="flex items-start gap-3">
                  <Calendar class="w-4 h-4 text-danger mt-0.5 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Fecha de suspensión</p>
                    <p class="text-sm text-danger font-medium">{{ formatFecha(selected.fechaSuspencion) }}</p>
                  </div>
                </div>

                <div v-if="selected.observacion" class="bg-slate-50 rounded-xl p-3">
                  <p class="text-xs text-slate-400 mb-1">Observación</p>
                  <p class="text-sm text-slate-700">{{ selected.observacion }}</p>
                </div>
              </div>
            </section>

            <div class="h-px bg-slate-100" />

            <!-- Info del cliente -->
            <section>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos del cliente</h3>

              <div v-if="!selected.cliente" class="text-sm text-slate-400 italic">Sin cliente asociado</div>

              <div v-else class="space-y-3">

                <div class="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div class="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
                    <span class="text-white text-sm font-bold">
                      {{ selected.cliente.nombre[0] }}{{ selected.cliente.apellido[0] }}
                    </span>
                  </div>
                  <div>
                    <p class="font-semibold text-slate-800 text-sm">{{ selected.cliente.nombre }} {{ selected.cliente.apellido }}</p>
                    <p class="text-slate-400 text-xs font-mono">CC {{ selected.cliente.cedula }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <Phone class="w-4 h-4 text-slate-400 shrink-0" />
                  <div class="flex-1">
                    <p class="text-xs text-slate-400">Teléfono principal</p>
                    <a
                      :href="`tel:${selected.cliente.telefonoPrincipal}`"
                      class="text-sm text-primary-600 font-medium hover:underline"
                    >{{ selected.cliente.telefonoPrincipal }}</a>
                  </div>
                </div>

                <div v-if="selected.cliente.telefonoSecundario" class="flex items-center gap-3">
                  <Phone class="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Teléfono secundario</p>
                    <a
                      :href="`tel:${selected.cliente.telefonoSecundario}`"
                      class="text-sm text-primary-600 font-medium hover:underline"
                    >{{ selected.cliente.telefonoSecundario }}</a>
                  </div>
                </div>

                <div v-if="selected.cliente.whatsapp" class="flex items-center gap-3">
                  <MessageCircle class="w-4 h-4 text-success-600 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">WhatsApp</p>
                    <a
                      :href="`https://wa.me/57${selected.cliente.whatsapp}`"
                      target="_blank"
                      class="text-sm text-success-600 font-medium hover:underline"
                    >{{ selected.cliente.whatsapp }}</a>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <Mail class="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Correo electrónico</p>
                    <a
                      :href="`mailto:${selected.cliente.correo}`"
                      class="text-sm text-primary-600 font-medium hover:underline"
                    >{{ selected.cliente.correo }}</a>
                  </div>
                </div>

                <div v-if="selected.cliente.direccion" class="flex items-start gap-3">
                  <MapPin class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p class="text-xs text-slate-400">Dirección</p>
                    <p class="text-sm text-slate-700">{{ selected.cliente.direccion }}</p>
                  </div>
                </div>

              </div>
            </section>
          </div>

          <!-- Footer acciones rápidas -->
          <div class="shrink-0 border-t border-slate-100 px-6 py-4 flex flex-col gap-2">
            <!-- Botón historial siempre visible -->
            <button
              @click="openHistorial(selected)"
              class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                     text-primary-600 bg-primary-50 hover:bg-primary-100 transition"
            >
              <History class="w-4 h-4" /> Ver historial de la factura
            </button>
          </div>

          <!-- Footer acciones rápidas (cliente) -->
          <div v-if="selected.cliente" class="shrink-0 border-t border-slate-100 px-6 py-4 flex flex-col gap-2">
            <div class="flex gap-2">
              <a
                :href="`tel:${selected.cliente.telefonoPrincipal}`"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition"
              >
                <Phone class="w-4 h-4" /> Llamar
              </a>
              <a
                v-if="whatsappNumero(selected.cliente)"
                :href="`https://wa.me/57${whatsappNumero(selected.cliente)}`"
                target="_blank"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-success-600 hover:bg-success-700 text-white text-sm font-medium rounded-xl transition"
              >
                <MessageCircle class="w-4 h-4" /> WhatsApp
              </a>
            </div>
            <button
              v-if="whatsappNumero(selected.cliente)"
              @click="shareWhatsapp(selected)"
              :disabled="loadingWa"
              class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                     text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 active:bg-[#25D366]/30
                     transition disabled:opacity-50"
            >
              <svg v-if="loadingWa" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar recordatorio por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  <!-- ===================== Modal historial ===================== -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showHistorial && historialRecibo" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showHistorial = false" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                <History class="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-800 text-sm">Historial de la factura</p>
                <p class="text-slate-400 text-xs truncate max-w-[200px]">{{ historialRecibo.nombre }}</p>
              </div>
            </div>
            <button @click="showHistorial = false" class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            <!-- Loading -->
            <div v-if="loadingHistorial" class="flex justify-center py-10">
              <svg class="w-6 h-6 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>

            <template v-else>

              <!-- Historial de pagos -->
              <section>
                <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pagos</h3>
                <div v-if="historialPagos.length === 0" class="text-sm text-slate-400 italic">Sin registros de pago</div>
                <div v-else class="space-y-3">
                  <div
                    v-for="p in historialPagos"
                    :key="p.idHistorialPagoRecibo"
                    class="bg-slate-50 rounded-xl p-4 space-y-2"
                  >
                    <div class="flex items-center justify-between">
                      <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', p.pagado ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600']">
                        {{ p.pagado ? 'Pagado' : 'Pendiente' }}
                      </span>
                      <span class="text-xs text-slate-400">{{ p.fechaSolicitud ? formatFecha(p.fechaSolicitud) : '—' }}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p class="text-xs text-slate-400">Valor</p>
                        <p class="text-sm font-semibold text-slate-800">{{ formatPrecio(p.valorRecibo) }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-slate-400">Comisión</p>
                        <p class="text-sm font-semibold text-slate-800">{{ formatPrecio(p.comision ?? 0) }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-slate-400">Total</p>
                        <p class="text-sm font-semibold text-primary-600">{{ formatPrecio(p.valorTotal) }}</p>
                      </div>
                    </div>
                    <div v-if="p.urlComprobante" class="pt-1">
                      <p class="text-xs text-slate-400 mb-1">Comprobante cliente</p>
                      <a :href="p.urlComprobante" target="_blank" class="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:underline font-medium">
                        <Eye class="w-3.5 h-3.5" /> Ver imagen
                      </a>
                    </div>
                  </div>
                </div>
              </section>

            </template>
          </div>

          <!-- Footer -->
          <div class="shrink-0 border-t border-slate-100 px-6 py-4">
            <button
              @click="showHistorial = false"
              class="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >Cerrar</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.95);
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-enter-active .relative,
.drawer-leave-active .relative {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .relative {
  transform: translateX(100%);
}

.fade-quick-enter-active,
.fade-quick-leave-active {
  transition: opacity 0.2s ease;
}
.fade-quick-enter-from,
.fade-quick-leave-to {
  opacity: 0;
}
</style>
