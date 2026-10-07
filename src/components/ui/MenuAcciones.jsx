import { useEffect, useRef, useState } from 'react'
import Icono from './Icono'

// Botón "⋯" con un menú desplegable de acciones secundarias (editar,
// eliminar…), para no llenar cada fila de íconos.
// opciones: [{ etiqueta, onClick, peligro?: boolean }]
export default function MenuAcciones({ opciones, etiqueta = 'Más acciones', className = '' }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e) => {
      if (!ref.current?.contains(e.target)) setAbierto(false)
    }
    const conEscape = (e) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('pointerdown', cerrar)
    document.addEventListener('keydown', conEscape)
    return () => {
      document.removeEventListener('pointerdown', cerrar)
      document.removeEventListener('keydown', conEscape)
    }
  }, [abierto])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setAbierto((v) => !v)
        }}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label={etiqueta}
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <Icono nombre="puntos" grosor={2.5} />
      </button>
      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {opciones.map((o) => (
            <button
              key={o.etiqueta}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation()
                setAbierto(false)
                o.onClick()
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 ${
                o.peligro ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
