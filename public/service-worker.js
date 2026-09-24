// Service worker de la app de Cumplimiento de Funciones.
//
// Estrategia:
//  - Navegación (HTML): network-first, con fallback a index.html en caché
//    (para que la app abra offline después de haberse cargado una vez).
//  - Resto de peticiones GET del mismo origen (JS, CSS, iconos, manifest):
//    cache-first, guardando en caché lo que se vaya pidiendo (runtime
//    caching), lo que evita tener que conocer los nombres con hash que
//    genera el build de Vite.
//
// No cachea peticiones a otros orígenes ni métodos distintos de GET.

const CACHE_VERSION = 'v1'
const CACHE_NAME = `cumplimiento-cache-${CACHE_VERSION}`

// self.registration.scope respeta el subdirectorio en el que se despliegue
// la app (p. ej. https://usuario.github.io/app-cumplimiento/).
const SCOPE_URL = self.registration ? self.registration.scope : self.location.href
const APP_SHELL = [SCOPE_URL, `${SCOPE_URL}index.html`, `${SCOPE_URL}manifest.json`]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // Si alguno de estos recursos aún no existe (p. ej. en dev), no
        // rompemos la instalación del service worker por eso.
      }),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

function esNavegacion(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (esNavegacion(request)) {
    event.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(`${SCOPE_URL}index.html`, copia))
          return respuesta
        })
        .catch(() => caches.match(`${SCOPE_URL}index.html`)),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cacheada) => {
      if (cacheada) return cacheada
      return fetch(request)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia))
          }
          return respuesta
        })
        .catch(() => cacheada)
    }),
  )
})
