<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RefreshCw, AlertCircle, Inbox, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'
import NotificacionAdminModal, {
  type NotificacionAdmin,
  type TipoNotificacionAdmin,
} from '@/components/admin/NotificacionAdminModal.vue'

interface Paginator { data: NotificacionAdmin[]; current_page: number; last_page: number; total: number }

const adminAuth = useAdminAuthStore()

const items       = ref<NotificacionAdmin[]>([])
const tipos       = ref<TipoNotificacionAdmin[]>([])
const loading     = ref(false)
const error       = ref('')
const currentPage = ref(1)
const lastPage    = ref(1)
const total       = ref(0)

const filterLeida = ref<'' | '0' | '1'>('')
const filterTipo  = ref('')

const selected   = ref<NotificacionAdmin | null>(null)
const showDetail = ref(false)

async function fetchTipos() {
  try {
    tipos.value = await api.get<TipoNotificacionAdmin[]>('/tipos-notificaciones-admin', adminAuth.token)
  } catch {}
}

async function fetchAll() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(currentPage.value) })
    if (filterLeida.value !== '') params.set('leida', filterLeida.value)
    if (filterTipo.value)         params.set('tipo', filterTipo.value)
    const data = await api.get<Paginator>(`/notificaciones-admin?${params}`, adminAuth.token)
    items.value      = data.data
    lastPage.value   = data.last_page
    total.value      = data.total
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar'
  } finally {
    loading.value = false
  }
}

watch([filterLeida, filterTipo], () => { currentPage.value = 1; fetchAll() })
watch(currentPage, fetchAll)

onMounted(() => {
  fetchTipos()
  fetchAll()
})

async function openDetail(n: NotificacionAdmin) {
  selected.value   = n
  showDetail.value = true

  if (!n.leida) {
    try {
      await api.put(`/notificaciones-admin/${n.idNotificacionAdmin}`, { leida: true }, adminAuth.token)
      n.leida = 1
    } catch {}
  }
}

function closeDetail() {
  showDetail.value = false
  selected.value   = null
}

function formatFecha(fecha: string) {
  return new Date(fecha.replace(' ', 'T')).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const pages = computed(() => {
  const p: number[] = []
  for (let i = Math.max(1, currentPage.value - 2); i <= Math.min(lastPage.value, currentPage.value + 2); i++) p.push(i)
  return p
})

const selectClass = 'px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white'
</script>

<template>
  <div class="p-6 lg:p-8 max-w-4xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold text-slate-800">Notificaciones</h2>
        <p class="text-slate-500 text-sm mt-0.5">{{ total }} registros</p>
      </div>
      <button @click="fetchAll" class="p-2 text-slate-500 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition self-start sm:self-auto">
        <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
      </button>
    </div>

    <div class="flex flex-wrap gap-3 mb-5">
      <select v-model="filterLeida" :class="selectClass">
        <option value="">Todas</option>
        <option value="0">Sin leer</option>
        <option value="1">Leídas</option>
      </select>
      <select v-model="filterTipo" :class="selectClass">
        <option value="">Todos los tipos</option>
        <option v-for="t in tipos" :key="t.idTipoNotificacionAdmin" :value="t.clave">
          {{ t.icono ? t.icono + ' ' : '' }}{{ t.nombre }}
        </option>
      </select>
    </div>

    <div v-if="error" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-4 py-3 mb-4">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ error }}
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
      <template v-else>
        <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400">
          <Inbox class="w-9 h-9 mb-2 opacity-30" />
          <p class="text-sm">Sin notificaciones</p>
        </div>

        <button
          v-for="n in items"
          :key="n.idNotificacionAdmin"
          @click="openDetail(n)"
          :class="[
            'w-full text-left flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition',
            !n.leida ? 'bg-primary-50/40' : '',
          ]"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            :style="{ backgroundColor: (n.tipo?.color ?? '#94a3b8') + '20' }"
          >
            {{ n.tipo?.icono ?? '🔔' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p :class="['text-sm truncate', !n.leida ? 'font-semibold text-slate-800' : 'font-medium text-slate-600']">
                {{ n.titulo }}
              </p>
              <span v-if="!n.leida" class="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
            </div>
            <p v-if="n.mensaje" class="text-sm text-slate-500 truncate mt-0.5">{{ n.mensaje }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ formatFecha(n.fechaNotificacion) }} · {{ n.tipo?.nombre ?? 'Notificación' }}</p>
          </div>
        </button>

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

    <NotificacionAdminModal :open="showDetail" :notificacion="selected" @close="closeDetail" />
  </div>
</template>
