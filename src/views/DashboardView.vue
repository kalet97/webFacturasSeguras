<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Bell, TrendingDown, X, Check, ArrowUp, CalendarClock, RefreshCw } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useRecibosStore } from '@/stores/recibos'
import { api } from '@/services/api'
import type { PlanInfo } from '@/stores/auth'
import ReciboCard from '@/components/ReciboCard.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'

const router = useRouter()
const auth = useAuthStore()
const store = useRecibosStore()

const whatsappNumber    = ref('')
const deudaPendiente    = ref(0)
const showLimitModal    = ref(false)
const todosLosPlanes    = ref<PlanInfo[]>([])
const refreshing        = ref(false)

const planesUpgrade = computed(() => {
  const idActual = auth.user?.plan?.idPlan ?? 0
  return todosLosPlanes.value.filter(p => p.idPlan > idActual)
})

const planLimiteAlcanzado = computed(() => {
  const plan = auth.user?.plan
  if (!plan || plan.maxFacturas === null) return false
  return store.recibos.length >= plan.maxFacturas
})

function handleAddRecibo() {
  if (planLimiteAlcanzado.value) {
    showLimitModal.value = true
  } else {
    router.push('/recibos/add')
  }
}

async function fetchDeuda() {
  if (!auth.user) return
  try {
    const pagos = await api.get<{ precio: number }[]>(
      `/historial-pago-notificaciones?idCliente=${auth.user.idCliente}&pagado=0`,
      auth.token,
    )
    deudaPendiente.value = pagos.reduce((sum, p) => sum + (p.precio ?? 0), 0)
  } catch {}
}

async function fetchPlanes() {
  try {
    todosLosPlanes.value = await api.get<PlanInfo[]>('/planes', auth.token)
  } catch {}
}

async function fetchWhatsapp() {
  try {
    const res = await api.get<{ valor: string }>('/parametros-generales/whatsapp', auth.token)
    whatsappNumber.value = res.valor
  } catch {}
}

async function handleRefresh() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await Promise.all([store.fetchRecibos(), fetchDeuda(), fetchPlanes(), fetchWhatsapp(), auth.refreshUser()])
  } finally {
    refreshing.value = false
  }
}

onMounted(() => { store.fetchRecibos(); fetchDeuda(); fetchPlanes(); fetchWhatsapp(); auth.refreshUser() })

const total = computed(() => store.recibos.length)
const overdue = computed(() => store.recibos.filter(r => r.status === 'overdue').length)
const soon = computed(() => store.recibos.filter(r => r.status === 'soon').length)
const paid = computed(() => store.recibos.filter(r => r.status === 'paid').length)

const totalPending = computed(() =>
  store.recibos
    .filter(r => r.status !== 'paid' && r.amount)
    .reduce((s, r) => s + (r.amount ?? 0), 0)
)

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const sortedRecibos = computed(() => {
  const order = { overdue: 0, soon: 1, processing: 2, reviewing: 3, pending: 4, paid: 5 }
  return [...store.recibos].sort((a, b) => order[a.status] - order[b.status])
})

const diasParaVencerSuscripcion = computed(() => {
  const fecha = auth.user?.fechaProximoPago
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fecha); venc.setHours(0, 0, 0, 0)
  return Math.round((venc.getTime() - hoy.getTime()) / 86400000)
})

const mostrarAvisoSuscripcion = computed(() => {
  const d = diasParaVencerSuscripcion.value
  return d !== null && d <= 5
})
</script>

<template>
  <div class="screen pb-24">
    <div class="bg-primary-600 pt-12 pb-6 px-5">
      <div class="flex items-start justify-between mb-5">
        <div>
          <p class="text-primary-100 text-sm">{{ greeting() }}</p>
          <h2 class="text-white font-bold text-xl mt-0.5">{{ auth.user?.name?.split(' ')[0] }}</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="h-10 px-3 bg-white/20 rounded-xl flex items-center gap-1.5 text-white text-sm font-medium disabled:opacity-60"
            :disabled="refreshing"
            @click="handleRefresh"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': refreshing }" />
            Actualizar
          </button>
          <button class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center relative">
            <Bell class="w-5 h-5 text-white" />
            <span v-if="overdue > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-primary-600" />
          </button>
        </div>
      </div>

      <div class="bg-white/15 rounded-2xl p-4">
        <p class="text-primary-100 text-xs font-medium mb-1">Total por pagar</p>
        <p class="text-white text-2xl font-black">{{ formatCurrency(totalPending) }}</p>
        <div v-if="deudaPendiente > 0" class="flex items-center justify-between mt-2 bg-white/10 rounded-xl px-3 py-2">
          <p class="text-white/80 text-xs">Deuda pendiente por gestión</p>
          <p class="text-white text-sm font-bold">{{ formatCurrency(deudaPendiente) }}</p>
        </div>
        <div class="flex gap-3 mt-3">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 bg-danger rounded-full" />
            <span class="text-white/80 text-xs">{{ overdue }} vencido{{ overdue !== 1 ? 's' : '' }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 bg-warning rounded-full" />
            <span class="text-white/80 text-xs">{{ soon }} próximo{{ soon !== 1 ? 's' : '' }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 bg-success rounded-full" />
            <span class="text-white/80 text-xs">{{ paid }} pagado{{ paid !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-3">
      <div v-if="mostrarAvisoSuscripcion" class="mb-4 bg-warning-50 border border-warning/20 rounded-2xl p-3.5 flex items-center gap-3">
        <div class="w-9 h-9 bg-warning/10 rounded-xl flex items-center justify-center shrink-0">
          <CalendarClock class="w-5 h-5 text-warning-600" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-warning-600">
            <template v-if="diasParaVencerSuscripcion! < 0">Tu suscripción venció</template>
            <template v-else-if="diasParaVencerSuscripcion === 0">Tu suscripción vence hoy</template>
            <template v-else>Tu suscripción vence en {{ diasParaVencerSuscripcion }} día{{ diasParaVencerSuscripcion !== 1 ? 's' : '' }}</template>
          </p>
          <p class="text-xs text-slate-500 mt-0.5">Renueva tu plan para seguir disfrutando del servicio</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="card text-center">
          <p class="text-2xl font-black text-slate-800">{{ total }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Recibos</p>
        </div>
        <div class="card text-center">
          <p class="text-2xl font-black" :class="overdue > 0 ? 'text-danger' : 'text-slate-800'">{{ overdue }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Vencidos</p>
        </div>
        <div class="card text-center">
          <p class="text-2xl font-black text-success">{{ paid }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Pagados</p>
        </div>
      </div>

      <div v-if="overdue > 0" class="mb-4 bg-danger-50 border border-danger/20 rounded-2xl p-3.5 flex items-center gap-3">
        <div class="w-9 h-9 bg-danger/10 rounded-xl flex items-center justify-center shrink-0">
          <TrendingDown class="w-5 h-5 text-danger" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-danger">{{ overdue }} recibo{{ overdue !== 1 ? 's' : '' }} vencido{{ overdue !== 1 ? 's' : '' }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Gestiona tu pago ahora</p>
        </div>
      </div>

      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-slate-800">Mis recibos</h3>
        <button
          @click="handleAddRecibo"
          class="flex items-center gap-1.5 text-primary-600 text-sm font-medium"
        >
          <Plus class="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div class="flex flex-col gap-3 mb-4">
        <ReciboCard v-for="r in sortedRecibos" :key="r.id" :recibo="r" />
      </div>

      <div v-if="store.recibos.length === 0" class="card text-center py-10">
        <p class="text-4xl mb-3">📄</p>
        <p class="font-semibold text-slate-700">Sin recibos registrados</p>
        <p class="text-sm text-slate-500 mt-1">Agrega tu primer recibo para empezar</p>
      </div>
    </div>

    <div v-if="whatsappNumber" class="fixed bottom-20 right-4 z-40">
      <a
        :href="`https://wa.me/${whatsappNumber}`"
        target="_blank"
        rel="noopener noreferrer"
        class="w-14 h-14 bg-[#25D366] rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        title="Contáctanos por WhatsApp"
      >
        <svg viewBox="0 0 24 24" class="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>

    <BottomTabBar />

    <!-- Modal: límite de plan alcanzado -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLimitModal" class="fixed inset-0 z-[100] flex items-end justify-center">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showLimitModal = false" />

          <div class="relative w-full max-w-[390px] bg-white rounded-t-3xl shadow-2xl">
            <div class="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-4" />

            <!-- Cabecera -->
            <div class="flex items-start justify-between px-6 pt-5 pb-1">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-warning-50 rounded-2xl flex items-center justify-center shrink-0">
                  <ArrowUp class="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <h3 class="font-bold text-slate-800 text-base">Límite de plan alcanzado</h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Tu plan <strong class="text-slate-700">{{ auth.user?.plan?.nombre }}</strong>
                    permite hasta {{ auth.user?.plan?.maxFacturas }} facturas
                  </p>
                </div>
              </div>
              <button @click="showLimitModal = false" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                <X class="w-4 h-4" />
              </button>
            </div>

            <p class="text-sm text-slate-500 px-6 pt-3 pb-4">
              Para agregar más facturas, actualiza tu plan. Elige una de las siguientes opciones:
            </p>

            <!-- Planes de upgrade -->
            <div class="px-6 pb-6 flex flex-col gap-3">
              <button
                v-for="plan in planesUpgrade"
                :key="plan.idPlan"
                class="w-full text-left rounded-2xl border-2 border-primary-200 bg-primary-50 px-4 py-3.5 hover:border-primary-400 hover:bg-primary-100 transition-all active:scale-[0.98]"
                @click="showLimitModal = false"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-bold text-slate-800 text-sm">{{ plan.nombre }}</p>
                    <ul class="mt-1.5 space-y-0.5">
                      <li class="flex items-center gap-1.5 text-xs text-slate-600">
                        <Check class="w-3 h-3 text-success shrink-0" />
                        {{ plan.maxFacturas ? `Hasta ${plan.maxFacturas} facturas` : 'Facturas ilimitadas' }}
                      </li>
                      <li class="flex items-center gap-1.5 text-xs text-slate-600">
                        <Check class="w-3 h-3 text-success shrink-0" />
                        Tope ${{ plan.maxPrecioPorFactura.toLocaleString('es-CO') }} por factura
                      </li>
                    </ul>
                  </div>
                  <div class="text-right shrink-0 ml-3">
                    <p class="font-black text-primary-600 text-lg leading-none">${{ plan.precio.toLocaleString('es-CO') }}</p>
                    <p class="text-xs text-slate-400 mt-0.5">/mes</p>
                  </div>
                </div>
              </button>

              <p class="text-center text-xs text-slate-400 pt-1">
                Contacta a tu asesor o escríbenos por WhatsApp para cambiar de plan
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .relative, .modal-leave-active .relative { transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative { transform: translateY(100%); }
</style>
