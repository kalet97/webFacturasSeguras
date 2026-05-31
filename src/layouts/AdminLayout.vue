<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  LayoutDashboard, Users, FileText, Bell, CreditCard,
  CheckSquare, Building2, Settings, LogOut, Menu, X, ChevronRight,
  UserCog, Tag, CircleDot,
} from 'lucide-vue-next'
import { useAdminAuthStore } from '@/stores/adminAuth'

const route  = useRoute()
const router = useRouter()
const adminAuth = useAdminAuthStore()

const sidebarOpen = ref(false)

const navItems = [
  { label: 'Dashboard',           to: '/admin/dashboard',       icon: LayoutDashboard },
  { label: 'Clientes',            to: '/admin/clientes',        icon: Users },
  { label: 'Recibos',             to: '/admin/recibos',         icon: FileText },
  { label: 'Pagos',               to: '/admin/pagos',           icon: CreditCard },
  { label: 'Tareas',              to: '/admin/tareas',          icon: CheckSquare },
  { label: 'Usuarios',            to: '/admin/usuarios',        icon: UserCog },
  { label: 'Empresas',            to: '/admin/empresas',        icon: Building2 },
  { label: 'Tipos Notificación',  to: '/admin/notificaciones',  icon: Bell },
  { label: 'Tipos Factura',       to: '/admin/tipos-factura',   icon: Tag },
  { label: 'Estados Recibo',      to: '/admin/estados-recibo',  icon: CircleDot },
  { label: 'Configuración',       to: '/admin/configuracion',   icon: Settings },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(to + '/')
}

const userName = computed(() =>
  adminAuth.user ? `${adminAuth.user.nombre} ${adminAuth.user.apellido}` : ''
)
const userInitials = computed(() =>
  adminAuth.user
    ? `${adminAuth.user.nombre[0]}${adminAuth.user.apellido[0]}`.toUpperCase()
    : ''
)

async function handleLogout() {
  await adminAuth.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="flex h-screen bg-slate-100 overflow-hidden">

    <!-- Overlay móvil -->
    <Transition name="fade-overlay">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/40 z-20 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-slate-900 transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div class="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
          <span class="text-white font-black text-sm">RS</span>
        </div>
        <div class="leading-tight">
          <p class="text-white font-semibold text-sm">Recibo Seguro</p>
          <p class="text-slate-400 text-xs">Panel administrativo</p>
        </div>
        <button
          class="ml-auto lg:hidden text-slate-400 hover:text-white p-1"
          @click="sidebarOpen = false"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 overflow-y-auto py-4 px-3">
        <ul class="flex flex-col gap-0.5">
          <li v-for="item in navItems" :key="item.to">
            <RouterLink
              :to="item.to"
              @click="sidebarOpen = false"
              :class="[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive(item.to)
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              ]"
            >
              <component :is="item.icon" class="w-4.5 h-4.5 shrink-0" />
              <span class="flex-1">{{ item.label }}</span>
              <ChevronRight
                v-if="isActive(item.to)"
                class="w-3.5 h-3.5 opacity-70"
              />
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Usuario + logout -->
      <div class="border-t border-slate-700/60 p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
            <span class="text-white text-xs font-bold">{{ userInitials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">{{ userName }}</p>
            <p class="text-slate-400 text-xs truncate">{{ adminAuth.user?.correo }}</p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-danger transition-colors text-sm font-medium"
        >
          <LogOut class="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Contenido principal -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Topbar -->
      <header class="flex items-center gap-4 bg-white border-b border-slate-200 px-5 py-3.5 shrink-0">
        <button
          class="lg:hidden text-slate-500 hover:text-slate-800 p-1"
          @click="sidebarOpen = true"
        >
          <Menu class="w-5 h-5" />
        </button>

        <div class="flex-1 min-w-0">
          <h1 class="text-base font-semibold text-slate-800 truncate">
            {{ route.meta.title ?? 'Panel de administración' }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <span class="text-white text-xs font-bold">{{ userInitials }}</span>
          </div>
        </div>
      </header>

      <!-- Vista activa -->
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>

  </div>
</template>

<style scoped>
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>
