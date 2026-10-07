import ListaAgrupada from './ListaAgrupada'
import Tablero from './Tablero'
import Icono from '../ui/Icono'

// Clave de la preferencia "lista | tablero": usePreferencia(CLAVE_VISTA, 'lista').
export const CLAVE_VISTA = 'vistaActividades'

// Selector "Lista | Tablero".
export function SelectorVista({ vista, onChange }) {
  const opciones = [
    { id: 'lista', etiqueta: 'Lista', icono: 'lista' },
    { id: 'tablero', etiqueta: 'Tablero', icono: 'tablero' },
  ]
  return (
    <div className="inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Tipo de vista">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={vista === o.id}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            vista === o.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icono nombre={o.icono} className="h-4 w-4" />
          <span className="hidden sm:inline">{o.etiqueta}</span>
        </button>
      ))}
    </div>
  )
}

// Muestra las actividades como lista agrupada o tablero según la vista.
export default function VistaActividades({ vista, ...props }) {
  return vista === 'tablero' ? <Tablero {...props} /> : <ListaAgrupada {...props} />
}
