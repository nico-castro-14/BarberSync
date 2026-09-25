// Service Worker de BarberSync PRO — PWA instalable.
// Estrategia network-first: siempre intenta la red (así el contenido nunca
// queda viejo en modo dev) y solo usa caché cuando no hay conexión.
const CACHE_NAME = 'barbersync-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guarda en caché solo respuestas válidas (fallback offline)
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        // Offline sin caché: si es navegación, intenta devolver la home cacheada
        if (request.mode === 'navigate') return caches.match('/')
        throw new Error('offline')
      }),
  )
})
