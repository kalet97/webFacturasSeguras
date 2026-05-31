<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Search, FileText, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, Eye, X, Phone, Mail, MapPin, CreditCard,
  Building2, Calendar, Hash, MessageCircle,
} from 'lucide-vue-next'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

const adminAuth = useAdminAuthStore()

// --- Tipos ---
interface Empresa { idEmpresaServicio: number; nombre: string; color: string | null }
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

// --- Estado lista ---
const recibos      = ref<Recibo[]>([])
const loading      = ref(false)
const error        = ref('')
const search       = ref('')
const estadoFiltro = ref('')
const currentPage  = ref(1)
const lastPage     = ref(1)
const total        = ref(0)
const estados      = ref<Estado[]>([])

// --- Panel detalle ---
const selected  = ref<Recibo | null>(null)
const showPanel = ref(false)

function openDetail(r: Recibo) {
  selected.value = r
  showPanel.value = true
}
function closePanel() { showPanel.value = false }

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
    recibos.value = data.data
    lastPage.value = data.last_page
    total.value    = data.total
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar los recibos'
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchEstados(); fetchRecibos() })
watch([search, estadoFiltro], () => { currentPage.value = 1; fetchRecibos() })
watch(currentPage, fetchRecibos)

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

function statusClass(r: Recibo) {
  const nombre = (r.estado_recibo?.nombre ?? '').toLowerCase()
  if (['pagado', 'pago', 'paid', 'cancelado'].some(p => nombre.includes(p))) return 'bg-success-50 text-success-600'
  const days = daysLeft(r.fechaMaxima)
  if (days === null) return 'bg-slate-100 text-slate-500'
  if (days < 0)      return 'bg-danger-50 text-danger'
  if (days <= 5)     return 'bg-warning-50 text-warning-600'
  return 'bg-slate-100 text-slate-500'
}

function statusLabel(r: Recibo) {
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
  <div class="p-6 lg:p-8 max-w-7xl mx-auto">

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
                <th class="text-left px-5 py-3.5">Estado</th>
                <th class="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="recibo in recibos"
                :key="recibo.idRecibo"
                class="hover:bg-slate-50 transition-colors"
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

                <td class="px-5 py-3.5">
                  <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap', statusClass(recibo)]">
                    {{ statusLabel(recibo) }}
                  </span>
                </td>

                <td class="px-5 py-3.5 text-right">
                  <button
                    @click="openDetail(recibo)"
                    class="text-slate-400 hover:text-primary-600 transition p-1.5 rounded-lg hover:bg-primary-50"
                    title="Ver detalle"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="lastPage > 1" class="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p class="text-xs text-slate-500">Página {{ currentPage }} de {{ lastPage }}</p>
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
          <div v-if="selected.cliente" class="shrink-0 border-t border-slate-100 px-6 py-4 flex gap-2">
            <a
              :href="`tel:${selected.cliente.telefonoPrincipal}`"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition"
            >
              <Phone class="w-4 h-4" /> Llamar
            </a>
            <a
              v-if="selected.cliente.whatsapp"
              :href="`https://wa.me/57${selected.cliente.whatsapp}`"
              target="_blank"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-success-600 hover:bg-success-700 text-white text-sm font-medium rounded-xl transition"
            >
              <MessageCircle class="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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
</style>
