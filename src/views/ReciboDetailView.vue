<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MapPin, Hash, Calendar, Edit2, CreditCard, Check, X, ArrowUpFromLine, Clock, ZoomIn, ChevronDown } from 'lucide-vue-next'
import { useRecibosStore } from '@/stores/recibos'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import AppHeader from '@/components/AppHeader.vue'
import PaymentStatus from '@/components/PaymentStatus.vue'
import AppButton from '@/components/AppButton.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'

const route  = useRoute()
const router = useRouter()
const store  = useRecibosStore()
const auth   = useAuthStore()

const id     = route.params.id as string
const recibo = computed(() => store.getReciboById(id))

interface Transaccion {
  idHistorialPagoRecibo: number
  valorRecibo: number
  comision: number | null
  valorTotal: number
  pagado: number
  fechaSolicitud: string | null
  fechaPago: string | null
  idUsuario: number | null
  urlComprobante: string | null
  urlComprobanteRecibo: string | null
}

const transacciones     = ref<Transaccion[]>([])
const loadingTransacc   = ref(false)
const historialOpen     = ref(false)
const expandedTransacc  = ref<number | null>(null)

onMounted(async () => {
  loadingTransacc.value = true
  try {
    transacciones.value = await api.get<Transaccion[]>(
      `/historial-pago-recibos?idRecibo=${id}`,
      auth.token,
    )
    expandedTransacc.value = transacciones.value[0]?.idHistorialPagoRecibo ?? null
  } finally {
    loadingTransacc.value = false
  }
})

function toggleHistorial() {
  historialOpen.value = !historialOpen.value
}

function toggleTransaccion(idHistorialPagoRecibo: number) {
  expandedTransacc.value = expandedTransacc.value === idHistorialPagoRecibo ? null : idHistorialPagoRecibo
}

const showPayModal  = ref(false)
const markingPaid   = ref(false)
const editingName   = ref(false)

const lightboxSrc = ref<string | null>(null)

function openLightbox(url: string) {
  lightboxSrc.value = url
}
function closeLightbox() { lightboxSrc.value = null }

const nameInput     = ref('')
const savingName    = ref(false)

function startEditName() {
  nameInput.value = recibo.value!.company
  editingName.value = true
}

function cancelEditName() {
  editingName.value = false
  nameInput.value = ''
}

async function saveEditName() {
  const trimmed = nameInput.value.trim()
  if (!trimmed || trimmed === recibo.value!.company) { cancelEditName(); return }
  savingName.value = true
  try {
    await store.renameRecibo(id, trimmed)
    editingName.value = false
  } finally {
    savingName.value = false
  }
}

function formatCurrency(v?: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

function formatDate(d: string) {
  return new Date(d.replace(' ', 'T')).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function handleMarkPaid() {
  markingPaid.value = true
  try {
    await store.markAsPaid(id)
    showPayModal.value = false
    router.back()
  } finally {
    markingPaid.value = false
  }
}
</script>

<template>
  <div v-if="recibo" class="screen">
    <AppHeader :title="editingName ? 'Editar nombre' : recibo.company" :show-menu="true" />

    <div class="flex-1 overflow-y-auto px-4 pb-8">
      <div class="card mb-4">
        <div class="flex items-center gap-3 mb-4">
          <div
            :class="['w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0', store.serviceColors[recibo.serviceType]]"
          >
            {{ store.serviceIcons[recibo.serviceType] }}
          </div>
          <div class="flex-1 min-w-0">
            <!-- Modo edición -->
            <div v-if="editingName" class="flex items-center gap-1.5">
              <input
                v-model="nameInput"
                type="text"
                class="input-field py-1.5 text-base font-bold flex-1 min-w-0"
                @keyup.enter="saveEditName"
                @keyup.escape="cancelEditName"
                autofocus
              />
              <button @click="saveEditName" :disabled="savingName"
                class="w-8 h-8 bg-success rounded-xl flex items-center justify-center shrink-0">
                <Check class="w-4 h-4 text-white" />
              </button>
              <button @click="cancelEditName"
                class="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                <X class="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <!-- Modo lectura -->
            <div v-else class="flex items-center gap-1.5">
              <h2 class="font-bold text-slate-800 text-lg truncate">{{ recibo.company }}</h2>
              <button @click="startEditName" class="shrink-0 text-slate-400 hover:text-primary-600 transition-colors">
                <Edit2 class="w-4 h-4" />
              </button>
            </div>
            <p class="text-sm text-slate-500">{{ store.serviceLabels[recibo.serviceType] }}</p>
          </div>
          <div class="ml-auto">
            <PaymentStatus :status="recibo.status" />
          </div>
        </div>

        <div class="bg-slate-50 rounded-2xl p-4 mb-4">
          <p class="text-xs text-slate-400 mb-1">Valor del recibo</p>
          <p class="text-2xl font-black text-slate-800">{{ formatCurrency(recibo.amount) }}</p>
          <p v-if="recibo.surcharge" class="text-xs text-warning-600 font-medium mt-1">
            + {{ formatCurrency(recibo.surcharge) }} cargo adicional 4x1000
          </p>
          <p
            v-if="recibo.status !== 'paid'"
            :class="[
              'text-sm font-medium mt-1',
              recibo.daysLeft < 0 ? 'text-danger' :
              recibo.daysLeft <= 5 ? 'text-warning-600' : 'text-slate-500'
            ]"
          >
            {{
              recibo.daysLeft < 0 ? `Venció hace ${Math.abs(recibo.daysLeft)} día${Math.abs(recibo.daysLeft) !== 1 ? 's' : ''}` :
              recibo.daysLeft === 0 ? 'Vence hoy' :
              `Vence en ${recibo.daysLeft} días`
            }}
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <Hash class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p class="text-xs text-slate-400">Código de factura</p>
              <p class="text-sm font-medium text-slate-700">{{ recibo.clientNumber }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <Calendar class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p class="text-xs text-slate-400">Fecha límite</p>
              <p class="text-sm font-medium text-slate-700">{{ formatDate(recibo.dueDate) }}</p>
            </div>
          </div>

          <div v-if="recibo.address" class="flex items-start gap-3">
            <div class="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <MapPin class="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p class="text-xs text-slate-400">Dirección</p>
              <p class="text-sm font-medium text-slate-700">{{ recibo.address }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <button type="button" class="w-full flex items-center justify-between gap-2" @click="toggleHistorial">
          <h3 class="font-bold text-slate-800">Historial de transacciones</h3>
          <ChevronDown :class="['w-5 h-5 text-slate-400 transition-transform duration-200', historialOpen ? 'rotate-180' : '']" />
        </button>

        <div
          class="grid transition-[grid-template-rows] duration-300 ease-in-out"
          :class="historialOpen ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden">
            <div v-if="loadingTransacc" class="flex justify-center py-6">
              <div class="w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>

            <div v-else-if="transacciones.length === 0" class="text-center py-6">
              <p class="text-sm text-slate-400">Sin transacciones registradas</p>
            </div>

            <div v-else class="flex flex-col gap-4">
              <div
                v-for="(t, i) in transacciones"
                :key="t.idHistorialPagoRecibo"
                class="flex gap-3 relative"
              >
                <!-- Línea conectora -->
                <div class="flex flex-col items-center shrink-0">
                  <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', t.pagado ? 'bg-success-50' : 'bg-violet-50']">
                    <component :is="t.pagado ? ArrowUpFromLine : Clock" :class="['w-4 h-4', t.pagado ? 'text-success' : 'text-violet-500']" />
                  </div>
                  <div v-if="i < transacciones.length - 1" class="w-px flex-1 bg-slate-100 mt-1 min-h-[16px]" />
                </div>

                <div class="flex-1 pb-1">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between gap-2 text-left"
                    @click="toggleTransaccion(t.idHistorialPagoRecibo)"
                  >
                    <span class="flex items-center gap-1.5 min-w-0">
                      <p class="text-sm font-semibold text-slate-800 truncate">
                        {{ t.idUsuario === null ? 'Pago directo' : 'Pago por encargo' }}
                      </p>
                      <span :class="['shrink-0 text-xs font-medium px-2 py-0.5 rounded-full', t.pagado ? 'bg-success-50 text-success-600' : 'bg-violet-50 text-violet-600']">
                        {{ t.pagado ? 'Completado' : 'En trámite' }}
                      </span>
                    </span>
                    <span class="flex items-center gap-1.5 shrink-0">
                      <span class="text-xs font-semibold text-slate-600">{{ formatCurrency(t.valorTotal || t.valorRecibo) }}</span>
                      <ChevronDown
                        :class="['w-4 h-4 text-slate-400 transition-transform duration-200', expandedTransacc === t.idHistorialPagoRecibo ? 'rotate-180' : '']"
                      />
                    </span>
                  </button>

                  <div
                    class="grid transition-[grid-template-rows] duration-300 ease-in-out"
                    :class="expandedTransacc === t.idHistorialPagoRecibo ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                  >
                    <div class="overflow-hidden">
                      <div class="mt-1.5 bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                        <div class="flex justify-between text-xs">
                          <span class="text-slate-400">Valor recibo</span>
                          <span class="font-medium text-slate-700">{{ formatCurrency(t.valorRecibo) }}</span>
                        </div>
                        <template v-if="t.comision">
                          <div class="flex justify-between text-xs">
                            <span class="text-slate-400">Comisión</span>
                            <span class="font-medium text-slate-700">{{ formatCurrency(t.comision) }}</span>
                          </div>
                          <div class="flex justify-between text-xs border-t border-slate-100 pt-1">
                            <span class="text-slate-500 font-medium">Total</span>
                            <span class="font-bold text-slate-800">{{ formatCurrency(t.valorTotal) }}</span>
                          </div>
                        </template>
                      </div>

                      <p class="text-xs text-slate-400 mt-1.5">
                        Solicitado: {{ t.fechaSolicitud ? formatDate(t.fechaSolicitud) : '—' }}
                        <template v-if="t.pagado && t.fechaPago">
                          · Pagado: {{ formatDate(t.fechaPago) }}
                        </template>
                      </p>

                      <!-- Soportes de pago -->
                      <div v-if="t.urlComprobante || t.urlComprobanteRecibo" class="flex gap-2.5 mt-3">
                        <!-- Comprobante del cliente (transferencia a Recibo Seguro) -->
                        <div v-if="t.urlComprobante" class="flex flex-col items-center gap-1">
                          <button
                            @click="openLightbox(t.urlComprobante)"
                            class="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 active:scale-95 transition-transform"
                          >
                            <img :src="t.urlComprobante" alt="Comprobante" class="w-full h-full object-cover" />
                            <div class="absolute inset-0 bg-black/0 active:bg-black/10 flex items-center justify-center">
                              <ZoomIn class="w-4 h-4 text-white opacity-0 group-active:opacity-100 drop-shadow" />
                            </div>
                          </button>
                          <span class="text-[10px] text-slate-400 leading-none">Tu pago</span>
                        </div>

                        <!-- Comprobante del admin (recibo de la empresa) -->
                        <div v-if="t.urlComprobanteRecibo" class="flex flex-col items-center gap-1">
                          <button
                            @click="openLightbox(t.urlComprobanteRecibo)"
                            class="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary-200 active:scale-95 transition-transform"
                          >
                            <img :src="t.urlComprobanteRecibo" alt="Soporte de pago" class="w-full h-full object-cover" />
                            <div class="absolute inset-0 bg-black/0 active:bg-black/10" />
                          </button>
                          <span class="text-[10px] text-primary-500 leading-none font-medium">Soporte</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3" v-if="recibo.status !== 'paid' && recibo.status !== 'processing' && recibo.status !== 'reviewing'">
        <AppButton @click="router.push(`/recibos/${id}/payment`)">
          <CreditCard class="w-5 h-5" />
          Solicitar pago por encargo
        </AppButton>
        <AppButton variant="secondary" @click="showPayModal = true">
          <Edit2 class="w-5 h-5" />
          Marcar como pagado
        </AppButton>
      </div>

      <div v-else-if="recibo.status === 'processing'" class="card text-center py-6 border border-violet-100 bg-violet-50">
        <p class="text-3xl mb-2">⏳</p>
        <p class="font-semibold text-violet-700">Pago en trámite</p>
        <p class="text-sm text-slate-500 mt-1">Recibimos tu pago y estamos pagando<br>la factura al servicio correspondiente</p>
      </div>

      <div v-else-if="recibo.status === 'reviewing'" class="card text-center py-6 border border-amber-100 bg-amber-50">
        <p class="text-3xl mb-2">🔎</p>
        <p class="font-semibold text-amber-700">Pago en revisión</p>
        <p class="text-sm text-slate-500 mt-1">Marcaste este recibo como pagado.<br>Nuestro equipo está verificando el pago con el servicio</p>
      </div>

      <div v-else class="card text-center py-6">
        <p class="text-success text-3xl mb-2">✓</p>
        <p class="font-semibold text-slate-700">Recibo pagado</p>
        <p class="text-sm text-slate-500 mt-1">Este servicio está al día</p>
      </div>
    </div>

    <ConfirmationModal
      :open="showPayModal"
      title="¿Marcar como pagado?"
      message="Esta acción indica que el pago ya fue realizado directamente por ti."
      confirm-label="Sí, está pagado"
      :loading="markingPaid"
      @confirm="handleMarkPaid"
      @cancel="showPayModal = false"
    />
  </div>

  <div v-else class="screen items-center justify-center">
    <p class="text-slate-400">Recibo no encontrado</p>
  </div>

  <ImageLightbox :src="lightboxSrc" @close="closeLightbox" />
</template>
