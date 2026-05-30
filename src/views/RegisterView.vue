<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, MapPin, Phone, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref({
  name: '',
  address: '',
  phone: '',
  phoneSecondary: '',
  password: '',
})
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (!form.value.name || !form.value.address || !form.value.phone || !form.value.password) {
    error.value = 'Completa todos los campos obligatorios'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await auth.register({
      name: form.value.name,
      address: form.value.address,
      phone: form.value.phone,
    })
    router.push('/dashboard')
  } catch {
    error.value = 'Error al crear la cuenta'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="screen">
    <div class="flex items-center gap-2 px-4 pt-4 pb-2">
      <button @click="router.back()" class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100">
        <ChevronLeft class="w-5 h-5 text-slate-700" />
      </button>
      <h1 class="text-lg font-bold text-slate-800">Crear cuenta</h1>
    </div>

    <div class="flex-1 flex flex-col px-6 pb-8 overflow-y-auto">
      <p class="text-slate-500 text-sm mb-6">Completa tu información para empezar</p>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
        <div>
          <label class="label">Nombre completo <span class="text-danger">*</span></label>
          <div class="relative">
            <User class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.name" type="text" placeholder="María García López" class="input-field pl-11" />
          </div>
        </div>

        <div>
          <label class="label">Dirección <span class="text-danger">*</span></label>
          <div class="relative">
            <MapPin class="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <textarea
              v-model="form.address"
              placeholder="Carrera 7 #45-12, Bogotá"
              rows="2"
              class="input-field pl-11 resize-none"
            />
          </div>
        </div>

        <div>
          <label class="label">Teléfono principal <span class="text-danger">*</span></label>
          <div class="relative">
            <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.phone" type="tel" placeholder="3109876543" class="input-field pl-11" inputmode="numeric" maxlength="10" />
          </div>
        </div>

        <div>
          <label class="label">Teléfono secundario <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
          <div class="relative">
            <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.phoneSecondary" type="tel" placeholder="6011234567" class="input-field pl-11" inputmode="numeric" maxlength="10" />
          </div>
        </div>

        <div>
          <label class="label">Contraseña <span class="text-danger">*</span></label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 8 caracteres"
              class="input-field pl-11 pr-11"
            />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5">
              <EyeOff v-if="showPassword" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div v-if="error" class="text-danger text-sm text-center bg-danger-50 py-2.5 px-3 rounded-xl">
          {{ error }}
        </div>

        <AppButton type="submit" :loading="loading" class="mt-2">
          Crear cuenta
        </AppButton>

        <p class="text-center text-xs text-slate-400">
          Al registrarte aceptas nuestros <span class="text-primary-600">Términos y Condiciones</span>
        </p>
      </form>
    </div>
  </div>
</template>
