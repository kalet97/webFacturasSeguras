<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, MapPin, Phone, Shield, LogOut, ChevronRight, LayoutDashboard } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const router = useRouter()
const auth = useAuthStore()

const showLogoutModal = ref(false)


function handleLogout() {
  auth.logout()
  router.replace('/login')
}

function getInitials(name?: string) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <div class="screen pb-24">
    <AppHeader title="Perfil" :show-back="false" />

    <div class="flex-1 overflow-y-auto px-4 pb-4">
      <div class="card mb-5 flex items-center gap-4">
        <div class="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shrink-0">
          <span class="text-xl font-bold text-white">{{ getInitials(auth.user?.name) }}</span>
        </div>
        <div class="flex-1">
          <p class="font-bold text-slate-800 text-lg">{{ auth.user?.name }}</p>
          <p class="text-sm text-slate-500">{{ auth.user?.phone }}</p>
          <span class="inline-flex items-center gap-1 mt-1 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            <Shield class="w-3 h-3" />
            {{ auth.isAdmin ? 'Administrador' : 'Cliente' }}
          </span>
        </div>
        <button class="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
          <User class="w-4 h-4 text-slate-600" />
        </button>
      </div>

      <div class="card mb-4">
        <h3 class="font-bold text-slate-800 mb-3">Datos personales</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <User class="w-4 h-4 text-primary-600" />
            </div>
            <div class="flex-1">
              <p class="text-xs text-slate-400">Nombre completo</p>
              <p class="text-sm font-medium text-slate-700">{{ auth.user?.name }}</p>
            </div>
            <button class="text-slate-400 hover:text-slate-600"><ChevronRight class="w-4 h-4" /></button>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
              <MapPin class="w-4 h-4 text-primary-600" />
            </div>
            <div class="flex-1">
              <p class="text-xs text-slate-400">Dirección</p>
              <p class="text-sm font-medium text-slate-700">{{ auth.user?.address }}</p>
            </div>
            <button class="text-slate-400 hover:text-slate-600"><ChevronRight class="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <h3 class="font-bold text-slate-800 mb-3">Mis teléfonos</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-success-50 rounded-xl flex items-center justify-center shrink-0">
              <Phone class="w-4 h-4 text-success" />
            </div>
            <div class="flex-1">
              <p class="text-xs text-slate-400">Principal</p>
              <p class="text-sm font-medium text-slate-700">{{ auth.user?.phone }}</p>
            </div>
            <span class="text-xs bg-success-50 text-success font-medium px-2 py-0.5 rounded-full">Activo</span>
          </div>
          <button class="flex items-center gap-3 w-full text-left border-2 border-dashed border-slate-200 rounded-xl p-3 hover:border-primary-300 transition-colors">
            <div class="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <Phone class="w-4 h-4 text-slate-400" />
            </div>
            <p class="text-sm text-slate-400">Agregar teléfono secundario</p>
          </button>
        </div>
      </div>

      <div v-if="auth.isAdmin" class="card mb-4">
        <button @click="router.push('/admin')" class="flex items-center gap-3 w-full">
          <div class="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
            <LayoutDashboard class="w-5 h-5 text-purple-600" />
          </div>
          <div class="flex-1 text-left">
            <p class="text-sm font-semibold text-slate-800">Panel Administrativo</p>
            <p class="text-xs text-slate-500">Gestión completa del sistema</p>
          </div>
          <ChevronRight class="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <button
        @click="showLogoutModal = true"
        class="w-full flex items-center justify-center gap-2 py-3.5 text-danger font-semibold bg-danger-50 rounded-card"
      >
        <LogOut class="w-5 h-5" />
        Cerrar sesión
      </button>
    </div>

    <BottomTabBar />

    <ConfirmationModal
      :open="showLogoutModal"
      title="¿Cerrar sesión?"
      message="Deberás volver a iniciar sesión para acceder a tu cuenta."
      confirm-label="Cerrar sesión"
      variant="danger"
      @confirm="handleLogout"
      @cancel="showLogoutModal = false"
    />
  </div>
</template>
