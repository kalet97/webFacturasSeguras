<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Upload, CheckCircle, Info, Copy } from 'lucide-vue-next'
import { useRecibosStore } from '@/stores/recibos'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import AppHeader from '@/components/AppHeader.vue'
import AppButton from '@/components/AppButton.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const route = useRoute()
const router = useRouter()
const store = useRecibosStore()
const auth = useAuthStore()

const id = route.params.id as string
const recibo = computed(() => store.getReciboById(id))

const nequiNumber  = ref<string | null>(null)
const nequiTitular = ref<string | null>(null)
const llaveValue   = ref<string | null>(null)
const llaveTitular = ref<string | null>(null)

onMounted(async () => {
  if (!recibo.value) {
    await store.fetchRecibos().catch(() => {})
  }

  try {
    const [numParam, titularParam, llaveParam, llaveTitularParam] = await Promise.all([
      api.get<{ nombre: string; valor: string }>('/parametros-generales/nequi',        auth.token),
      api.get<{ nombre: string; valor: string }>('/parametros-generales/nequiTitular', auth.token),
      api.get<{ nombre: string; valor: string }>('/parametros-generales/llave',        auth.token),
      api.get<{ nombre: string; valor: string }>('/parametros-generales/llaveTitular', auth.token),
    ])
    nequiNumber.value  = numParam?.valor  ?? null
    nequiTitular.value = titularParam?.valor ?? null
    llaveValue.value   = llaveParam?.valor ?? null
    llaveTitular.value = llaveTitularParam?.valor ?? null
  } catch {
    // si falla, no se muestran los datos
  }
})

const copiedField = ref<'nequi' | 'llave' | null>(null)

function copyValue(field: 'nequi' | 'llave', value: string | null) {
  if (!value) return
  navigator.clipboard.writeText(value).then(() => {
    copiedField.value = field
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = null
    }, 2000)
  })
}

const commission = computed(() => {
  const plan = auth.user?.plan
  const amount = recibo.value?.amount ?? 0
  if (!plan || amount <= plan.maxPrecioPorFactura) return 0
  return Math.round((amount - plan.maxPrecioPorFactura) * 0.004)
})
const total = computed(() => (recibo.value?.amount ?? 0) + commission.value)

const fileRef = ref<HTMLInputElement | null>(null)
const uploadedFile = ref<File | null>(null)
const uploadedFileName = ref<string | null>(null)
const showConfirm = ref(false)
const loading = ref(false)
const submitted = ref(false)

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    uploadedFile.value = file
    uploadedFileName.value = file.name
  }
}

async function confirmPayment() {
  if (!uploadedFile.value) return
  loading.value = true
  try {
    await store.requestPayment(id, recibo.value?.amount ?? 0, commission.value, uploadedFile.value)
    showConfirm.value = false
    submitted.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="screen">
    <AppHeader title="Solicitar pago" />

    <div v-if="!recibo" class="flex-1 flex items-center justify-center">
      <p class="text-slate-400">Recibo no encontrado</p>
    </div>

    <div v-else-if="!submitted" class="flex-1 overflow-y-auto px-4 pb-8">
      <div class="card mb-4">
        <div class="flex items-center gap-3 mb-4">
          <div :class="['w-11 h-11 rounded-xl flex items-center justify-center text-2xl', store.serviceColors[recibo?.serviceType ?? 'energia']]">
            {{ store.serviceIcons[recibo?.serviceType ?? 'energia'] }}
          </div>
          <div>
            <p class="font-semibold text-slate-800">{{ recibo?.company }}</p>
            <p class="text-sm text-slate-500">{{ store.serviceLabels[recibo?.serviceType ?? 'energia'] }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-slate-50">
            <span class="text-sm text-slate-600">Valor del recibo</span>
            <span class="font-semibold text-slate-800">{{ formatCurrency(recibo?.amount ?? 0) }}</span>
          </div>
          <div v-if="commission > 0" class="flex justify-between items-center py-2 border-b border-slate-50">
            <div class="flex items-center gap-1.5">
              <span class="text-sm text-slate-600">Cargo adicional (4x1000)</span>
              <Info class="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span class="font-semibold text-slate-800">{{ formatCurrency(commission) }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="font-bold text-slate-800">Total a pagar</span>
            <span class="text-xl font-black text-primary-600">{{ formatCurrency(total) }}</span>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <h3 class="font-bold text-slate-800 mb-1">Paga por Nequi</h3>
        <!-- <p class="text-xs text-slate-500 mb-4">Escanea el código QR o transfiere al número</p>
        <div class="flex justify-center mb-4">
          <div class="w-40 h-40 bg-slate-100 rounded-2xl flex items-center justify-center">
            <svg viewBox="0 0 100 100" class="w-32 h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="5" width="30" height="30" rx="2" fill="#1e293b"/>
              <rect x="10" y="10" width="20" height="20" rx="1" fill="white"/>
              <rect x="13" y="13" width="14" height="14" rx="1" fill="#1e293b"/>
              <rect x="65" y="5" width="30" height="30" rx="2" fill="#1e293b"/>
              <rect x="70" y="10" width="20" height="20" rx="1" fill="white"/>
              <rect x="73" y="13" width="14" height="14" rx="1" fill="#1e293b"/>
              <rect x="5" y="65" width="30" height="30" rx="2" fill="#1e293b"/>
              <rect x="10" y="70" width="20" height="20" rx="1" fill="white"/>
              <rect x="13" y="73" width="14" height="14" rx="1" fill="#1e293b"/>
              <rect x="43" y="5" width="6" height="6" fill="#1e293b"/>
              <rect x="53" y="5" width="6" height="6" fill="#1e293b"/>
              <rect x="43" y="15" width="6" height="6" fill="#1e293b"/>
              <rect x="53" y="25" width="6" height="6" fill="#1e293b"/>
              <rect x="43" y="35" width="6" height="6" fill="#1e293b"/>
              <rect x="65" y="43" width="6" height="6" fill="#1e293b"/>
              <rect x="75" y="43" width="6" height="6" fill="#1e293b"/>
              <rect x="85" y="53" width="6" height="6" fill="#1e293b"/>
              <rect x="65" y="63" width="6" height="6" fill="#1e293b"/>
              <rect x="75" y="73" width="6" height="6" fill="#1e293b"/>
              <rect x="85" y="83" width="6" height="6" fill="#1e293b"/>
              <rect x="43" y="53" width="6" height="6" fill="#1e293b"/>
              <rect x="43" y="63" width="6" height="6" fill="#1e293b"/>
              <rect x="53" y="73" width="6" height="6" fill="#1e293b"/>
              <rect x="43" y="83" width="6" height="6" fill="#1e293b"/>
              <rect x="53" y="83" width="6" height="6" fill="#1e293b"/>
            </svg>
          </div>
        </div> -->
        <div class="bg-primary-50 rounded-2xl p-3 text-center">
          <p class="text-xs text-slate-500">Número Nequi</p>
          <div v-if="nequiNumber" class="flex items-center justify-center gap-2 mt-0.5">
            <p class="font-bold text-primary-600 text-lg">{{ nequiNumber }}</p>
            <button
              type="button"
              @click="copyValue('nequi', nequiNumber)"
              :class="[
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors shrink-0',
                copiedField === 'nequi' ? 'bg-success-100 text-success-600' : 'bg-white text-primary-600 hover:bg-primary-100',
              ]"
              :title="copiedField === 'nequi' ? '¡Copiado!' : 'Copiar número'"
            >
              <CheckCircle v-if="copiedField === 'nequi'" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedField === 'nequi' ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
          <p v-else class="text-sm text-slate-400 mt-0.5">Cargando...</p>
          <p v-if="nequiTitular" class="text-xs text-slate-500 mt-1">{{ nequiTitular }}</p>
        </div>
      </div>

      <div v-if="llaveValue" class="card mb-4">
        <h3 class="font-bold text-slate-800 mb-1">Paga por Llave</h3>
        <div class="bg-primary-50 rounded-2xl p-3 text-center">
          <p class="text-xs text-slate-500">Llave</p>
          <div class="flex items-center justify-center gap-2 mt-0.5">
            <p class="font-bold text-primary-600 text-lg break-all">{{ llaveValue }}</p>
            <button
              type="button"
              @click="copyValue('llave', llaveValue)"
              :class="[
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors shrink-0',
                copiedField === 'llave' ? 'bg-success-100 text-success-600' : 'bg-white text-primary-600 hover:bg-primary-100',
              ]"
              :title="copiedField === 'llave' ? '¡Copiado!' : 'Copiar llave'"
            >
              <CheckCircle v-if="copiedField === 'llave'" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedField === 'llave' ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
          <p v-if="llaveTitular" class="text-xs text-slate-500 mt-1">{{ llaveTitular }}</p>
        </div>
      </div>

      <div class="card mb-6">
        <h3 class="font-bold text-slate-800 mb-1">Subir comprobante</h3>
        <p class="text-xs text-slate-500 mb-4">Adjunta el pantallazo del pago para confirmar</p>

        <input ref="fileRef" type="file" accept="image/*" class="hidden" @change="handleFileChange" />

        <button
          @click="fileRef?.click()"
          :class="[
            'w-full border-2 border-dashed rounded-2xl py-6 flex flex-col items-center gap-2 transition-colors',
            uploadedFileName
              ? 'border-success bg-success-50'
              : 'border-slate-200 bg-slate-50 hover:border-primary-300 hover:bg-primary-50',
          ]"
        >
          <CheckCircle v-if="uploadedFileName" class="w-8 h-8 text-success" />
          <Upload v-else class="w-8 h-8 text-slate-400" />
          <p :class="['text-sm font-medium', uploadedFileName ? 'text-success' : 'text-slate-500']">
            {{ uploadedFileName || 'Toca para subir imagen' }}
          </p>
          <p v-if="!uploadedFileName" class="text-xs text-slate-400">JPG, PNG hasta 10MB</p>
        </button>
      </div>

      <AppButton @click="showConfirm = true" :disabled="!uploadedFileName">
        Confirmar solicitud de pago
      </AppButton>
      <p v-if="!uploadedFileName" class="text-xs text-slate-400 text-center mt-2">Sube el comprobante para continuar</p>
    </div>

    <div v-else class="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
      <div class="w-20 h-20 bg-success-50 rounded-3xl flex items-center justify-center">
        <CheckCircle class="w-10 h-10 text-success" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-slate-800">¡Solicitud enviada!</h2>
        <p class="text-slate-500 mt-2 text-sm">Tu solicitud de pago fue recibida. Te notificaremos cuando sea procesada.</p>
      </div>
      <AppButton @click="router.replace('/dashboard')" class="mt-4">
        Volver al inicio
      </AppButton>
    </div>

    <ConfirmationModal
      :open="showConfirm"
      title="Confirmar solicitud"
      :message="`Se solicitará el pago de ${formatCurrency(total)} incluida la comisión del servicio.`"
      confirm-label="Confirmar pago"
      :loading="loading"
      @confirm="confirmPayment"
      @cancel="showConfirm = false"
    />
  </div>
</template>
