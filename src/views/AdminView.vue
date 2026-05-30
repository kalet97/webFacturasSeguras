<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users, CreditCard, MapPin, TrendingUp, Clock,
  CheckCircle, AlertCircle, Search, Filter, ChevronLeft,
  BarChart2, Calendar
} from 'lucide-vue-next'
import { useRecibosStore } from '@/stores/recibos'
import PaymentStatus from '@/components/PaymentStatus.vue'

const router = useRouter()
const store = useRecibosStore()

type AdminTab = 'dashboard' | 'users' | 'payments' | 'visits' | 'calendar'
const activeTab = ref<AdminTab>('dashboard')

const searchQuery = ref('')
const filterStatus = ref('all')

const metrics = [
  { label: 'Usuarios activos', value: '124', icon: Users, bg: 'bg-primary-50', color: 'text-primary-600', trend: '+12%' },
  { label: 'Pagos este mes', value: '89', icon: CreditCard, bg: 'bg-success-50', color: 'text-success', trend: '+8%' },
  { label: 'Visitas pendientes', value: '7', icon: MapPin, bg: 'bg-warning-50', color: 'text-warning-600', trend: '-3%' },
  { label: 'Recibos vencidos', value: '15', icon: AlertCircle, bg: 'bg-danger-50', color: 'text-danger', trend: '+2%' },
]

const mockUsers = [
  { id: '1', name: 'María García', phone: '3109876543', recibos: 4, overdue: 1, status: 'active' },
  { id: '2', name: 'Carlos Rodríguez', phone: '3201234567', recibos: 2, overdue: 0, status: 'active' },
  { id: '3', name: 'Ana Martínez', phone: '3154567890', recibos: 6, overdue: 2, status: 'active' },
  { id: '4', name: 'Luis Pérez', phone: '3005678901', recibos: 3, overdue: 0, status: 'inactive' },
  { id: '5', name: 'Sandra López', phone: '3112345678', recibos: 5, overdue: 1, status: 'active' },
]

const mockPayments = [
  { id: 'p1', user: 'María García', service: 'Claro - Internet', amount: 89000, commission: 4500, date: '2026-05-28', status: 'completed' },
  { id: 'p2', user: 'Carlos Rodríguez', service: 'EPM - Energía', amount: 142000, commission: 7100, date: '2026-05-27', status: 'pending' },
  { id: 'p3', user: 'Ana Martínez', service: 'Acueducto - Agua', amount: 65000, commission: 3250, date: '2026-05-26', status: 'completed' },
  { id: 'p4', user: 'Sandra López', service: 'Gas Natural', amount: 42000, commission: 2100, date: '2026-05-25', status: 'processing' },
]

const mockVisits = [
  { id: 'v1', user: 'María García', address: 'Carrera 7 #45-12, Bogotá', service: 'Gas Natural', date: '2026-05-30', time: '09:00', status: 'scheduled' },
  { id: 'v2', user: 'Ana Martínez', address: 'Calle 100 #20-15, Bogotá', service: 'EPM - Energía', date: '2026-05-30', time: '14:00', status: 'scheduled' },
  { id: 'v3', user: 'Luis Pérez', address: 'Av. El Dorado #68C-61', service: 'Acueducto', date: '2026-05-31', time: '10:30', status: 'pending' },
]

const calendarDays = computed(() => {
  const days = []
  for (let d = 1; d <= 30; d++) {
    const hasEvent = [4, 5, 8, 15, 20, 22, 28, 30].includes(d)
    const isToday = d === 30
    const isOverdue = [1, 2, 3].includes(d)
    days.push({ day: d, hasEvent, isToday, isOverdue })
  }
  return days
})

const filteredUsers = computed(() =>
  mockUsers.filter(u =>
    (u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
     u.phone.includes(searchQuery.value)) &&
    (filterStatus.value === 'all' || u.status === filterStatus.value)
  )
)

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

const tabs: { key: AdminTab; label: string; icon: typeof Users }[] = [
  { key: 'dashboard', label: 'Métricas', icon: BarChart2 },
  { key: 'users', label: 'Usuarios', icon: Users },
  { key: 'payments', label: 'Pagos', icon: CreditCard },
  { key: 'visits', label: 'Visitas', icon: MapPin },
  { key: 'calendar', label: 'Calendario', icon: Calendar },
]

const paymentStatusClasses: Record<string, string> = {
  completed: 'bg-success-50 text-success',
  pending: 'bg-warning-50 text-warning-600',
  processing: 'bg-primary-50 text-primary-600',
}

const visitStatusClasses: Record<string, string> = {
  scheduled: 'bg-primary-50 text-primary-600',
  pending: 'bg-warning-50 text-warning-600',
  completed: 'bg-success-50 text-success',
}
</script>

<template>
  <div class="screen">
    <div class="bg-slate-900 pt-12 pb-4 px-5">
      <div class="flex items-center gap-3 mb-4">
        <button @click="router.back()" class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <ChevronLeft class="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 class="text-white font-bold text-xl">Panel Admin</h1>
          <p class="text-slate-400 text-xs">Recibo Seguro · Gestión</p>
        </div>
      </div>

      <div class="overflow-x-auto scrollbar-hide -mx-5 px-5">
        <div class="flex gap-2 w-max pb-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-white/10',
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 pb-8 pt-4">

      <div v-if="activeTab === 'dashboard'">
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div v-for="m in metrics" :key="m.label" class="card">
            <div class="flex items-center justify-between mb-3">
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center', m.bg]">
                <component :is="m.icon" :class="['w-5 h-5', m.color]" />
              </div>
              <span :class="['text-xs font-medium', m.trend.startsWith('+') ? 'text-success' : 'text-danger']">
                {{ m.trend }}
              </span>
            </div>
            <p class="text-2xl font-black text-slate-800">{{ m.value }}</p>
            <p class="text-xs text-slate-500 mt-0.5">{{ m.label }}</p>
          </div>
        </div>

        <div class="card mb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-800">Actividad reciente</h3>
            <TrendingUp class="w-4 h-4 text-success" />
          </div>
          <div class="space-y-3">
            <div v-for="item in store.history.slice(0, 4)" :key="item.id" class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full shrink-0" :class="{
                'bg-success': item.type === 'payment',
                'bg-primary-600': item.type === 'call' || item.type === 'reminder',
                'bg-warning': item.type === 'visit',
              }" />
              <div class="flex-1">
                <p class="text-xs text-slate-700 font-medium">{{ item.description }}</p>
                <p class="text-xs text-slate-400">{{ item.reciboName }}</p>
              </div>
              <span class="text-xs text-slate-400">{{ new Date(item.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-bold text-slate-800 mb-3">Resumen de recibos</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-danger/15 rounded-full h-2">
                <div class="bg-danger h-2 rounded-full" style="width: 20%" />
              </div>
              <span class="text-xs text-slate-500 w-20 text-right">Vencidos (20%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-warning/15 rounded-full h-2">
                <div class="bg-warning h-2 rounded-full" style="width: 30%" />
              </div>
              <span class="text-xs text-slate-500 w-20 text-right">Próximos (30%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-success/15 rounded-full h-2">
                <div class="bg-success h-2 rounded-full" style="width: 50%" />
              </div>
              <span class="text-xs text-slate-500 w-20 text-right">Pagados (50%)</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'users'">
        <div class="flex gap-2 mb-4">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input v-model="searchQuery" type="text" placeholder="Buscar usuario..." class="input-field pl-9 py-2.5 text-sm" />
          </div>
          <div class="relative">
            <select v-model="filterStatus" class="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <Filter class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <p class="text-xs text-slate-500 mb-3">{{ filteredUsers.length }} usuario{{ filteredUsers.length !== 1 ? 's' : '' }}</p>

        <div class="space-y-3">
          <div v-for="user in filteredUsers" :key="user.id" class="card">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <span class="text-primary-700 font-bold text-sm">
                  {{ user.name.split(' ').map((n: string) => n[0]).slice(0,2).join('') }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-semibold text-slate-800 text-sm truncate">{{ user.name }}</p>
                  <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', user.status === 'active' ? 'bg-success-50 text-success' : 'bg-slate-100 text-slate-500']">
                    {{ user.status === 'active' ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">{{ user.phone }}</p>
                <div class="flex gap-3 mt-1.5">
                  <span class="text-xs text-slate-600">{{ user.recibos }} recibos</span>
                  <span v-if="user.overdue > 0" class="text-xs text-danger font-medium">{{ user.overdue }} vencido{{ user.overdue !== 1 ? 's' : '' }}</span>
                  <span v-else class="text-xs text-success font-medium">Al día ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'payments'">
        <div class="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
          <button
            v-for="s in ['Todos', 'Completados', 'Pendientes', 'En proceso']"
            :key="s"
            class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 whitespace-nowrap"
          >{{ s }}</button>
        </div>

        <div class="space-y-3">
          <div v-for="p in mockPayments" :key="p.id" class="card">
            <div class="flex items-start justify-between mb-2">
              <div>
                <p class="font-semibold text-slate-800 text-sm">{{ p.user }}</p>
                <p class="text-xs text-slate-500">{{ p.service }}</p>
              </div>
              <span :class="['text-xs font-medium px-2 py-1 rounded-lg', paymentStatusClasses[p.status]]">
                {{ p.status === 'completed' ? 'Completado' : p.status === 'pending' ? 'Pendiente' : 'En proceso' }}
              </span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-50">
              <div>
                <p class="text-xs text-slate-400">Recibo + Comisión</p>
                <p class="text-sm font-bold text-slate-800">{{ formatCurrency(p.amount) }} <span class="text-xs font-normal text-slate-500">+ {{ formatCurrency(p.commission) }}</span></p>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-400">Total</p>
                <p class="text-sm font-bold text-primary-600">{{ formatCurrency(p.amount + p.commission) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'visits'">
        <div class="space-y-3">
          <div v-for="v in mockVisits" :key="v.id" class="card">
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-semibold text-slate-800 text-sm">{{ v.user }}</p>
                  <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', visitStatusClasses[v.status]]">
                    {{ v.status === 'scheduled' ? 'Programada' : v.status === 'pending' ? 'Pendiente' : 'Completada' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">{{ v.service }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <MapPin class="w-3.5 h-3.5 shrink-0" />
              <p class="truncate">{{ v.address }}</p>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
              <div class="flex items-center gap-1.5 text-xs text-primary-600 font-medium">
                <Clock class="w-3.5 h-3.5" />
                {{ new Date(v.date + 'T00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) }} · {{ v.time }}
              </div>
              <div class="flex gap-2">
                <button class="text-xs bg-success-50 text-success font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <CheckCircle class="w-3 h-3" /> Completar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'calendar'">
        <div class="card mb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-800">Junio 2026</h3>
            <div class="flex gap-1">
              <button class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">‹</button>
              <button class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">›</button>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1 mb-2">
            <p v-for="d in ['D','L','M','X','J','V','S']" :key="d" class="text-center text-xs font-medium text-slate-400 py-1">{{ d }}</p>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <div v-for="day in calendarDays" :key="day.day" class="aspect-square">
              <button
                :class="[
                  'w-full h-full rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-colors relative',
                  day.isToday ? 'bg-primary-600 text-white' :
                  day.isOverdue ? 'bg-danger-50 text-danger' :
                  day.hasEvent ? 'bg-warning-50 text-warning-600' :
                  'text-slate-600 hover:bg-slate-50',
                ]"
              >
                {{ day.day }}
                <span v-if="day.hasEvent && !day.isToday" class="absolute bottom-1 w-1 h-1 bg-warning rounded-full" />
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="font-bold text-slate-800 mb-3">Vencimientos próximos</h3>
          <div class="space-y-2">
            <div v-for="r in store.recibos.filter(r => r.status !== 'paid').slice(0, 4)" :key="r.id"
              class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <span class="text-lg">{{ store.serviceIcons[r.serviceType] }}</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-700">{{ r.company }}</p>
                <p class="text-xs text-slate-400">{{ new Date(r.dueDate + 'T00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) }}</p>
              </div>
              <PaymentStatus :status="r.status" size="sm" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
