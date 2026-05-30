<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Hash, Calendar } from 'lucide-vue-next'
import { useRecibosStore, type ServiceType } from '@/stores/recibos'
import AppHeader from '@/components/AppHeader.vue'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const store = useRecibosStore()

const serviceTypes: { value: ServiceType; label: string; icon: string }[] = [
  { value: 'energia', label: 'Energía', icon: '⚡' },
  { value: 'agua', label: 'Agua', icon: '💧' },
  { value: 'gas', label: 'Gas', icon: '🔥' },
  { value: 'internet', label: 'Internet', icon: '📶' },
  { value: 'telefono', label: 'Teléfono', icon: '📞' },
  { value: 'tv', label: 'TV Cable', icon: '📺' },
]

const form = ref({
  serviceType: '' as ServiceType | '',
  company: '',
  clientNumber: '',
  dueDate: '',
  address: '',
  amount: '',
})

const loading = ref(false)
const error = ref('')

function selectService(type: ServiceType) {
  form.value.serviceType = type
}

async function handleSave() {
  if (!form.value.serviceType || !form.value.company || !form.value.clientNumber || !form.value.dueDate) {
    error.value = 'Completa los campos obligatorios'
    return
  }
  error.value = ''
  loading.value = true

  await new Promise(r => setTimeout(r, 600))

  store.addRecibo({
    serviceType: form.value.serviceType as ServiceType,
    company: form.value.company,
    clientNumber: form.value.clientNumber,
    dueDate: form.value.dueDate,
    address: form.value.address,
    amount: form.value.amount ? parseInt(form.value.amount) : undefined,
  })

  loading.value = false
  router.replace('/dashboard')
}
</script>

<template>
  <div class="screen">
    <AppHeader title="Agregar recibo" />

    <div class="flex-1 overflow-y-auto px-4 pb-8">
      <p class="text-sm text-slate-500 mb-5">Registra un nuevo servicio para monitorear</p>

      <div class="mb-5">
        <label class="label">Tipo de servicio <span class="text-danger">*</span></label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="s in serviceTypes"
            :key="s.value"
            type="button"
            @click="selectService(s.value)"
            :class="[
              'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all duration-150',
              form.serviceType === s.value
                ? 'border-primary-600 bg-primary-50 text-primary-600'
                : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200',
            ]"
          >
            <span class="text-2xl">{{ s.icon }}</span>
            <span class="text-xs font-medium">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div>
          <label class="label">Empresa <span class="text-danger">*</span></label>
          <input v-model="form.company" type="text" placeholder="Ej: EPM, Acueducto Bogotá" class="input-field" />
        </div>

        <div>
          <label class="label">Número de cliente <span class="text-danger">*</span></label>
          <div class="relative">
            <Hash class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.clientNumber" type="text" placeholder="1234567890" class="input-field pl-11" />
          </div>
        </div>

        <div>
          <label class="label">Fecha límite de pago <span class="text-danger">*</span></label>
          <div class="relative">
            <Calendar class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input v-model="form.dueDate" type="date" class="input-field pl-11" />
          </div>
        </div>

        <div>
          <label class="label">Valor del recibo <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
            <input v-model="form.amount" type="number" placeholder="150000" class="input-field pl-8" inputmode="numeric" />
          </div>
        </div>

        <div>
          <label class="label">Dirección <span class="text-slate-400 text-xs font-normal">(opcional)</span></label>
          <div class="relative">
            <MapPin class="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <textarea v-model="form.address" rows="2" placeholder="Dirección de facturación" class="input-field pl-11 resize-none" />
          </div>
        </div>

        <div v-if="error" class="text-danger text-sm bg-danger-50 py-2.5 px-3 rounded-xl">
          {{ error }}
        </div>

        <AppButton :loading="loading" @click="handleSave" class="mt-2">
          Guardar recibo
        </AppButton>
      </div>
    </div>
  </div>
</template>
