<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Upload, CheckCircle, Info, Copy } from 'lucide-vue-next'
import { useRecibosStore } from '@/stores/recibos'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { calcComision } from '@/utils/comision'
import { roundUpToHundred } from '@/utils/money'
import AppHeader from '@/components/AppHeader.vue'
import AppButton from '@/components/AppButton.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const route = useRoute()
const router = useRouter()
const store = useRecibosStore()
const auth = useAuthStore()

const ids = computed(() => String(route.query.ids ?? '').split(',').filter(Boolean))

const items = computed(() => {
  return ids.value
    .map(id => store.getReciboById(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map(recibo => {
      const valorRecibo = recibo.amount ?? 0
      const comision = calcComision(valorRecibo, auth.user?.plan)
      return { recibo, valorRecibo, comision, total: valorRecibo + comision }
    })
})

const commissionTotal = computed(() => items.value.reduce((s, i) => s + i.comision, 0))
const totalSinRedondeo = computed(() => items.value.reduce((s, i) => s + i.total, 0))
const total = computed(() => roundUpToHundred(totalSinRedondeo.value))
const redondeo = computed(() => total.value - totalSinRedondeo.value)

const nequiNumber  = ref<string | null>(null)
const nequiTitular = ref<string | null>(null)
const llaveValue   = ref<string | null>(null)
const llaveTitular = ref<string | null>(null)

onMounted(async () => {
  if (ids.value.some(id => !store.getReciboById(id))) {
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
    await store.requestPaymentMultiple(
      items.value.map(i => ({ id: i.recibo.id, valorRecibo: i.valorRecibo, comision: i.comision })),
      uploadedFile.value,
    )
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

    <div v-if="items.length === 0" class="flex-1 flex items-center justify-center">
      <p class="text-slate-400">No hay recibos seleccionados</p>
    </div>

    <div v-else-if="!submitted" class="flex-1 overflow-y-auto px-4 pb-8">
      <div class="card mb-4">
        <h3 class="font-bold text-slate-800 mb-3">{{ items.length }} recibo{{ items.length !== 1 ? 's' : '' }} seleccionado{{ items.length !== 1 ? 's' : '' }}</h3>

        <div class="flex flex-col gap-2 mb-3">
          <div
            v-for="i in items"
            :key="i.recibo.id"
            class="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0"
          >
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0', store.serviceColors[i.recibo.serviceType]]">
              {{ store.serviceIcons[i.recibo.serviceType] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-800 text-sm truncate">{{ i.recibo.company }}</p>
              <p v-if="i.comision > 0" class="text-xs text-warning-600">+ {{ formatCurrency(i.comision) }} cargo 4x1000</p>
            </div>
            <p class="font-semibold text-slate-800 text-sm shrink-0">{{ formatCurrency(i.total) }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-slate-50">
            <span class="text-sm text-slate-600">Subtotal recibos</span>
            <span class="font-semibold text-slate-800">{{ formatCurrency(totalSinRedondeo - commissionTotal) }}</span>
          </div>
          <div v-if="commissionTotal > 0" class="flex justify-between items-center py-2 border-b border-slate-50">
            <div class="flex items-center gap-1.5">
              <span class="text-sm text-slate-600">Cargo adicional (4x1000)</span>
              <Info class="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span class="font-semibold text-slate-800">{{ formatCurrency(commissionTotal) }}</span>
          </div>
          <div v-if="redondeo > 0" class="flex justify-between items-center py-2 border-b border-slate-50">
            <span class="text-sm text-slate-600">Redondeo</span>
            <span class="font-semibold text-slate-800">{{ formatCurrency(redondeo) }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="font-bold text-slate-800">Total a pagar</span>
            <span class="text-xl font-black text-primary-600">{{ formatCurrency(total) }}</span>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <h3 class="font-bold text-slate-800 mb-1">Paga por Nequi</h3>
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
        <p class="text-xs text-slate-500 mb-4">Adjunta el pantallazo del pago único que cubre todos los recibos seleccionados</p>

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
        <p class="text-slate-500 mt-2 text-sm">Tu solicitud de pago de {{ items.length }} recibo{{ items.length !== 1 ? 's' : '' }} fue recibida. Te notificaremos cuando sea procesada.</p>
      </div>
      <AppButton @click="router.replace('/dashboard')" class="mt-4">
        Volver al inicio
      </AppButton>
    </div>

    <ConfirmationModal
      :open="showConfirm"
      title="Confirmar solicitud"
      :message="`Se solicitará el pago de ${formatCurrency(total)} para ${items.length} recibo${items.length !== 1 ? 's' : ''}, incluida la comisión del servicio.`"
      confirm-label="Confirmar pago"
      :loading="loading"
      @confirm="confirmPayment"
      @cancel="showConfirm = false"
    />
  </div>
</template>
