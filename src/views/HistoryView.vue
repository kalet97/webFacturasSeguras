<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Phone, MessageSquare, CreditCard, MapPin } from 'lucide-vue-next'
import { useRecibosStore, type HistoryItem } from '@/stores/recibos'
import AppHeader from '@/components/AppHeader.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'

const store = useRecibosStore()

onMounted(() => store.fetchHistory())

type TabKey = 'all' | 'call' | 'reminder' | 'payment' | 'visit'

const activeTab = ref<TabKey>('all')

const tabs: { key: TabKey; label: string; icon: typeof Phone }[] = [
  { key: 'all', label: 'Todo', icon: MessageSquare },
  { key: 'call', label: 'Llamadas', icon: Phone },
  { key: 'reminder', label: 'Recordatorios', icon: MessageSquare },
  { key: 'payment', label: 'Pagos', icon: CreditCard },
  { key: 'visit', label: 'Visitas', icon: MapPin },
]

const filtered = computed<HistoryItem[]>(() =>
  activeTab.value === 'all'
    ? store.history
    : store.history.filter(i => i.type === activeTab.value)
)

const iconMap = {
  call: { icon: Phone, bg: 'bg-success-50', color: 'text-success' },
  reminder: { icon: MessageSquare, bg: 'bg-primary-50', color: 'text-primary-600' },
  payment: { icon: CreditCard, bg: 'bg-warning-50', color: 'text-warning-600' },
  visit: { icon: MapPin, bg: 'bg-purple-50', color: 'text-purple-600' },
}

const typeLabel = {
  call: 'Llamada',
  reminder: 'Recordatorio',
  payment: 'Pago',
  visit: 'Visita',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}
</script>

<template>
  <div class="screen pb-24">
    <AppHeader title="Historial" :show-back="false" :show-notification="true" />

    <div class="overflow-x-auto scrollbar-hide px-4 py-3">
      <div class="flex gap-2 w-max">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap',
            activeTab === tab.key
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 pb-4">
      <div v-if="store.loadingHistory" class="flex justify-center mt-12">
        <div class="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>

      <div v-else-if="filtered.length === 0" class="card mt-4 text-center py-12">
        <p class="text-3xl mb-3">📋</p>
        <p class="font-semibold text-slate-700">Sin registros</p>
        <p class="text-sm text-slate-500 mt-1">No hay actividad en esta categoría</p>
      </div>

      <div v-if="!store.loadingHistory" class="space-y-3 mt-1">
        <div
          v-for="item in filtered"
          :key="item.id"
          class="card flex items-center gap-3"
        >
          <div :class="['w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconMap[item.type].bg]">
            <component :is="iconMap[item.type].icon" :class="['w-5 h-5', iconMap[item.type].color]" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ item.reciboName }}</p>
              <span
                v-if="item.amount"
                class="text-sm font-bold text-success shrink-0"
              >{{ formatCurrency(item.amount) }}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">{{ item.description }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(item.date) }}</p>
          </div>

          <span
            :class="[
              'shrink-0 text-xs font-medium px-2 py-1 rounded-lg',
              iconMap[item.type].bg,
              iconMap[item.type].color,
            ]"
          >
            {{ typeLabel[item.type] }}
          </span>
        </div>
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
