// Registra el service worker para que la app funcione offline una vez
// cargada por primera vez. Usa BASE_URL para que funcione tanto en
// desarrollo (/) como al desplegarse en un subdirectorio de GitHub Pages
// (/nombre-del-repo/).
export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return // evita cachear durante desarrollo

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`
    navigator.serviceWorker.register(swUrl).catch((err) => {
      console.error('No se pudo registrar el service worker:', err)
    })
  })
}
