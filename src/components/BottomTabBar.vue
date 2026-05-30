<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Home, Clock, User, LayoutDashboard } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const clientTabs = [
  { name: 'dashboard', path: '/dashboard', icon: Home, label: 'Inicio' },
  { name: 'history', path: '/history', icon: Clock, label: 'Historial' },
  { name: 'profile', path: '/profile', icon: User, label: 'Perfil' },
]

const adminTabs = [
  { name: 'admin', path: '/admin', icon: LayoutDashboard, label: 'Panel' },
  { name: 'history', path: '/history', icon: Clock, label: 'Historial' },
  { name: 'profile', path: '/profile', icon: User, label: 'Perfil' },
]

const tabs = auth.isAdmin ? adminTabs : clientTabs

function isActive(tabName: string) {
  return route.name === tabName
}
</script>

<template>
  <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-slate-100 shadow-bottom-bar z-50 safe-bottom">
    <div class="flex items-stretch">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.path"
        class="flex-1 flex flex-col items-center justify-center py-2 pt-3 gap-0.5 transition-all duration-150"
        :class="isActive(tab.name)
          ? 'text-primary-600'
          : 'text-slate-400 hover:text-slate-600'"
      >
        <component
          :is="tab.icon"
          :class="['w-6 h-6 transition-transform duration-150', isActive(tab.name) ? 'scale-110' : '']"
          :stroke-width="isActive(tab.name) ? 2.5 : 1.8"
        />
        <span class="text-[10px] font-medium mt-0.5">{{ tab.label }}</span>
        <span
          v-if="isActive(tab.name)"
          class="absolute bottom-0 w-6 h-0.5 bg-primary-600 rounded-full"
        />
      </RouterLink>
    </div>
  </nav>
</template>
