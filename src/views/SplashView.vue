<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  setTimeout(() => {
    router.replace(auth.isAuthenticated ? '/dashboard' : '/login')
  }, 2500)
})
</script>

<template>
  <div class="screen items-center justify-center bg-primary-600 min-h-screen">
    <div class="flex flex-col items-center gap-6 animate-fade-up px-8">
      <div class="relative">
        <div class="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
          <span class="text-4xl font-black text-primary-600">RS</span>
        </div>
        <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-success rounded-xl flex items-center justify-center">
          <span class="text-white text-sm font-bold">✓</span>
        </div>
      </div>

      <div class="text-center">
        <h1 class="text-3xl font-black text-white tracking-tight">Recibo Seguro</h1>
        <p class="text-primary-100 mt-2 text-base font-medium">Nunca vuelvas a olvidar un recibo</p>
      </div>

      <div class="flex gap-1.5 mt-4">
        <span class="w-6 h-1.5 bg-white rounded-full" />
        <span class="w-1.5 h-1.5 bg-primary-300 rounded-full" />
        <span class="w-1.5 h-1.5 bg-primary-300 rounded-full" />
      </div>
    </div>

    <div class="absolute bottom-12 left-1/2 -translate-x-1/2">
      <div class="flex gap-1">
        <span class="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style="animation-delay: 0ms" />
        <span class="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style="animation-delay: 150ms" />
        <span class="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style="animation-delay: 300ms" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-up {
  animation: fade-up 0.6s ease forwards;
}
</style>
