<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  LayoutDashboard, Users, FileText, Bell, CreditCard,
  CheckSquare, Building2, Settings, LogOut, Menu, X, ChevronRight,
  UserCog, Tag, CircleDot, ChevronsLeft, ChevronsRight, Inbox,
} from 'lucide-vue-next'
import { useAdminAuthStore } from '@/stores/adminAuth'
import AdminNotificationBell from '@/components/admin/AdminNotificationBell.vue'

const route  = useRoute()
const router = useRouter()
const adminAuth = useAdminAuthStore()

const sidebarOpen = ref(false)
const collapsed   = ref(false)

const navItems = [
  { label: 'Dashboard',           to: '/admin/dashboard',       icon: LayoutDashboard },
  { label: 'Notificaciones',      to: '/admin/notificaciones-admin', icon: Inbox },
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
        'fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-slate-900 transition-all duration-300 ease-in-out shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-16' : 'w-64',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center border-b border-slate-700/60 h-[65px] px-3.5 overflow-hidden">
        <div class="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
          <span class="text-white font-black text-sm">RS</span>
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0 ml-3 leading-tight">
          <p class="text-white font-semibold text-sm whitespace-nowrap">Recibo Seguro</p>
          <p class="text-slate-400 text-xs whitespace-nowrap">Panel administrativo</p>
        </div>
        <!-- Cerrar en móvil -->
        <button
          class="ml-auto lg:hidden text-slate-400 hover:text-white p-1 shrink-0"
          @click="sidebarOpen = false"
        >
          <X class="w-5 h-5" />
        </button>
        <!-- Colapsar en desktop -->
        <button
          :class="['hidden lg:flex ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0', collapsed && 'mx-auto']"
          @click="collapsed = !collapsed"
          :title="collapsed ? 'Expandir menú' : 'Colapsar menú'"
        >
          <ChevronsLeft v-if="!collapsed" class="w-4 h-4" />
          <ChevronsRight v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 overflow-y-auto py-4 px-2">
        <ul class="flex flex-col gap-0.5">
          <li v-for="item in navItems" :key="item.to">
            <RouterLink
              :to="item.to"
              @click="sidebarOpen = false"
              :title="collapsed ? item.label : undefined"
              :class="[
                'flex items-center px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'justify-center' : 'gap-3',
                isActive(item.to)
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 shrink-0" />
              <span v-if="!collapsed" class="flex-1 whitespace-nowrap">{{ item.label }}</span>
              <ChevronRight v-if="!collapsed && isActive(item.to)" class="w-3.5 h-3.5 opacity-70 shrink-0" />
            </RouterLink>
          </li>
        </ul>
      </nav>

      <!-- Usuario + logout -->
      <div class="border-t border-slate-700/60 p-3">
        <div v-if="!collapsed" class="flex items-center gap-3 mb-2 px-1">
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
            <span class="text-white text-xs font-bold">{{ userInitials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">{{ userName }}</p>
            <p class="text-slate-400 text-xs truncate">{{ adminAuth.user?.correo }}</p>
          </div>
        </div>
        <div v-else class="flex justify-center mb-2">
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <span class="text-white text-xs font-bold">{{ userInitials }}</span>
          </div>
        </div>
        <button
          @click="handleLogout"
          :title="collapsed ? 'Cerrar sesión' : undefined"
          :class="[
            'w-full flex items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-danger transition-colors text-sm font-medium py-2',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
          ]"
        >
          <LogOut class="w-4 h-4 shrink-0" />
          <span v-if="!collapsed">Cerrar sesión</span>
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
          <AdminNotificationBell />
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
