<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Inbox } from 'lucide-vue-next'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'
import NotificacionAdminModal, { type NotificacionAdmin } from '@/components/admin/NotificacionAdminModal.vue'

const router    = useRouter()
const adminAuth = useAdminAuthStore()

const open          = ref(false)
const loading       = ref(false)
const notificaciones = ref<NotificacionAdmin[]>([])
const unreadCount   = ref(0)

const selected      = ref<NotificacionAdmin | null>(null)
const showDetail    = ref(false)

interface Paginated<T> { data: T[]; total: number }

async function fetchUnreadCount() {
  try {
    const res = await api.get<Paginated<NotificacionAdmin>>('/notificaciones-admin?leida=0', adminAuth.token)
    unreadCount.value = res.total
  } catch {}
}

async function fetchNotificaciones() {
  loading.value = true
  try {
    const res = await api.get<Paginated<NotificacionAdmin>>('/notificaciones-admin', adminAuth.token)
    notificaciones.value = res.data.slice(0, 8)
  } catch {} finally {
    loading.value = false
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) fetchNotificaciones()
}

function close() {
  open.value = false
}

async function openDetail(n: NotificacionAdmin) {
  selected.value   = n
  showDetail.value = true

  if (!n.leida) {
    try {
      await api.put(`/notificaciones-admin/${n.idNotificacionAdmin}`, { leida: true }, adminAuth.token)
      n.leida = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {}
  }
}

function closeDetail() {
  showDetail.value = false
  selected.value   = null
}

function verTodas() {
  close()
  router.push('/admin/notificaciones-admin')
}

function timeAgo(fecha: string) {
  const diffMs = Date.now() - new Date(fecha.replace(' ', 'T')).getTime()
  const mins   = Math.floor(diffMs / 60_000)
  if (mins < 1)   return 'Ahora'
  if (mins < 60)  return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} d`
}

let pollInterval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  fetchUnreadCount()
  pollInterval = setInterval(fetchUnreadCount, 60_000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <div class="relative">
    <button
      @click="toggle"
      class="relative text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition rounded-lg p-2"
      title="Notificaciones"
    >
      <Bell class="w-5 h-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold leading-none"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Overlay para cerrar al hacer click afuera -->
    <div v-if="open" class="fixed inset-0 z-40" @click="close" />

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p class="font-semibold text-slate-800 text-sm">Notificaciones</p>
          <span v-if="unreadCount > 0" class="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            {{ unreadCount }} sin leer
          </span>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <div v-if="loading" class="flex items-center justify-center py-10">
            <div class="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>

          <div v-else-if="notificaciones.length === 0" class="flex flex-col items-center justify-center py-10 text-slate-400">
            <Inbox class="w-8 h-8 mb-2 opacity-30" />
            <p class="text-sm">Sin notificaciones</p>
          </div>

          <button
            v-for="n in notificaciones"
            :key="n.idNotificacionAdmin"
            @click="openDetail(n)"
            :class="[
              'w-full text-left flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition',
              !n.leida ? 'bg-primary-50/40' : '',
            ]"
          >
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
              :style="{ backgroundColor: (n.tipo?.color ?? '#94a3b8') + '20' }"
            >
              {{ n.tipo?.icono ?? '🔔' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <p :class="['text-sm truncate', !n.leida ? 'font-semibold text-slate-800' : 'font-medium text-slate-600']">
                  {{ n.titulo }}
                </p>
                <span v-if="!n.leida" class="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
              </div>
              <p v-if="n.mensaje" class="text-xs text-slate-400 truncate mt-0.5">{{ n.mensaje }}</p>
              <p class="text-[11px] text-slate-300 mt-1">{{ timeAgo(n.fechaNotificacion) }}</p>
            </div>
          </button>
        </div>

        <button
          @click="verTodas"
          class="w-full text-center text-sm font-medium text-primary-600 hover:bg-primary-50 transition px-4 py-2.5 border-t border-slate-100"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </Transition>

    <NotificacionAdminModal :open="showDetail" :notificacion="selected" @close="closeDetail" />
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
