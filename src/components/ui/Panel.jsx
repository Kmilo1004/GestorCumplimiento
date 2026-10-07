import { useRef } from 'react'
import Icono from './Icono'
import { useCapaModal } from '../../hooks/useCapaModal'

// Panel de detalle: hoja que sube desde abajo en el celular y panel lateral
// a la derecha en PC (lg). El contenido hace scroll; cabecera y pie quedan fijos.
export default function Panel({ open, onClose, titulo, subtitulo, children, pie }) {
  const ref = useRef(null)
  useCapaModal(open, onClose, ref)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end lg:items-stretch lg:justify-end">
      <div className="absolute inset-0 bg-slate-900/40 lg:bg-slate-900/20" onClick={onClose} aria-hidden="true" />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative flex max-h-[90dvh] w-full flex-col outline-none rounded-t-2xl bg-white shadow-xl animate-in safe-bottom lg:h-full lg:max-h-none lg:w-[28rem] lg:rounded-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 lg:hidden" aria-hidden="true" />
        <header className="flex items-start gap-3 border-b border-slate-100 px-5 pb-3 pt-3 lg:pt-5">
          <div className="min-w-0 flex-1">
            {subtitulo && <p className="truncate text-xs text-slate-400">{subtitulo}</p>}
            <h2 className="text-lg font-semibold leading-snug text-slate-900">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <Icono nombre="cerrar" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {pie && <footer className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">{pie}</footer>}
      </aside>
    </div>
  )
}
