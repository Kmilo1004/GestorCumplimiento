import Icono from '../ui/Icono'

// Cabecera de cada página. `volver` = { etiqueta, onClick } muestra una miga
// de pan para regresar al nivel anterior; `acciones` va a la derecha.
export default function Header({ title, subtitle, volver, acciones }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/90 backdrop-blur safe-top">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-3 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <div className="min-w-0 flex-1">
          {volver && (
            <button
              type="button"
              onClick={volver.onClick}
              className="-ml-1 mb-0.5 flex items-center gap-0.5 rounded px-1 text-xs font-medium text-slate-500 hover:text-brand-600"
            >
              <Icono nombre="izquierda" className="h-3.5 w-3.5" grosor={2.2} />
              {volver.etiqueta}
            </button>
          )}
          <h1 className="truncate text-xl font-bold text-slate-900 lg:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
        </div>
        {acciones && <div className="flex shrink-0 items-center gap-1">{acciones}</div>}
      </div>
    </header>
  )
}

// Botón principal de las cabeceras ("+ Nueva actividad"). En el celular se
// oculta si ya está el botón flotante.
export function BotonPrincipal({ onClick, children, soloPC = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${soloPC ? 'hidden lg:flex' : 'flex'} items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700`}
    >
      <Icono nombre="mas" className="h-4 w-4" grosor={2.2} />
      {children}
    </button>
  )
}
