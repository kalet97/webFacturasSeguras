<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, CreditCard, Bell, TrendingDown } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useRecibosStore } from '@/stores/recibos'
import ReciboCard from '@/components/ReciboCard.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'

const router = useRouter()
const auth = useAuthStore()
const store = useRecibosStore()

onMounted(() => store.fetchRecibos())

const total = computed(() => store.recibos.length)
const overdue = computed(() => store.recibos.filter(r => r.status === 'overdue').length)
const soon = computed(() => store.recibos.filter(r => r.status === 'soon').length)
const paid = computed(() => store.recibos.filter(r => r.status === 'paid').length)

const totalPending = computed(() =>
  store.recibos
    .filter(r => r.status !== 'paid' && r.amount)
    .reduce((s, r) => s + (r.amount ?? 0), 0)
)

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const sortedRecibos = computed(() => {
  const order = { overdue: 0, soon: 1, pending: 2, paid: 3 }
  return [...store.recibos].sort((a, b) => order[a.status] - order[b.status])
})
</script>

<template>
  <div class="screen pb-24">
    <div class="bg-primary-600 pt-12 pb-6 px-5">
      <div class="flex items-start justify-between mb-5">
        <div>
          <p class="text-primary-100 text-sm">{{ greeting() }}</p>
          <h2 class="text-white font-bold text-xl mt-0.5">{{ auth.user?.name?.split(' ')[0] }}</h2>
        </div>
        <button class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center relative">
          <Bell class="w-5 h-5 text-white" />
          <span v-if="overdue > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-primary-600" />
        </button>
      </div>

      <div class="bg-white/15 rounded-2xl p-4">
        <p class="text-primary-100 text-xs font-medium mb-1">Total por pagar</p>
        <p class="text-white text-2xl font-black">{{ formatCurrency(totalPending) }}</p>
        <div class="flex gap-3 mt-3">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 bg-danger rounded-full" />
            <span class="text-white/80 text-xs">{{ overdue }} vencido{{ overdue !== 1 ? 's' : '' }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 bg-warning rounded-full" />
            <span class="text-white/80 text-xs">{{ soon }} próximo{{ soon !== 1 ? 's' : '' }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 bg-success rounded-full" />
            <span class="text-white/80 text-xs">{{ paid }} pagado{{ paid !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-3">
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="card text-center">
          <p class="text-2xl font-black text-slate-800">{{ total }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Recibos</p>
        </div>
        <div class="card text-center">
          <p class="text-2xl font-black" :class="overdue > 0 ? 'text-danger' : 'text-slate-800'">{{ overdue }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Vencidos</p>
        </div>
        <div class="card text-center">
          <p class="text-2xl font-black text-success">{{ paid }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Pagados</p>
        </div>
      </div>

      <div v-if="overdue > 0" class="mb-4 bg-danger-50 border border-danger/20 rounded-2xl p-3.5 flex items-center gap-3">
        <div class="w-9 h-9 bg-danger/10 rounded-xl flex items-center justify-center shrink-0">
          <TrendingDown class="w-5 h-5 text-danger" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-danger">{{ overdue }} recibo{{ overdue !== 1 ? 's' : '' }} vencido{{ overdue !== 1 ? 's' : '' }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Gestiona tu pago ahora</p>
        </div>
      </div>

      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-800">Mis recibos</h3>
        <button
          @click="router.push('/recibos/add')"
          class="flex items-center gap-1.5 text-primary-600 text-sm font-medium"
        >
          <Plus class="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div class="flex flex-col gap-3 mb-4">
        <ReciboCard v-for="r in sortedRecibos" :key="r.id" :recibo="r" />
      </div>

      <div v-if="store.recibos.length === 0" class="card text-center py-10">
        <p class="text-4xl mb-3">📄</p>
        <p class="font-semibold text-slate-700">Sin recibos registrados</p>
        <p class="text-sm text-slate-500 mt-1">Agrega tu primer recibo para empezar</p>
      </div>
    </div>

    <div class="fixed bottom-20 right-4 z-40">
      <button
        @click="router.push('/recibos/add')"
        class="w-14 h-14 bg-primary-600 rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus class="w-7 h-7 text-white" stroke-width="2.5" />
      </button>
    </div>

    <BottomTabBar />
  </div>
</template>
