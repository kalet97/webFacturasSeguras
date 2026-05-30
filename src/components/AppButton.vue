<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: true,
})
</script>

<template>
  <button
    :disabled="props.disabled || props.loading"
    :class="[
      'flex items-center justify-center gap-2 font-semibold rounded-card transition-all duration-150 active:scale-[0.98]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      props.fullWidth ? 'w-full' : 'w-auto',
      {
        'bg-primary-600 text-white shadow-sm hover:bg-primary-700': props.variant === 'primary',
        'bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50': props.variant === 'secondary',
        'text-slate-600 hover:bg-slate-100': props.variant === 'ghost',
        'bg-danger text-white shadow-sm hover:bg-danger-600': props.variant === 'danger',
        'py-2 px-4 text-sm': props.size === 'sm',
        'py-3.5 px-6 text-base': props.size === 'md',
        'py-4 px-8 text-lg': props.size === 'lg',
      }
    ]"
  >
    <Loader2 v-if="props.loading" class="w-5 h-5 animate-spin" />
    <slot v-else />
  </button>
</template>
