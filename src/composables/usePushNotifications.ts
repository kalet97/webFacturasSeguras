import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

function toSubscriptionPayload(subscription: PushSubscription) {
  const json = subscription.toJSON()
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  }
}

export function usePushNotifications() {
  const auth = useAuthStore()

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
  const isSubscribed = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function refreshStatus() {
    if (!isSupported) return
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    isSubscribed.value = subscription !== null
  }

  async function subscribe() {
    if (!isSupported || !auth.user) return

    isLoading.value = true
    error.value = null

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        error.value = 'Debes permitir las notificaciones para activarlas.'
        return
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }

      await api.post('/push/suscripciones', {
        idCliente: auth.user.idCliente,
        ...toSubscriptionPayload(subscription),
      }, auth.token)

      isSubscribed.value = true
    } catch {
      error.value = 'No se pudo activar las notificaciones. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  async function unsubscribe() {
    if (!isSupported || !auth.user) return

    isLoading.value = true
    error.value = null

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await api.delete('/push/suscripciones', {
          idCliente: auth.user.idCliente,
          endpoint: subscription.endpoint,
        }, auth.token)

        await subscription.unsubscribe()
      }

      isSubscribed.value = false
    } catch {
      error.value = 'No se pudo desactivar las notificaciones. Intenta de nuevo.'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(refreshStatus)

  return { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe }
}
