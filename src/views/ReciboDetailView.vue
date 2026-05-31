<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MapPin, Hash, Calendar, Edit2, CreditCard, Check, X } from 'lucide-vue-next'
import { useRecibosStore } from '@/stores/recibos'
import AppHeader from '@/components/AppHeader.vue'
import PaymentStatus from '@/components/PaymentStatus.vue'
import ActivityTimeline from '@/components/ActivityTimeline.vue'
import AppButton from '@/components/AppButton.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const route = useRoute()
const router = useRouter()
const store = useRecibosStore()

const id = route.params.id as string
const recibo = computed(() => store.getReciboById(id))

const showPayModal  = ref(false)
const editingName   = ref(false)
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
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function handleMarkPaid() {
  store.updateRecibo(id, { status: 'paid' })
  showPayModal.value = false
  router.back()
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
              <p class="text-xs text-slate-400">Número de cliente</p>
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
        <h3 class="font-bold text-slate-800 mb-4">Historial de actividad</h3>
        <ActivityTimeline :items="recibo.notifications" />
      </div>

      <div class="flex flex-col gap-3" v-if="recibo.status !== 'paid'">
        <AppButton @click="router.push(`/recibos/${id}/payment`)">
          <CreditCard class="w-5 h-5" />
          Solicitar pago por encargo
        </AppButton>
        <AppButton variant="secondary" @click="showPayModal = true">
          <Edit2 class="w-5 h-5" />
          Marcar como pagado
        </AppButton>
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
      @confirm="handleMarkPaid"
      @cancel="showPayModal = false"
    />
  </div>

  <div v-else class="screen items-center justify-center">
    <p class="text-slate-400">Recibo no encontrado</p>
  </div>
</template>
