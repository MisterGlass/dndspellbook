const CACHE = 'spellbook-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url)
  if (u.origin !== location.origin || e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (!r.ok || r.type === 'error') return r
        const clone = r.clone()
        caches.open(CACHE).then((cache) => cache.put(e.request, clone))
        return r
      })
      .catch(() => caches.match(e.request))
  )
})
