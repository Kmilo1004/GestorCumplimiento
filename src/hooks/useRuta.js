import { useCallback, useEffect, useState } from 'react'

// Navegación mínima por hash (#/trabajos/<id>/<funcionId>). Usar la URL en vez
// de solo estado permite que el botón/gesto "Atrás" del celular funcione y
// que una recarga conserve la pantalla. No necesita servidor.

function leer() {
  return window.location.hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent)
}

export function useRuta() {
  const [partes, setPartes] = useState(leer)

  useEffect(() => {
    const alCambiar = () => setPartes(leer())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  // navegar('trabajos', id) -> #/trabajos/<id>
  const navegar = useCallback((...segmentos) => {
    const destino = `#/${segmentos.filter(Boolean).map(encodeURIComponent).join('/')}`
    if (window.location.hash !== destino) window.location.hash = destino
  }, [])

  return { partes, navegar }
}
