// Abrir y descargar archivos (evidencias, backups) desde el navegador.

// Tipos que el navegador muestra sin riesgo en una pestaña nueva. SVG y HTML
// quedan fuera a propósito: abiertos desde la app podrían ejecutar scripts
// con acceso a la bóveda, así que esos se descargan.
const VISUALIZABLES = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.txt']

export function esVisualizable(nombre) {
  const n = nombre.toLowerCase()
  return VISUALIZABLES.some((ext) => n.endsWith(ext))
}

export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Abre un archivo que se obtiene de forma asíncrona (p. ej. leído del disco).
// La pestaña se abre ANTES de leer, dentro del clic, para que el navegador
// no la bloquee como ventana emergente.
export async function abrirArchivo(nombre, obtenerBlob) {
  const ventana = esVisualizable(nombre) ? window.open('', '_blank') : null
  try {
    const blob = await obtenerBlob()
    if (!ventana) {
      descargarBlob(blob, nombre)
      return
    }
    const url = URL.createObjectURL(blob)
    ventana.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    ventana?.close()
    throw err
  }
}
