<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { version } from '../../package.json'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const correo = ref('')
const clave = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!correo.value || !clave.value) {
    error.value = 'Completa todos los campos'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await adminAuth.login(correo.value, clave.value)
    router.push('/admin/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Correo o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex">

    <!-- Panel izquierdo — branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col justify-between p-12">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <span class="text-white font-black text-lg">RS</span>
        </div>
        <span class="text-white font-semibold text-lg">Recibo Seguro</span>
      </div>

      <div>
        <h1 class="text-4xl font-bold text-white leading-snug mb-4">
          Panel de<br>administración
        </h1>
        <p class="text-primary-100 text-base leading-relaxed max-w-sm">
          Gestiona clientes, recibos, notificaciones y pagos desde un solo lugar.
        </p>
      </div>

      <p class="text-primary-200 text-sm">© 2026 Recibo Seguro · v{{ version }}</p>
    </div>

    <!-- Panel derecho — formulario -->
    <div class="flex-1 flex items-center justify-center p-6 lg:p-16">
      <div class="w-full max-w-md">

        <!-- Logo móvil (visible solo en < lg) -->
        <div class="flex items-center gap-3 mb-10 lg:hidden">
          <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <span class="text-white font-black text-lg">RS</span>
          </div>
          <span class="text-slate-800 font-semibold text-lg">Recibo Seguro</span>
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-slate-800">Acceso administrativo</h2>
          <p class="text-slate-500 mt-1 text-sm">Ingresa con tu cuenta de operador</p>
        </div>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">

          <!-- Correo -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Correo electrónico
            </label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                v-model="correo"
                type="email"
                placeholder="operador@reciboSeguro.com"
                autocomplete="email"
                class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       transition text-sm"
              />
            </div>
          </div>

          <!-- Contraseña -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                v-model="clave"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                class="w-full pl-11 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                       transition text-sm"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 py-2.5 px-3.5 rounded-xl"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            {{ error }}
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed
                   text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2 mt-1"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>{{ loading ? 'Ingresando...' : 'Ingresar al panel' }}</span>
          </button>

        </form>

        <div class="mt-8 pt-6 border-t border-slate-200 text-center">
          <RouterLink to="/login" class="text-sm text-slate-500 hover:text-primary-600 transition">
            ← Volver al acceso de clientes
          </RouterLink>
          <p class="text-xs text-slate-400 mt-3">v{{ version }}</p>
        </div>

      </div>
    </div>

  </div>
</template>
