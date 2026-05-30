<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

function transitionName() {
  return String(route.meta.transition || 'fade')
}
</script>

<template>
  <div class="phone-container bg-white shadow-2xl">
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName()" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(-30%);
  opacity: 0;
}
</style>
