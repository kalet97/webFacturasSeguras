<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, CreditCard, Mail, MapPin, Phone, Lock, Eye, EyeOff, ChevronLeft, Check } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

interface Plan { idPlan: number; nombre: string; precio: number; maxFacturas: number | null; maxPrecioPorFactura: number }

const planes     = ref<Plan[]>([])
const idPlan     = ref<number | null>(null)

onMounted(async () => {
  try {
    planes.value = await api.get<Plan[]>('/planes')
  } catch { /* silencioso */ }
})

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

const form = ref({
  nombre:             '',
  apellido:           '',
  cedula:             '',
  correo:             '',
  telefonoPrincipal:  '',
  telefonoSecundario: '',
  whatsapp:           '',
  direccion:          '',
  clave:              '',
  confirmarClave:     '',
})
const showPassword   = ref(false)
const showConfirm    = ref(false)
const loading        = ref(false)
const error          = ref('')

async function handleRegister() {
  if (!form.value.nombre || !form.value.apellido || !form.value.cedula ||
      !form.value.correo  || !form.value.telefonoPrincipal || !form.value.clave) {
    error.value = 'Completa todos los campos obligatorios'
    return
  }
  if (form.value.clave !== form.value.confirmarClave) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  if (form.value.clave.length < 6) {
    error.value = 'La contraseña debe tener mínimo 6 caracteres'
    return
  }
  if (!idPlan.value) {
    error.value = 'Debes seleccionar un plan para continuar'
    return
  }

  error.value = ''
  loading.value = true
  try {
    await auth.register({
      nombre:             form.value.nombre,
      apellido:           form.value.apellido,
      cedula:             Number(form.value.cedula),
      correo:             form.value.correo,
      clave:              form.value.clave,
      telefonoPrincipal:  Number(form.value.telefonoPrincipal),
      telefonoSecundario: form.value.telefonoSecundario ? Number(form.value.telefonoSecundario) : null,
      whatsapp:           form.value.whatsapp           ? Number(form.value.whatsapp)           : null,
      direccion:          form.value.direccion || undefined,
      idPlan:             idPlan.value,
    })
    router.replace('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al crear la cuenta'
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

    <div class="flex-1 overflow-y-auto px-6 pb-10">
      <p class="text-slate-500 text-sm mb-5">Los campos con <span class="text-danger">*</span> son obligatorios</p>

      <form @submit.prevent="handleRegister" class="flex flex-col gap-4">

        <!-- Nombre y apellido en fila -->
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

        <!-- Cédula -->
        <div>
          <label class="label">Cédula <span class="text-danger">*</span></label>
          <div class="relative">
            <CreditCard class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.cedula"
              type="text"
              inputmode="numeric"
              placeholder="1234567890"
              class="input-field pl-11"
            />
          </div>
        </div>

        <!-- Correo -->
        <div>
          <label class="label">Correo electrónico <span class="text-danger">*</span></label>
          <div class="relative">
            <Mail class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.correo"
              type="email"
              placeholder="correo@ejemplo.com"
              class="input-field pl-11"
            />
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

        <!-- Teléfono secundario y WhatsApp en fila -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Tel. secundario <span class="text-slate-400 text-xs">(opc.)</span></label>
            <div class="relative">
              <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="form.telefonoSecundario"
                type="tel"
                inputmode="numeric"
                placeholder="6011234567"
                class="input-field pl-9 text-sm"
                maxlength="10"
              />
            </div>
          </div>
          <div>
            <label class="label">WhatsApp <span class="text-slate-400 text-xs">(opc.)</span></label>
            <input
              v-model="form.whatsapp"
              type="tel"
              inputmode="numeric"
              placeholder="3001234567"
              class="input-field text-sm"
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

        <!-- Contraseña -->
        <div>
          <label class="label">Contraseña <span class="text-danger">*</span></label>
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
          <label class="label">Confirmar contraseña <span class="text-danger">*</span></label>
          <div class="relative">
            <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="form.confirmarClave"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Repite tu contraseña"
              class="input-field pl-11 pr-11"
            />
            <button type="button" @click="showConfirm = !showConfirm"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5">
              <EyeOff v-if="showConfirm" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="h-px bg-slate-100" />

        <!-- Selección de plan -->
        <div>
          <label class="label">Elige tu plan <span class="text-danger">*</span></label>
          <div class="flex flex-col gap-2 mt-1">
            <button
              v-for="plan in planes"
              :key="plan.idPlan"
              type="button"
              @click="idPlan = plan.idPlan"
              :class="[
                'w-full text-left rounded-2xl border-2 px-4 py-3 transition-all',
                idPlan === plan.idPlan
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              ]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-sm text-slate-800">{{ plan.nombre }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ plan.maxFacturas ? `Hasta ${plan.maxFacturas} facturas` : 'Facturas ilimitadas' }} ·
                    Tope {{ formatCOP(plan.maxPrecioPorFactura) }}
                  </p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="font-bold text-primary-600 text-sm">{{ formatCOP(plan.precio) }}<span class="font-normal text-slate-400">/mes</span></span>
                  <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors', idPlan === plan.idPlan ? 'border-primary-600 bg-primary-600' : 'border-slate-300']">
                    <Check v-if="idPlan === plan.idPlan" class="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div v-if="error" class="text-danger text-sm text-center bg-danger-50 py-2.5 px-3 rounded-xl">
          {{ error }}
        </div>

        <AppButton type="submit" :loading="loading" class="mt-1">
          Crear cuenta
        </AppButton>

        <p class="text-center text-xs text-slate-400 pb-2">
          Al registrarte aceptas nuestros <span class="text-primary-600">Términos y Condiciones</span>
        </p>

      </form>
    </div>
  </div>
</template>
