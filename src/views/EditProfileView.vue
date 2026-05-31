<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Phone, MapPin, Lock, Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const auth   = useAuthStore()

const form = ref({
  nombre:             auth.user?.nombre             ?? '',
  apellido:           auth.user?.apellido           ?? '',
  telefonoPrincipal:  auth.user?.phone              ?? '',
  telefonoSecundario: auth.user?.telefonoSecundario ?? '',
  direccion:          auth.user?.address            ?? '',
  clave:              '',
  confirmarClave:     '',
})

const showPassword  = ref(false)
const showConfirm   = ref(false)
const loading       = ref(false)
const error         = ref('')
const success       = ref(false)

async function handleSave() {
  if (!form.value.nombre || !form.value.apellido || !form.value.telefonoPrincipal) {
    error.value = 'Nombre, apellido y teléfono principal son obligatorios'
    return
  }
  if (form.value.clave && form.value.clave !== form.value.confirmarClave) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  if (form.value.clave && form.value.clave.length < 6) {
    error.value = 'La contraseña debe tener mínimo 6 caracteres'
    return
  }

  error.value = ''
  loading.value = true
  try {
    const payload: Parameters<typeof auth.updateProfile>[0] = {
      nombre:             form.value.nombre,
      apellido:           form.value.apellido,
      telefonoPrincipal:  Number(form.value.telefonoPrincipal),
      telefonoSecundario: form.value.telefonoSecundario ? Number(form.value.telefonoSecundario) : null,
      direccion:          form.value.direccion || undefined,
    }
    if (form.value.clave) payload.clave = form.value.clave

    await auth.updateProfile(payload)
    success.value = true
    setTimeout(() => router.back(), 1000)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al guardar los cambios'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="screen">
    <AppHeader title="Editar perfil" />

    <div class="flex-1 overflow-y-auto px-4 pb-10">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 pt-2">

        <!-- Nombre y apellido -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Nombre <span class="text-danger">*</span></label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input v-model="form.nombre" type="text" placeholder="María" class="input-field pl-9 text-sm" />
            </div>
          </div>
          <div>
            <label class="label">Apellido <span class="text-danger">*</span></label>
            <input v-model="form.apellido" type="text" placeholder="García" class="input-field text-sm" />
          </div>
        </div>

        <!-- Teléfono principal -->
        <div>
          <label class="label">Teléfono principal <span class="text-danger">*</span></label>
          <div class="relative">
            <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.telefonoPrincipal"
              type="tel"
              inputmode="numeric"
              placeholder="3001234567"
              class="input-field pl-11"
              maxlength="10"
            />
          </div>
        </div>

        <!-- Teléfono secundario -->
        <div>
          <label class="label">Teléfono secundario <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
          <div class="relative">
            <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.telefonoSecundario"
              type="tel"
              inputmode="numeric"
              placeholder="6011234567"
              class="input-field pl-11"
              maxlength="10"
            />
          </div>
        </div>

        <!-- Dirección -->
        <div>
          <label class="label">Dirección <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
          <div class="relative">
            <MapPin class="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <textarea
              v-model="form.direccion"
              rows="2"
              placeholder="Carrera 7 #45-12, Bogotá"
              class="input-field pl-11 resize-none"
            />
          </div>
        </div>

        <div class="h-px bg-slate-100" />

        <p class="text-xs text-slate-400 -mb-1">Deja la contraseña en blanco si no deseas cambiarla</p>

        <!-- Nueva contraseña -->
        <div>
          <label class="label">Nueva contraseña</label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.clave"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              class="input-field pl-11 pr-11"
            />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5">
              <EyeOff v-if="showPassword" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Confirmar contraseña -->
        <div>
          <label class="label">Confirmar contraseña</label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.confirmarClave"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Repite la nueva contraseña"
              class="input-field pl-11 pr-11"
            />
            <button type="button" @click="showConfirm = !showConfirm"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5">
              <EyeOff v-if="showConfirm" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="text-danger text-sm text-center bg-danger-50 py-2.5 px-3 rounded-xl">
          {{ error }}
        </div>

        <!-- Éxito -->
        <div v-if="success" class="text-success text-sm text-center bg-success-50 py-2.5 px-3 rounded-xl font-medium">
          ✓ Cambios guardados correctamente
        </div>

        <AppButton type="submit" :loading="loading" class="mt-1">
          Guardar cambios
        </AppButton>

      </form>
    </div>
  </div>
</template>
