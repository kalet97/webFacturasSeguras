<script setup lang="ts">
import { MessageSquare, Phone, MapPin, CreditCard } from 'lucide-vue-next'
import type { Notification } from '@/stores/recibos'

interface Props {
  items: Notification[]
}

defineProps<Props>()

const iconMap = {
  sms: { icon: MessageSquare, bg: 'bg-primary-50', color: 'text-primary-600' },
  call: { icon: Phone, bg: 'bg-success-50', color: 'text-success' },
  visit: { icon: MapPin, bg: 'bg-warning-50', color: 'text-warning-600' },
  payment: { icon: CreditCard, bg: 'bg-success-50', color: 'text-success' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="relative">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="flex gap-3 relative"
      :class="{ 'pb-4': index < items.length - 1 }"
    >
      <div class="flex flex-col items-center shrink-0">
        <div :class="['w-9 h-9 rounded-xl flex items-center justify-center', iconMap[item.type].bg]">
          <component :is="iconMap[item.type].icon" :class="['w-4 h-4', iconMap[item.type].color]" />
        </div>
        <div v-if="index < items.length - 1" class="w-px flex-1 bg-slate-100 mt-1" />
      </div>

      <div class="flex-1 pb-1">
        <p class="text-sm font-medium text-slate-700">{{ item.description }}</p>
        <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(item.date) }}</p>
      </div>
    </div>

    <div v-if="items.length === 0" class="text-center py-6">
      <p class="text-sm text-slate-400">Sin actividad registrada</p>
    </div>
  </div>
</template>
