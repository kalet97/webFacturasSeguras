/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  ({ url }) => /^http:\/\/localhost:8080\/api\/.*/i.test(url.href),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title: string
  body: string
  data?: { idRecibo?: number; [key: string]: unknown }
}

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload: PushPayload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Recibo Seguro', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: payload.data ?? {},
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const idRecibo = (event.notification.data as PushPayload['data'])?.idRecibo
  const targetUrl = idRecibo ? `/recibos/${idRecibo}` : '/recibos'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = allClients.find((client) => client.url.includes(targetUrl))

      if (existing) {
        await existing.focus()
        return
      }

      await self.clients.openWindow(targetUrl)
    })(),
  )
})
