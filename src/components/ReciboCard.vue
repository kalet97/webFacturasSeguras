<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import type { Recibo } from '@/stores/recibos'
import { useRecibosStore } from '@/stores/recibos'
import PaymentStatus from './PaymentStatus.vue'

interface Props {
  recibo: Recibo
}

const props = defineProps<Props>()
const router = useRouter()
const store = useRecibosStore()

function formatCurrency(value?: number) {
  if (!value) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

function daysLabel(days: number) {
  if (days < 0) return `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence mañana'
  return `${days} días restantes`
}

const daysColor: Record<string, string> = {
  overdue: 'text-danger',
  soon: 'text-warning-600',
  pending: 'text-slate-500',
  paid: 'text-success',
}
</script>

<template>
  <button
    @click="router.push(`/recibos/${props.recibo.id}`)"
    class="card w-full text-left hover:shadow-card-hover transition-shadow duration-200 active:scale-[0.99]"
  >
    <div class="flex items-center gap-3">
      <div
        :class="['w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0', store.serviceColors[props.recibo.serviceType]]"
      >
        {{ store.serviceIcons[props.recibo.serviceType] }}
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="font-semibold text-slate-800 text-sm truncate">{{ props.recibo.company }}</p>
          <PaymentStatus :status="props.recibo.status" size="sm" />
        </div>
        <p class="text-xs text-slate-500 mt-0.5">{{ store.serviceLabels[props.recibo.serviceType] }}</p>
        <div class="flex items-center justify-between mt-1.5">
          <p class="text-base font-bold text-slate-800">{{ formatCurrency(props.recibo.amount) }}</p>
          <p :class="['text-xs font-medium', daysColor[props.recibo.status]]">
            {{ props.recibo.status === 'paid' ? 'Pagado ✓' : daysLabel(props.recibo.daysLeft) }}
          </p>
        </div>
      </div>

      <ChevronRight class="w-4 h-4 text-slate-300 shrink-0" />
    </div>
  </button>
</template>
