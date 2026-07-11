<script setup lang="ts">
import { onMounted } from 'vue'
import { ArrowUpFromLine, Clock } from 'lucide-vue-next'
import { useRecibosStore } from '@/stores/recibos'
import AppHeader from '@/components/AppHeader.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'

const store = useRecibosStore()

onMounted(() => store.fetchHistory())

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

    <div class="flex-1 overflow-y-auto px-4 pb-4 pt-3">
      <div v-if="store.loadingHistory" class="flex justify-center mt-12">
        <div class="w-7 h-7 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>

      <div v-else-if="store.history.length === 0" class="card mt-4 text-center py-12">
        <p class="text-3xl mb-3">🧾</p>
        <p class="font-semibold text-slate-700">Sin pagos registrados</p>
        <p class="text-sm text-slate-500 mt-1">Aquí verás el historial de pagos de tus facturas</p>
      </div>

      <div v-if="!store.loadingHistory && store.history.length > 0" class="card">
        <div class="flex flex-col gap-4">
          <div
            v-for="(item, i) in store.history"
            :key="item.id"
            class="flex gap-3 relative"
          >
            <div class="flex flex-col items-center shrink-0">
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.pagado ? 'bg-success-50' : 'bg-violet-50']">
                <component :is="item.pagado ? ArrowUpFromLine : Clock" :class="['w-4 h-4', item.pagado ? 'text-success' : 'text-violet-500']" />
              </div>
              <div v-if="i < store.history.length - 1" class="w-px flex-1 bg-slate-100 mt-1 min-h-[16px]" />
            </div>

            <div class="flex-1 pb-1">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-slate-800 truncate">{{ item.reciboName }}</p>
                <span :class="['shrink-0 text-xs font-medium px-2 py-0.5 rounded-full', item.pagado ? 'bg-success-50 text-success-600' : 'bg-violet-50 text-violet-600']">
                  {{ item.pagado ? 'Completado' : 'En trámite' }}
                </span>
              </div>

              <div class="mt-1.5 bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-400">Valor recibo</span>
                  <span class="font-medium text-slate-700">{{ formatCurrency(item.valorRecibo) }}</span>
                </div>
                <template v-if="item.comision">
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-400">Comisión</span>
                    <span class="font-medium text-slate-700">{{ formatCurrency(item.comision) }}</span>
                  </div>
                  <div class="flex justify-between text-xs border-t border-slate-100 pt-1">
                    <span class="text-slate-500 font-medium">Total</span>
                    <span class="font-bold text-slate-800">{{ formatCurrency(item.valorTotal) }}</span>
                  </div>
                </template>
              </div>

              <p v-if="item.date" class="text-xs text-slate-400 mt-1.5">{{ formatDate(item.date) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomTabBar />
  </div>
</template>
