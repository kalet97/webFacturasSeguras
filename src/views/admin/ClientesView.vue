<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Pencil, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight, Trash2, FileText, CreditCard, RefreshCcw, ArrowRightLeft } from 'lucide-vue-next'
import CrudModal from '@/components/admin/CrudModal.vue'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

interface PlanInfo { idPlan: number; nombre: string; precio: number; maxFacturas: number | null; maxPrecioPorFactura: number }
interface SuscripcionActiva { idSuscripcion: number; idPlan: number; plan: PlanInfo | null; fechaProximoPago: string | null; fechaInicio: string | null }

interface Cliente {
  idCliente: number; nombre: string; apellido: string; cedula: number
  correo: string; telefonoPrincipal: number; telefonoSecundario: number | null
  whatsapp: number | null; direccion: string | null; activo: number
  suscripcion_activa: SuscripcionActiva | null
}
interface Paginator { data: Cliente[]; current_page: number; last_page: number; total: number }

interface EmpresaServicio { idEmpresaServicio: number; nombre: string; idTipoFactura: number | null }
interface TipoFactura    { idTipoFactura: number; nombre: string }
interface EstadoRecibo   { idEstadoRecibo: number; nombre: string; color: string | null }
interface Recibo {
  idRecibo: number; nombre: string; codigoRecibo: string | null
  precio: number | null; fechaOportuna: string | null; fechaMaxima: string | null
  fechaSuspencion: string | null; observacion: string | null
  empresa_servicio: EmpresaServicio | null
  tipo_factura: TipoFactura | null
  estado_recibo: EstadoRecibo | null
  idEmpresaServicio: number; idTipoFactura: number; idEstadoRecibo: number
}

const adminAuth = useAdminAuthStore()

const items       = ref<Cliente[]>([])
const loading     = ref(false)
const saving      = ref(false)
const error       = ref('')
const formError   = ref('')
const search      = ref('')
const currentPage = ref(1)
const lastPage    = ref(1)
const total       = ref(0)

const showModal = ref(false)
const editing   = ref<Cliente | null>(null)

const emptyForm = () => ({
  nombre: '', apellido: '', cedula: '', correo: '', clave: '',
  telefonoPrincipal: '', telefonoSecundario: '', whatsapp: '', direccion: '', activo: true,
})
const form = ref(emptyForm())

async function fetchAll() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(currentPage.value) })
    if (search.value.trim()) params.set('search', search.value.trim())
    const data = await api.get<Paginator>(`/clientes?${params}`, adminAuth.token)
    items.value = data.data
    lastPage.value = data.last_page
    total.value = data.total
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar'
  } finally {
    loading.value = false
  }
}

watch(search, () => { currentPage.value = 1; fetchAll() })
watch(currentPage, fetchAll)
onMounted(fetchAll)

function openCreate() {
  editing.value = null
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(item: Cliente) {
  editing.value = item
  form.value = {
    nombre: item.nombre, apellido: item.apellido, cedula: String(item.cedula),
    correo: item.correo, clave: '',
    telefonoPrincipal: String(item.telefonoPrincipal),
    telefonoSecundario: item.telefonoSecundario ? String(item.telefonoSecundario) : '',
    whatsapp: item.whatsapp ? String(item.whatsapp) : '',
    direccion: item.direccion ?? '',
    activo: Boolean(item.activo),
  }
  recibos.value = []
  suscripcionActiva.value = null
  showChangePlan.value = false
  showModal.value = true
  fetchRecibosCliente(item.idCliente)
  fetchSuscripcion(item.idCliente)
  if (empresas.value.length === 0) fetchCatalogos()
}

function close() {
  showModal.value = false
  showReciboModal.value = false
}

// --- Recibos del cliente editado ---
const recibos          = ref<Recibo[]>([])
const loadingRecibos   = ref(false)
const empresas         = ref<EmpresaServicio[]>([])
const estados          = ref<EstadoRecibo[]>([])

const showReciboModal  = ref(false)
const editingRecibo    = ref<Recibo | null>(null)
const savingRecibo     = ref(false)
const reciboFormError  = ref('')
const deletingReciboId = ref<number | null>(null)

// --- Suscripción / Plan ---
const planes             = ref<PlanInfo[]>([])
const suscripcionActiva  = ref<SuscripcionActiva | null>(null)
const loadingSuscripcion = ref(false)
const changingPlan       = ref(false)
const renewingPlan       = ref(false)
const planError          = ref('')
const selectedPlanId     = ref<number | null>(null)
const showChangePlan     = ref(false)

async function fetchPlanes() {
  if (planes.value.length > 0) return
  try { planes.value = await api.get<PlanInfo[]>('/planes', adminAuth.token) } catch {}
}

async function fetchSuscripcion(idCliente: number) {
  loadingSuscripcion.value = true
  planError.value = ''
  try {
    suscripcionActiva.value = await api.get<SuscripcionActiva>(`/clientes/${idCliente}/suscripcion`, adminAuth.token)
  } catch {
    suscripcionActiva.value = null
  } finally {
    loadingSuscripcion.value = false
  }
}

function openChangePlan() {
  selectedPlanId.value = suscripcionActiva.value?.idPlan ?? null
  planError.value = ''
  showChangePlan.value = true
  fetchPlanes()
}

async function cambiarPlan() {
  if (!editing.value || !selectedPlanId.value) return
  if (suscripcionActiva.value && selectedPlanId.value === suscripcionActiva.value.idPlan) return
  changingPlan.value = true
  planError.value = ''
  try {
    if (suscripcionActiva.value) {
      await api.put(`/suscripciones/${suscripcionActiva.value.idSuscripcion}`, { idPlan: selectedPlanId.value }, adminAuth.token)
    } else {
      await api.post('/suscripciones', { idCliente: editing.value.idCliente, idPlan: selectedPlanId.value }, adminAuth.token)
    }
    await fetchSuscripcion(editing.value.idCliente)
    showChangePlan.value = false
  } catch (e: unknown) {
    planError.value = e instanceof Error ? e.message : 'Error al cambiar el plan'
  } finally {
    changingPlan.value = false
  }
}

async function renovarSuscripcion() {
  if (!editing.value || !suscripcionActiva.value) return
  renewingPlan.value = true
  planError.value = ''
  try {
    await api.put(`/suscripciones/${suscripcionActiva.value.idSuscripcion}/renovar`, {}, adminAuth.token)
    await fetchSuscripcion(editing.value.idCliente)
  } catch (e: unknown) {
    planError.value = e instanceof Error ? e.message : 'Error al renovar'
  } finally {
    renewingPlan.value = false
  }
}

const emptyReciboForm = () => ({
  nombre: '', codigoRecibo: '', precio: '',
  idEmpresaServicio: '', idEstadoRecibo: '',
  fechaOportuna: '', fechaMaxima: '', fechaSuspencion: '', observacion: '',
})
const reciboForm = ref(emptyReciboForm())

async function fetchCatalogos() {
  const [e, es] = await Promise.all([
    api.get<EmpresaServicio[]>('/empresas-servicios', adminAuth.token),
    api.get<EstadoRecibo[]>('/estado-recibos', adminAuth.token),
  ])
  empresas.value = e
  estados.value  = es
}

async function fetchRecibosCliente(idCliente: number) {
  loadingRecibos.value = true
  try {
    recibos.value = await api.get<Recibo[]>(`/clientes/${idCliente}/recibos?incluirEliminados=1`, adminAuth.token)
  } catch {
    recibos.value = []
  } finally {
    loadingRecibos.value = false
  }
}

const ESTADO_ELIMINADO = 6

function isEliminado(r: Recibo) {
  return r.estado_recibo?.idEstadoRecibo === ESTADO_ELIMINADO
}

function openReciboCreate() {
  editingRecibo.value = null
  reciboForm.value    = emptyReciboForm()
  reciboFormError.value = ''
  showReciboModal.value = true
}

function openReciboEdit(r: Recibo) {
  editingRecibo.value = r
  reciboForm.value = {
    nombre:             r.nombre,
    codigoRecibo:       r.codigoRecibo ?? '',
    precio:             r.precio != null ? String(r.precio) : '',
    idEmpresaServicio:  String(r.idEmpresaServicio),
    idEstadoRecibo:     String(r.idEstadoRecibo),
    fechaOportuna:      r.fechaOportuna ? r.fechaOportuna.slice(0, 10) : '',
    fechaMaxima:        r.fechaMaxima   ? r.fechaMaxima.slice(0, 10)   : '',
    fechaSuspencion:    r.fechaSuspencion ? r.fechaSuspencion.slice(0, 10) : '',
    observacion:        r.observacion ?? '',
  }
  reciboFormError.value = ''
  showReciboModal.value = true
}

async function submitRecibo() {
  if (!editing.value) return
  reciboFormError.value = ''

  if (!reciboForm.value.codigoRecibo) {
    reciboFormError.value = 'El código de la factura es obligatorio'
    return
  }

  const empresa = empresas.value.find(e => e.idEmpresaServicio === Number(reciboForm.value.idEmpresaServicio))
  if (!empresa?.idTipoFactura) {
    reciboFormError.value = 'La empresa de servicio seleccionada no tiene un tipo de factura configurado'
    return
  }

  savingRecibo.value = true

  const payload: Record<string, unknown> = {
    nombre:            reciboForm.value.nombre,
    codigoRecibo:      reciboForm.value.codigoRecibo,
    precio:            Number(reciboForm.value.precio),
    idEmpresaServicio: Number(reciboForm.value.idEmpresaServicio),
    idTipoFactura:     empresa.idTipoFactura,
    idEstadoRecibo:    Number(reciboForm.value.idEstadoRecibo),
    fechaOportuna:     reciboForm.value.fechaOportuna  || null,
    fechaMaxima:       reciboForm.value.fechaMaxima    || null,
    fechaSuspencion:   reciboForm.value.fechaSuspencion || null,
    observacion:       reciboForm.value.observacion    || null,
  }

  try {
    if (editingRecibo.value) {
      await api.put(`/recibos/${editingRecibo.value.idRecibo}`, payload, adminAuth.token)
    } else {
      payload.idCliente = editing.value.idCliente
      await api.post('/recibos', payload, adminAuth.token)
    }
    await fetchRecibosCliente(editing.value.idCliente)
    showReciboModal.value = false
  } catch (e: unknown) {
    reciboFormError.value = e instanceof Error ? e.message : 'Error al guardar'
  } finally {
    savingRecibo.value = false
  }
}

async function deleteRecibo(r: Recibo) {
  if (!confirm(`¿Eliminar la factura "${r.nombre}"?`)) return
  if (!editing.value) return
  deletingReciboId.value = r.idRecibo
  try {
    await api.put(`/recibos/${r.idRecibo}`, { idEstadoRecibo: ESTADO_ELIMINADO, idUsuario: adminAuth.user?.idUsuario ?? null }, adminAuth.token)
    await fetchRecibosCliente(editing.value.idCliente)
  } catch {
    // silencioso
  } finally {
    deletingReciboId.value = null
  }
}

function formatFecha(f: string | null) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function proximoPagoUrgente(f: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(f); venc.setHours(0, 0, 0, 0)
  const dias = Math.round((venc.getTime() - hoy.getTime()) / 86400000)
  return dias <= 5
}
function formatPrecio(v: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

async function submit() {
  formError.value = ''
  saving.value = true

  const payload: Record<string, unknown> = {
    nombre: form.value.nombre,
    apellido: form.value.apellido,
    cedula: Number(form.value.cedula),
    correo: form.value.correo,
    telefonoPrincipal: Number(form.value.telefonoPrincipal),
    telefonoSecundario: form.value.telefonoSecundario ? Number(form.value.telefonoSecundario) : null,
    whatsapp: form.value.whatsapp ? Number(form.value.whatsapp) : null,
    direccion: form.value.direccion || null,
    activo: form.value.activo ? 1 : 0,
  }
  if (form.value.clave) payload.clave = form.value.clave

  try {
    if (editing.value) {
      await api.put(`/clientes/${editing.value.idCliente}`, payload, adminAuth.token)
    } else {
      if (!form.value.clave) { formError.value = 'La contraseña es requerida'; saving.value = false; return }
      await api.post('/clientes', payload, adminAuth.token)
    }
    await fetchAll()
    close()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'Error al guardar'
  } finally {
    saving.value = false
  }
}

const pages = computed(() => {
  const p: number[] = []
  for (let i = Math.max(1, currentPage.value - 2); i <= Math.min(lastPage.value, currentPage.value + 2); i++) p.push(i)
  return p
})

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'
</script>

<template>
  <div class="p-6 lg:p-8 max-w-6xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Clientes</h2>
        <p class="text-slate-500 text-sm mt-0.5">{{ total }} registros</p>
      </div>
      <div class="flex gap-2">
        <button @click="fetchAll" class="p-2 text-slate-500 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition">
          <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
        </button>
        <button @click="openCreate" class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition">
          <Plus class="w-4 h-4" /> Agregar
        </button>
      </div>
    </div>

    <div class="relative mb-5">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input v-model="search" type="text" placeholder="Buscar por nombre, cédula o correo..." :class="['pl-10 ' + inputClass]" />
    </div>

    <div v-if="error" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-4 py-3 mb-4">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ error }}
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th class="text-left px-5 py-3.5">ID</th>
                <th class="text-left px-5 py-3.5">Nombre</th>
                <th class="text-left px-5 py-3.5">Cédula</th>
                <th class="text-left px-5 py-3.5">Correo</th>
                <th class="text-left px-5 py-3.5">Teléfono</th>
                <th class="text-left px-5 py-3.5">Plan</th>
                <th class="text-left px-5 py-3.5">Próximo pago</th>
                <th class="text-left px-5 py-3.5">Estado</th>
                <th class="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="items.length === 0">
                <td colspan="9" class="text-center py-12 text-slate-400 text-sm">Sin registros</td>
              </tr>
              <tr v-for="item in items" :key="item.idCliente" class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 text-slate-400 font-mono text-xs">#{{ item.idCliente }}</td>
                <td class="px-5 py-3.5 font-medium text-slate-800">{{ item.nombre }} {{ item.apellido }}</td>
                <td class="px-5 py-3.5 text-slate-600 font-mono">{{ item.cedula }}</td>
                <td class="px-5 py-3.5 text-slate-600 truncate max-w-[180px]">{{ item.correo }}</td>
                <td class="px-5 py-3.5 text-slate-600">{{ item.telefonoPrincipal }}</td>
                <td class="px-5 py-3.5">
                  <span v-if="item.suscripcion_activa?.plan" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {{ item.suscripcion_activa.plan.nombre }}
                  </span>
                  <span v-else class="text-xs text-slate-400">Sin plan</span>
                </td>
                <td class="px-5 py-3.5">
                  <span v-if="item.suscripcion_activa?.fechaProximoPago" :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-medium', proximoPagoUrgente(item.suscripcion_activa.fechaProximoPago) ? 'bg-warning-50 text-warning-600' : 'text-slate-600']">
                    {{ formatFecha(item.suscripcion_activa.fechaProximoPago) }}
                  </span>
                  <span v-else class="text-xs text-slate-400">—</span>
                </td>
                <td class="px-5 py-3.5">
                  <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-medium', item.activo ? 'bg-success-50 text-success-600' : 'bg-slate-100 text-slate-500']">
                    {{ item.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-right">
                  <button @click="openEdit(item)" class="text-slate-400 hover:text-primary-600 transition p-1.5 rounded-lg hover:bg-primary-50">
                    <Pencil class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="lastPage > 1" class="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p class="text-xs text-slate-500">Página {{ currentPage }} de {{ lastPage }}</p>
          <div class="flex items-center gap-1">
            <button @click="currentPage--" :disabled="currentPage === 1" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button v-for="p in pages" :key="p" @click="currentPage = p" :class="['min-w-[32px] h-8 rounded-lg text-xs font-medium transition', p === currentPage ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100']">{{ p }}</button>
            <button @click="currentPage++" :disabled="currentPage === lastPage" class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <CrudModal :show="showModal" :title="editing ? 'Editar cliente' : 'Nuevo cliente'" :saving="saving" :wide="true" @close="close" @submit="submit">
      <div class="flex flex-col gap-4">
        <div v-if="formError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
          <AlertCircle class="w-4 h-4 shrink-0" /> {{ formError }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre <span class="text-danger">*</span></label>
            <input v-model="form.nombre" type="text" placeholder="Juan" :class="inputClass" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Apellido <span class="text-danger">*</span></label>
            <input v-model="form.apellido" type="text" placeholder="Pérez" :class="inputClass" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Cédula <span class="text-danger">*</span></label>
            <input v-model="form.cedula" type="text" inputmode="numeric" placeholder="1234567890" :class="inputClass" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Correo <span class="text-danger">*</span></label>
            <input v-model="form.correo" type="email" placeholder="cliente@correo.com" :class="inputClass" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Contraseña
            <span class="text-slate-400 text-xs font-normal">{{ editing ? '(dejar vacío para no cambiar)' : '*' }}</span>
          </label>
          <input v-model="form.clave" type="password" placeholder="••••••••" :class="inputClass" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Teléfono principal <span class="text-danger">*</span></label>
            <input v-model="form.telefonoPrincipal" type="text" inputmode="numeric" placeholder="3001234567" :class="inputClass" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Teléfono secundario <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <input v-model="form.telefonoSecundario" type="text" inputmode="numeric" placeholder="3009876543" :class="inputClass" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <input v-model="form.whatsapp" type="text" inputmode="numeric" placeholder="3001234567" :class="inputClass" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Dirección <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
            <input v-model="form.direccion" type="text" placeholder="Calle 10 # 5-20" :class="inputClass" />
          </div>
        </div>

        <div class="flex items-center justify-between py-1">
          <p class="text-sm font-medium text-slate-700">Activo</p>
          <button type="button" @click="form.activo = !form.activo" :class="['relative w-11 h-6 rounded-full transition-colors', form.activo ? 'bg-primary-600' : 'bg-slate-300']">
            <span :class="['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form.activo && 'translate-x-5']" />
          </button>
        </div>

        <!-- Suscripción / Plan (solo en edición) -->
        <template v-if="editing">
          <div class="h-px bg-slate-100 my-1" />

          <div class="flex items-center gap-2 mb-2">
            <CreditCard class="w-4 h-4 text-slate-400" />
            <p class="text-sm font-semibold text-slate-700">Suscripción</p>
          </div>

          <div v-if="loadingSuscripcion" class="flex justify-center py-3">
            <div class="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>

          <template v-else>
            <!-- Sin suscripción -->
            <div v-if="!suscripcionActiva" class="bg-slate-50 rounded-xl p-4 text-center">
              <p class="text-sm text-slate-400 italic mb-3">Sin suscripción activa</p>
              <button
                type="button"
                @click="openChangePlan"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
              >
                <Plus class="w-3.5 h-3.5" /> Asignar plan
              </button>
            </div>

            <!-- Con suscripción -->
            <div v-else class="bg-slate-50 rounded-xl overflow-hidden">
              <div class="divide-y divide-slate-100">
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Plan actual</span>
                  <span class="text-sm font-semibold text-primary-600">{{ suscripcionActiva.plan?.nombre ?? '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Precio</span>
                  <span class="text-sm font-medium text-slate-700">{{ suscripcionActiva.plan ? formatPrecio(suscripcionActiva.plan.precio) : '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Próximo pago</span>
                  <span
                    class="text-sm font-medium"
                    :class="suscripcionActiva.fechaProximoPago && proximoPagoUrgente(suscripcionActiva.fechaProximoPago) ? 'text-danger' : 'text-slate-700'"
                  >
                    {{ formatFecha(suscripcionActiva.fechaProximoPago) }}
                  </span>
                </div>
                <div v-if="suscripcionActiva.plan" class="flex items-center justify-between px-4 py-3">
                  <span class="text-xs text-slate-400">Límite facturas</span>
                  <span class="text-sm text-slate-700">{{ suscripcionActiva.plan.maxFacturas ?? 'Ilimitadas' }}</span>
                </div>
              </div>

              <div class="flex gap-2 px-4 py-3 border-t border-slate-100">
                <button
                  type="button"
                  @click="renovarSuscripcion"
                  :disabled="renewingPlan"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCcw :class="['w-3.5 h-3.5', renewingPlan && 'animate-spin']" />
                  {{ renewingPlan ? 'Renovando...' : 'Renovar pago (+1 mes)' }}
                </button>
                <button
                  type="button"
                  @click="openChangePlan"
                  class="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
                >
                  <ArrowRightLeft class="w-3.5 h-3.5" />
                  Cambiar plan
                </button>
              </div>
            </div>

            <!-- Selector de plan (expandible) -->
            <div v-if="showChangePlan" class="mt-3 border border-slate-200 rounded-xl p-4 bg-white">
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Seleccionar plan</p>
              <div class="flex flex-col gap-2">
                <button
                  v-for="p in planes"
                  :key="p.idPlan"
                  type="button"
                  @click="selectedPlanId = p.idPlan"
                  :class="[
                    'flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition',
                    selectedPlanId === p.idPlan
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300',
                  ]"
                >
                  <div>
                    <p class="text-sm font-semibold text-slate-800">{{ p.nombre }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">
                      {{ p.maxFacturas ? `Hasta ${p.maxFacturas} facturas` : 'Facturas ilimitadas' }}
                      · Tope {{ formatPrecio(p.maxPrecioPorFactura) }}
                    </p>
                  </div>
                  <div class="text-right shrink-0 ml-3">
                    <p class="font-bold text-primary-600">{{ formatPrecio(p.precio) }}</p>
                    <p class="text-xs text-slate-400">/mes</p>
                  </div>
                </button>
              </div>
              <div class="flex gap-2 mt-3">
                <button
                  type="button"
                  @click="showChangePlan = false"
                  :disabled="changingPlan"
                  class="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
                >Cancelar</button>
                <button
                  type="button"
                  @click="cambiarPlan"
                  :disabled="changingPlan || !selectedPlanId || selectedPlanId === suscripcionActiva?.idPlan"
                  class="flex-1 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
                >{{ changingPlan ? 'Guardando...' : 'Confirmar cambio' }}</button>
              </div>
            </div>

            <div v-if="planError" class="flex items-center gap-2 text-xs text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2 mt-2">
              <AlertCircle class="w-3.5 h-3.5 shrink-0" /> {{ planError }}
            </div>
          </template>
        </template>

        <!-- Facturas del cliente (solo en edición) -->
        <template v-if="editing">
          <div class="h-px bg-slate-100 my-1" />

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-slate-400" />
              <p class="text-sm font-semibold text-slate-700">Facturas</p>
              <span class="text-xs text-slate-400">({{ recibos.filter(r => !isEliminado(r)).length }})</span>
            </div>
            <button
              type="button"
              @click="openReciboCreate"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
            >
              <Plus class="w-3.5 h-3.5" /> Agregar
            </button>
          </div>

          <!-- Loading recibos -->
          <div v-if="loadingRecibos" class="flex justify-center py-4">
            <div class="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>

          <!-- Lista de recibos -->
          <div v-else-if="recibos.length === 0" class="text-sm text-slate-400 italic text-center py-3">
            Este cliente no tiene facturas registradas
          </div>

          <div v-else class="border border-slate-200 rounded-xl overflow-hidden">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wide">
                  <th class="text-left px-3 py-2.5">Nombre</th>
                  <th class="text-left px-3 py-2.5">Empresa</th>
                  <th class="text-left px-3 py-2.5">Valor</th>
                  <th class="text-left px-3 py-2.5">Vence</th>
                  <th class="text-left px-3 py-2.5">Estado</th>
                  <th class="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="r in recibos"
                  :key="r.idRecibo"
                  :class="[
                    'transition-colors',
                    isEliminado(r) ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50',
                  ]"
                >
                  <td class="px-3 py-2.5 font-medium" :class="isEliminado(r) ? 'text-slate-400 line-through' : 'text-slate-800'">{{ r.nombre }}</td>
                  <td class="px-3 py-2.5 text-slate-500">{{ r.empresa_servicio?.nombre ?? '—' }}</td>
                  <td class="px-3 py-2.5 text-slate-700 font-mono">{{ formatPrecio(r.precio) }}</td>
                  <td class="px-3 py-2.5 text-slate-500">{{ formatFecha(r.fechaMaxima) }}</td>
                  <td class="px-3 py-2.5">
                    <span
                      v-if="r.estado_recibo"
                      class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      :style="{ backgroundColor: r.estado_recibo.color ?? '#94a3b8' }"
                    >{{ r.estado_recibo.nombre }}</span>
                    <span v-else class="text-slate-400">—</span>
                  </td>
                  <td class="px-3 py-2.5">
                    <div v-if="!isEliminado(r)" class="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        @click="openReciboEdit(r)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition"
                      >
                        <Pencil class="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        @click="deleteRecibo(r)"
                        :disabled="deletingReciboId === r.idRecibo"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-50 transition disabled:opacity-40"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </CrudModal>

    <!-- Modal crear/editar recibo -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showReciboModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="showReciboModal = false" />
          <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <p class="font-semibold text-slate-800 text-sm">{{ editingRecibo ? 'Editar factura' : 'Nueva factura' }}</p>
              <button @click="showReciboModal = false" class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-5">
              <div class="flex flex-col gap-4">

                <div v-if="reciboFormError" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-3 py-2.5">
                  <AlertCircle class="w-4 h-4 shrink-0" /> {{ reciboFormError }}
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1.5">Nombre <span class="text-danger">*</span></label>
                  <input v-model="reciboForm.nombre" type="text" placeholder="Ej: Factura EPM" :class="inputClass" />
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1.5">Empresa de servicio <span class="text-danger">*</span></label>
                  <select v-model="reciboForm.idEmpresaServicio" :class="inputClass">
                    <option value="">Seleccionar...</option>
                    <option v-for="e in empresas" :key="e.idEmpresaServicio" :value="String(e.idEmpresaServicio)">{{ e.nombre }}</option>
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1.5">Valor <span class="text-danger">*</span></label>
                    <input v-model="reciboForm.precio" type="text" inputmode="numeric" placeholder="150000" :class="inputClass" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1.5">Código / N° cuenta <span class="text-danger">*</span></label>
                    <input v-model="reciboForm.codigoRecibo" type="text" placeholder="Ej: 123456789" :class="inputClass" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1.5">Estado <span class="text-danger">*</span></label>
                  <select v-model="reciboForm.idEstadoRecibo" :class="inputClass">
                    <option value="">Seleccionar...</option>
                    <option v-for="e in estados.filter(e => e.idEstadoRecibo !== ESTADO_ELIMINADO)" :key="e.idEstadoRecibo" :value="String(e.idEstadoRecibo)">{{ e.nombre }}</option>
                  </select>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1.5">Pago oportuno</label>
                    <input v-model="reciboForm.fechaOportuna" type="date" :class="inputClass" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1.5">Fecha límite</label>
                    <input v-model="reciboForm.fechaMaxima" type="date" :class="inputClass" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1.5">Suspensión</label>
                    <input v-model="reciboForm.fechaSuspencion" type="date" :class="inputClass" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1.5">Observación</label>
                  <textarea v-model="reciboForm.observacion" rows="2" placeholder="Opcional" :class="inputClass + ' resize-none'" />
                </div>

              </div>
            </div>

            <div class="shrink-0 border-t border-slate-100 px-6 py-4 flex gap-3">
              <button
                type="button"
                @click="showReciboModal = false"
                class="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >Cancelar</button>
              <button
                type="button"
                @click="submitRecibo"
                :disabled="savingRecibo"
                class="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50"
              >
                <span v-if="savingRecibo">Guardando...</span>
                <span v-else>{{ editingRecibo ? 'Guardar cambios' : 'Crear factura' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-active .relative { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from .relative { transform: scale(0.95); opacity: 0; }
</style>
