<script setup lang="ts">
import { Users, FileText, Bell, CreditCard, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-vue-next'

const stats = [
  { label: 'Clientes activos',     value: '—', icon: Users,        color: 'bg-primary-50 text-primary-600' },
  { label: 'Recibos pendientes',   value: '—', icon: FileText,     color: 'bg-warning-50 text-warning-600' },
  { label: 'Notificaciones hoy',   value: '—', icon: Bell,         color: 'bg-purple-50 text-purple-600' },
  { label: 'Pagos del mes',        value: '—', icon: CreditCard,   color: 'bg-success-50 text-success-600' },
]

const quickLinks = [
  { label: 'Recibos por vencer',   icon: Clock,          to: '/admin/recibos',        color: 'text-warning-600',  desc: 'Próximos 5 días' },
  { label: 'Recibos vencidos',     icon: AlertTriangle,  to: '/admin/recibos',        color: 'text-danger',       desc: 'Requieren atención' },
  { label: 'Tareas pendientes',    icon: TrendingUp,     to: '/admin/tareas',         color: 'text-primary-600',  desc: 'Sin completar' },
  { label: 'Pagos confirmados',    icon: CheckCircle,    to: '/admin/pagos',          color: 'text-success-600',  desc: 'Este mes' },
]
</script>

<template>
  <div class="p-6 lg:p-8 max-w-7xl mx-auto">

    <!-- Bienvenida -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-800">Bienvenido de nuevo 👋</h2>
      <p class="text-slate-500 mt-1 text-sm">Aquí tienes un resumen del estado actual de la plataforma.</p>
    </div>

    <!-- Tarjetas de métricas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4"
      >
        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shrink-0', stat.color]">
          <component :is="stat.icon" class="w-5 h-5" />
        </div>
        <div>
          <p class="text-2xl font-bold text-slate-800">{{ stat.value }}</p>
          <p class="text-slate-500 text-sm">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <div class="mb-6">
      <h3 class="text-base font-semibold text-slate-700 mb-3">Accesos rápidos</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <RouterLink
          v-for="link in quickLinks"
          :key="link.label"
          :to="link.to"
          class="bg-white rounded-2xl border border-slate-200 p-5 hover:border-primary-300 hover:shadow-sm transition group"
        >
          <component :is="link.icon" :class="['w-6 h-6 mb-3', link.color]" />
          <p class="font-semibold text-slate-800 text-sm group-hover:text-primary-600 transition">{{ link.label }}</p>
          <p class="text-slate-400 text-xs mt-0.5">{{ link.desc }}</p>
        </RouterLink>
      </div>
    </div>

    <!-- Placeholder tabla reciente -->
    <div class="bg-white rounded-2xl border border-slate-200">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 class="font-semibold text-slate-800 text-sm">Actividad reciente</h3>
        <RouterLink to="/admin/notificaciones" class="text-xs text-primary-600 hover:underline font-medium">
          Ver todo
        </RouterLink>
      </div>
      <div class="flex flex-col items-center justify-center py-16 text-center text-slate-400">
        <Bell class="w-10 h-10 mb-3 opacity-30" />
        <p class="text-sm font-medium">Sin actividad reciente</p>
        <p class="text-xs mt-1">Las notificaciones y eventos aparecerán aquí</p>
      </div>
    </div>

  </div>
</template>
