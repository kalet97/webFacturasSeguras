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
  overdue:    'text-danger',
  soon:       'text-warning-600',
  pending:    'text-slate-500',
  paid:       'text-success',
  processing: 'text-violet-600',
  reviewing:  'text-amber-600',
}
</script>

<template>
  <button
    @click="router.push(`/recibos/${props.recibo.id}`)"
    :class="[
      'card w-full text-left hover:shadow-card-hover transition-shadow duration-200 active:scale-[0.99] overflow-hidden',
      props.recibo.status === 'processing' ? 'ring-2 ring-violet-300' : '',
      props.recibo.status === 'reviewing'  ? 'ring-2 ring-amber-300'  : '',
    ]"
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
            {{ props.recibo.status === 'paid'       ? 'Pagado ✓'
             : props.recibo.status === 'processing' ? 'Procesando pago...'
             : props.recibo.status === 'reviewing'  ? 'En revisión...'
             : daysLabel(props.recibo.daysLeft) }}
          </p>
        </div>
        <p v-if="props.recibo.surcharge" class="text-xs text-warning-600 mt-0.5">
          + {{ formatCurrency(props.recibo.surcharge) }} cargo 4x1000
        </p>
      </div>

      <ChevronRight class="w-4 h-4 text-slate-300 shrink-0" />
    </div>

    <!-- Banner informativo para estado processing -->
    <div
      v-if="props.recibo.status === 'processing'"
      class="mt-3 -mx-4 -mb-4 px-4 py-2.5 bg-violet-50 border-t border-violet-100 flex items-center gap-2"
    >
      <span class="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
      <p class="text-xs text-violet-700 font-medium">Tu pago fue recibido · Estamos pagando tu factura</p>
    </div>

    <!-- Banner informativo para estado reviewing -->
    <div
      v-if="props.recibo.status === 'reviewing'"
      class="mt-3 -mx-4 -mb-4 px-4 py-2.5 bg-amber-50 border-t border-amber-100 flex items-center gap-2"
    >
      <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
      <p class="text-xs text-amber-700 font-medium">Marcaste este recibo como pagado · Estamos verificando tu pago</p>
    </div>
  </button>
</template>
