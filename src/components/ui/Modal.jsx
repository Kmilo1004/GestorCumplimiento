import { useRef } from 'react'
import Icono from './Icono'
import { useCapaModal } from '../../hooks/useCapaModal'

const ANCHOS = { md: 'sm:max-w-md', lg: 'sm:max-w-lg' }

export default function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null)
  useCapaModal(open, onClose, ref)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl outline-none ${ANCHOS[size]} sm:rounded-2xl safe-bottom animate-in`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <Icono nombre="cerrar" grosor={2} />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
