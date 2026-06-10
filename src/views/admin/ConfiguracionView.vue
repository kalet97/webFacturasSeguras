<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings, Save, AlertCircle, CheckCircle, RefreshCw, Pencil, X } from 'lucide-vue-next'
import { api } from '@/services/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

const adminAuth = useAdminAuthStore()

interface Parametro {
  idParametroGeneral: number
  nombre: string
  observacion: string | null
  valor: string
}

const parametros    = ref<Parametro[]>([])
const loading       = ref(false)
const error         = ref('')

// Estado de edición por parámetro
const editing       = ref<Record<number, string>>({})   // id → valor temporal
const saving        = ref<Record<number, boolean>>({})
const saved         = ref<Record<number, boolean>>({})
const saveError     = ref<Record<number, string>>({})

async function fetchParametros() {
  loading.value = true
  error.value   = ''
  try {
    parametros.value = await api.get<Parametro[]>('/parametros-generales', adminAuth.token)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al cargar los parámetros'
  } finally {
    loading.value = false
  }
}

function startEdit(p: Parametro) {
  editing.value  = { ...editing.value,   [p.idParametroGeneral]: p.valor }
  saveError.value = { ...saveError.value, [p.idParametroGeneral]: '' }
  saved.value     = { ...saved.value,     [p.idParametroGeneral]: false }
}

function cancelEdit(id: number) {
  const e = { ...editing.value }
  delete e[id]
  editing.value = e
}

function isEditing(id: number) {
  return id in editing.value
}

async function saveParametro(p: Parametro) {
  const nuevoValor = editing.value[p.idParametroGeneral]?.trim()
  if (!nuevoValor) return
  saving.value  = { ...saving.value,  [p.idParametroGeneral]: true }
  saveError.value = { ...saveError.value, [p.idParametroGeneral]: '' }
  try {
    const updated = await api.put<Parametro>(
      `/parametros-generales/${p.nombre}`,
      { valor: nuevoValor },
      adminAuth.token,
    )
    const idx = parametros.value.findIndex(x => x.idParametroGeneral === p.idParametroGeneral)
    if (idx !== -1) parametros.value[idx] = updated
    cancelEdit(p.idParametroGeneral)
    saved.value = { ...saved.value, [p.idParametroGeneral]: true }
    setTimeout(() => {
      saved.value = { ...saved.value, [p.idParametroGeneral]: false }
    }, 2500)
  } catch (e: unknown) {
    saveError.value = { ...saveError.value, [p.idParametroGeneral]: e instanceof Error ? e.message : 'Error al guardar' }
  } finally {
    saving.value = { ...saving.value, [p.idParametroGeneral]: false }
  }
}

const TEXTAREA_PARAMS = new Set(['mensajeWhatsapp'])

const WHATSAPP_VARS = ['{nombre}', '{empresa}', '{servicio}', '{monto}', '{fechaMaxima}', '{diasRestantes}']

// Etiquetas legibles por nombre de parámetro
const labels: Record<string, { label: string; icon: string }> = {
  nequi:             { label: 'Número Nequi',                        icon: '💸' },
  nequiTitular:      { label: 'Titular de la cuenta Nequi',          icon: '👤' },
  consecutivoEPM:    { label: 'Consecutivo de energía (EPM)',        icon: '⚡' },
  indicativoEPM:     { label: 'Indicativo EPM (prefijo código barras)', icon: '🔢' },
  diasNotificacion:  { label: 'Días de anticipación para notificar', icon: '🔔' },
  mensajeWhatsapp:   { label: 'Mensaje de WhatsApp (recordatorio)',  icon: '💬' },
}

function getLabel(nombre: string) {
  return labels[nombre]?.label ?? nombre
}
function getIcon(nombre: string) {
  return labels[nombre]?.icon ?? '⚙️'
}

onMounted(fetchParametros)
</script>

<template>
  <div class="p-6 lg:p-8 mx-4 max-w-2xl">

    <!-- Encabezado -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Settings class="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800">Configuración</h2>
          <p class="text-slate-500 text-sm mt-0.5">Parámetros generales del sistema</p>
        </div>
      </div>
      <button
        @click="fetchParametros"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
      >
        <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
        Actualizar
      </button>
    </div>

    <!-- Error global -->
    <div v-if="error" class="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-xl px-4 py-3 mb-5">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ error }}
    </div>

    <!-- Skeleton loader -->
    <div v-if="loading" class="flex flex-col gap-4">
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
        <div class="h-4 bg-slate-100 rounded-lg w-1/3 mb-3" />
        <div class="h-10 bg-slate-100 rounded-xl" />
      </div>
    </div>

    <!-- Lista de parámetros -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="p in parametros"
        :key="p.idParametroGeneral"
        class="bg-white rounded-2xl border border-slate-200 p-5 transition-shadow hover:shadow-sm"
      >
        <!-- Header del parámetro -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2.5">
            <span class="text-xl leading-none">{{ getIcon(p.nombre) }}</span>
            <div>
              <p class="font-semibold text-slate-800 text-sm">{{ getLabel(p.nombre) }}</p>
              <p v-if="p.observacion" class="text-xs text-slate-400 mt-0.5 leading-snug max-w-xs">{{ p.observacion }}</p>
            </div>
          </div>
          <!-- Botón editar / guardar OK -->
          <div class="flex items-center gap-2 shrink-0 ml-3">
            <Transition name="fade-check">
              <CheckCircle v-if="saved[p.idParametroGeneral]" class="w-5 h-5 text-success" />
            </Transition>
            <button
              v-if="!isEditing(p.idParametroGeneral)"
              @click="startEdit(p)"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-200 rounded-xl transition"
            >
              <Pencil class="w-3.5 h-3.5" />
              Editar
            </button>
          </div>
        </div>

        <!-- Valor (lectura) -->
        <div v-if="!isEditing(p.idParametroGeneral)" class="bg-slate-50 rounded-xl px-4 py-3">
          <p class="text-sm font-mono font-medium text-slate-700 break-all">{{ p.valor }}</p>
        </div>

        <!-- Valor (edición) -->
        <div v-else class="flex flex-col gap-2">
          <textarea
            v-if="TEXTAREA_PARAMS.has(p.nombre)"
            v-model="editing[p.idParametroGeneral]"
            rows="4"
            class="w-full px-4 py-3 border border-primary-300 rounded-xl text-sm font-mono text-slate-800
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
            @keyup.escape="cancelEdit(p.idParametroGeneral)"
            autofocus
          />
          <input
            v-else
            v-model="editing[p.idParametroGeneral]"
            type="text"
            class="w-full px-4 py-3 border border-primary-300 rounded-xl text-sm font-mono text-slate-800
                   focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            @keyup.enter="saveParametro(p)"
            @keyup.escape="cancelEdit(p.idParametroGeneral)"
            autofocus
          />
          <div v-if="p.nombre === 'mensajeWhatsapp'" class="flex flex-wrap gap-1.5">
            <span
              v-for="v in WHATSAPP_VARS" :key="v"
              class="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg cursor-pointer hover:bg-primary-50 hover:text-primary-600 transition"
              :title="`Insertar ${v}`"
              @click="editing[p.idParametroGeneral] += v"
            >{{ v }}</span>
          </div>

          <div v-if="saveError[p.idParametroGeneral]" class="flex items-center gap-2 text-xs text-danger bg-danger-50 rounded-xl px-3 py-2">
            <AlertCircle class="w-3.5 h-3.5 shrink-0" /> {{ saveError[p.idParametroGeneral] }}
          </div>

          <div class="flex gap-2">
            <button
              @click="cancelEdit(p.idParametroGeneral)"
              :disabled="saving[p.idParametroGeneral]"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
            >
              <X class="w-3.5 h-3.5" />
              Cancelar
            </button>
            <button
              @click="saveParametro(p)"
              :disabled="saving[p.idParametroGeneral] || !editing[p.idParametroGeneral]?.trim()"
              class="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-50 flex-1 justify-center"
            >
              <svg v-if="saving[p.idParametroGeneral]" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <Save v-else class="w-3.5 h-3.5" />
              {{ saving[p.idParametroGeneral] ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <p v-if="!loading && parametros.length === 0" class="text-center text-sm text-slate-400 py-10">
        Sin parámetros configurados
      </p>
    </div>
  </div>
</template>

<style scoped>
.fade-check-enter-active,
.fade-check-leave-active { transition: opacity 0.3s ease; }
.fade-check-enter-from,
.fade-check-leave-to     { opacity: 0; }
</style>
