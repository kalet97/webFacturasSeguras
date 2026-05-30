<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronLeft, Bell, MoreVertical } from 'lucide-vue-next'

interface Props {
  title?: string
  showBack?: boolean
  showNotification?: boolean
  showMenu?: boolean
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true,
  showNotification: false,
  showMenu: false,
  transparent: false,
})

const emit = defineEmits<{
  menu: []
  notification: []
}>()

const router = useRouter()
</script>

<template>
  <header
    :class="[
      'flex items-center justify-between px-4 py-3 sticky top-0 z-40',
      props.transparent ? 'bg-transparent' : 'bg-white border-b border-slate-100',
    ]"
  >
    <div class="flex items-center gap-2 min-w-[40px]">
      <button
        v-if="props.showBack"
        @click="router.back()"
        class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors -ml-1"
      >
        <ChevronLeft class="w-5 h-5 text-slate-700" />
      </button>
    </div>

    <h1 v-if="props.title" class="text-base font-semibold text-slate-800 absolute left-1/2 -translate-x-1/2">
      {{ props.title }}
    </h1>
    <slot v-else />

    <div class="flex items-center gap-1 min-w-[40px] justify-end">
      <button
        v-if="props.showNotification"
        @click="emit('notification')"
        class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors relative"
      >
        <Bell class="w-5 h-5 text-slate-700" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
      </button>
      <button
        v-if="props.showMenu"
        @click="emit('menu')"
        class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
      >
        <MoreVertical class="w-5 h-5 text-slate-700" />
      </button>
    </div>
  </header>
</template>
