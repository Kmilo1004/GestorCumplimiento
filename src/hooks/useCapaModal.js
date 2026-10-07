import { useEffect, useRef } from 'react'

// Capas abiertas (panel de detalle, formularios…), de abajo hacia arriba.
// Con una pila común:
// - Escape cierra solo la capa de arriba (no el formulario y el panel a la vez).
// - El scroll de la página queda bloqueado mientras haya alguna capa abierta.
const capas = []

function alPresionarTecla(e) {
  if (e.key === 'Escape' && capas.length) capas[capas.length - 1].current?.()
}

// `contenedorRef` recibe el foco al abrir (si nada dentro lo tiene ya, p. ej.
// un campo con autoFocus) y el foco vuelve a donde estaba al cerrar.
export function useCapaModal(open, onClose, contenedorRef) {
  const cerrarRef = useRef(onClose)
  useEffect(() => {
    cerrarRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const capa = cerrarRef
    const focoPrevio = document.activeElement
    capas.push(capa)
    if (capas.length === 1) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', alPresionarTecla)
    }
    const contenedor = contenedorRef?.current
    if (contenedor && !contenedor.contains(document.activeElement)) contenedor.focus()

    return () => {
      capas.splice(capas.indexOf(capa), 1)
      if (!capas.length) {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', alPresionarTecla)
      }
      if (focoPrevio instanceof HTMLElement && document.contains(focoPrevio)) focoPrevio.focus()
    }
  }, [open, contenedorRef])
}
