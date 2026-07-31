<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

defineProps<{ src: string | null }>()
const emit = defineEmits<{ close: [] }>()

const zoom       = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const isPinching = ref(false)

const MIN_ZOOM = 1
const MAX_ZOOM = 4

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function resetZoom() {
  zoom.value = 1
  translateX.value = 0
  translateY.value = 0
}

function clampTranslate() {
  const maxX = (window.innerWidth * (zoom.value - 1)) / 2 + 60
  const maxY = (window.innerHeight * (zoom.value - 1)) / 2 + 60
  translateX.value = clamp(translateX.value, -maxX, maxX)
  translateY.value = clamp(translateY.value, -maxY, maxY)
}

function close() {
  resetZoom()
  emit('close')
}

function toggleZoom() {
  if (zoom.value > 1) {
    resetZoom()
  } else {
    zoom.value = 2.5
    translateX.value = 0
    translateY.value = 0
  }
}

// --- Touch: pinch-to-zoom + drag-to-pan ---
let pinchStartDistance = 0
let pinchStartZoom     = 1
let dragOrigin         = { x: 0, y: 0 }
let lastTapTime        = 0

function touchDistance(t1: Touch, t2: Touch) {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.hypot(dx, dy)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    isPinching.value = true
    pinchStartDistance = touchDistance(e.touches[0], e.touches[1])
    pinchStartZoom = zoom.value
  } else if (e.touches.length === 1) {
    const now = Date.now()
    if (now - lastTapTime < 300) {
      lastTapTime = 0
      toggleZoom()
      return
    }
    lastTapTime = now
    if (zoom.value > 1) {
      isDragging.value = true
      dragOrigin = { x: e.touches[0].clientX - translateX.value, y: e.touches[0].clientY - translateY.value }
    }
  }
}

function onTouchMove(e: TouchEvent) {
  if (isPinching.value && e.touches.length === 2) {
    e.preventDefault()
    const dist = touchDistance(e.touches[0], e.touches[1])
    zoom.value = clamp(pinchStartZoom * (dist / pinchStartDistance), MIN_ZOOM, MAX_ZOOM)
  } else if (isDragging.value && e.touches.length === 1) {
    e.preventDefault()
    translateX.value = e.touches[0].clientX - dragOrigin.x
    translateY.value = e.touches[0].clientY - dragOrigin.y
  }
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) isPinching.value = false
  if (e.touches.length === 0) {
    isDragging.value = false
    if (zoom.value <= 1) resetZoom()
    else clampTranslate()
  }
}

// --- Desktop: wheel-to-zoom + drag-to-pan + double-click ---
function onWheel(e: WheelEvent) {
  const delta = -e.deltaY * 0.01
  zoom.value = clamp(zoom.value + delta, MIN_ZOOM, MAX_ZOOM)
  if (zoom.value <= 1) resetZoom()
  else clampTranslate()
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  translateX.value = e.clientX - dragOrigin.x
  translateY.value = e.clientY - dragOrigin.y
}

function onMouseUp() {
  isDragging.value = false
  clampTranslate()
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function onMouseDown(e: MouseEvent) {
  if (zoom.value <= 1) return
  isDragging.value = true
  dragOrigin = { x: e.clientX - translateX.value, y: e.clientY - translateY.value }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div
        v-if="src"
        class="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center overflow-hidden touch-none"
        @click="close"
      >
        <button
          class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition"
          @click.stop="close"
        >
          <X class="w-5 h-5 text-white" />
        </button>
        <img
          :src="src"
          class="max-w-full max-h-full object-contain p-4 select-none touch-none"
          :style="{
            transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
            transition: isDragging || isPinching ? 'none' : 'transform 0.2s ease',
            cursor: zoom > 1 ? 'grab' : 'zoom-in',
          }"
          alt="Vista ampliada"
          draggable="false"
          @click.stop
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @mousedown.stop="onMouseDown"
          @dblclick.stop="toggleZoom"
          @wheel.stop.prevent="onWheel"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}
.lightbox-enter-active img,
.lightbox-leave-active img {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
.lightbox-enter-from img {
  transform: scale(0.92);
  opacity: 0;
}
</style>
