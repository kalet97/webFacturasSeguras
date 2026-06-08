<script setup lang="ts">
import { X, Clock, Link2 } from 'lucide-vue-next'

export interface TipoNotificacionAdmin {
  idTipoNotificacionAdmin: number
  clave: string
  nombre: string
  icono: string | null
  color: string | null
}

export interface NotificacionAdmin {
  idNotificacionAdmin: number
  idTipoNotificacionAdmin: number
  tablaOrigen: string
  idOrigen: number
  titulo: string
  mensaje: string | null
  leida: number
  fechaNotificacion: string
  tipo: TipoNotificacionAdmin | null
}

interface Props {
  open: boolean
  notificacion: NotificacionAdmin | null
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

function formatFecha(fecha: string) {
  return new Date(fecha.replace(' ', 'T')).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open && notificacion" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5">

          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                :style="{ backgroundColor: (notificacion.tipo?.color ?? '#94a3b8') + '20' }"
              >
                {{ notificacion.tipo?.icono ?? '🔔' }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-slate-800 text-sm truncate">{{ notificacion.titulo }}</p>
                <p class="text-xs text-slate-400 truncate">{{ notificacion.tipo?.nombre ?? 'Notificación' }}</p>
              </div>
            </div>
            <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100 shrink-0">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Mensaje -->
          <p v-if="notificacion.mensaje" class="text-sm text-slate-600 leading-relaxed">
            {{ notificacion.mensaje }}
          </p>

          <!-- Metadata -->
          <div class="flex flex-col gap-2 text-xs text-slate-400 border-t border-slate-100 pt-4">
            <div class="flex items-center gap-2">
              <Clock class="w-3.5 h-3.5 shrink-0" />
              {{ formatFecha(notificacion.fechaNotificacion) }}
            </div>
            <div class="flex items-center gap-2">
              <Link2 class="w-3.5 h-3.5 shrink-0" />
              Origen: {{ notificacion.tablaOrigen }} #{{ notificacion.idOrigen }}
            </div>
          </div>

          <!-- Footer -->
          <button
            @click="emit('close')"
            class="w-full py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cerrar
          </button>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .relative, .modal-leave-active .relative { transition: transform 0.2s ease, opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.96); opacity: 0; }
</style>
