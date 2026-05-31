<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  show: boolean
  title: string
  saving?: boolean
  wide?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

        <div
          :class="[
            'relative bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] w-full',
            wide ? 'max-w-2xl' : 'max-w-md',
          ]"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <h3 class="font-semibold text-slate-800">{{ title }}</h3>
            <button
              @click="emit('close')"
              class="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="emit('submit')"
              :disabled="saving"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700
                     disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition flex items-center gap-2"
            >
              <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
