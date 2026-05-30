<script setup lang="ts">
interface Props {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'default',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.open"
        class="fixed inset-0 z-[100] flex items-end justify-center"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="emit('cancel')"
        />

        <div class="relative w-full max-w-[390px] bg-white rounded-t-3xl p-6 shadow-2xl">
          <div class="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

          <h3 class="text-lg font-bold text-slate-800 text-center">{{ props.title }}</h3>
          <p v-if="props.message" class="text-sm text-slate-500 text-center mt-2">{{ props.message }}</p>

          <div class="flex gap-3 mt-6">
            <button
              @click="emit('cancel')"
              class="flex-1 py-3.5 bg-slate-100 text-slate-700 font-semibold rounded-card transition-colors hover:bg-slate-200 active:scale-[0.98]"
            >
              {{ props.cancelLabel }}
            </button>
            <button
              @click="emit('confirm')"
              :disabled="props.loading"
              :class="[
                'flex-1 py-3.5 font-semibold rounded-card transition-all active:scale-[0.98] disabled:opacity-60',
                props.variant === 'danger'
                  ? 'bg-danger text-white'
                  : 'bg-primary-600 text-white',
              ]"
            >
              {{ props.loading ? 'Procesando...' : props.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative, .modal-leave-active .relative {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: translateY(100%);
}
</style>
