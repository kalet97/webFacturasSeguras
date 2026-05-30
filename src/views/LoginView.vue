<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Phone, Lock, Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!phone.value || !password.value) {
    error.value = 'Completa todos los campos'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await auth.login(phone.value, password.value)
    router.push('/dashboard')
  } catch {
    error.value = 'Teléfono o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="screen">
    <div class="flex-1 flex flex-col px-6 pt-12 pb-8">
      <div class="mb-10">
        <div class="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mb-4">
          <span class="text-2xl font-black text-white">RS</span>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">Bienvenido 👋</h1>
        <p class="text-slate-500 mt-1 text-sm">Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label class="label">Teléfono</label>
          <div class="relative">
            <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 w-5 h-5" />
            <input
              v-model="phone"
              type="tel"
              placeholder="3001234567"
              class="input-field pl-11"
              inputmode="numeric"
              maxlength="10"
            />
          </div>
        </div>

        <div>
          <label class="label">Contraseña</label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="input-field pl-11 pr-11"
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

        <div v-if="error" class="text-danger text-sm text-center bg-danger-50 py-2.5 px-3 rounded-xl">
          {{ error }}
        </div>

        <div class="flex justify-end">
          <button type="button" class="text-sm text-primary-600 font-medium hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <AppButton type="submit" :loading="loading" class="mt-2">
          Ingresar
        </AppButton>
      </form>

      <div class="mt-auto pt-8 text-center">
        <p class="text-slate-500 text-sm">
          ¿No tienes cuenta?
          <RouterLink to="/register" class="text-primary-600 font-semibold ml-1">Regístrate</RouterLink>
        </p>
      </div>

      <p class="text-center text-xs text-slate-400 mt-4">
        Admin demo: 3001234567 / cualquier contraseña
      </p>
    </div>
  </div>
</template>
