import { useState } from 'react'
import { useData } from '../../context/DataContext'
import TrabajoAccordion from './TrabajoAccordion'
import TrabajoFormModal from './TrabajoFormModal'
import FuncionFormModal from './FuncionFormModal'
import ActividadFormModal from './ActividadFormModal'
import EmptyState from '../ui/EmptyState'

export default function TrabajosView() {
  const data = useData()
  const [funcionesAbiertas, setFuncionesAbiertas] = useState({})

  const [trabajoModal, setTrabajoModal] = useState({ open: false, trabajo: null })
  const [funcionModal, setFuncionModal] = useState({ open: false, trabajoId: null, funcion: null })
  const [actividadModal, setActividadModal] = useState({ open: false, funcionId: null, actividad: null })

  const toggleFuncion = (funcionId) =>
    setFuncionesAbiertas((prev) => ({ ...prev, [funcionId]: !prev[funcionId] }))

  return (
    <div className="mx-auto max-w-2xl space-y-3 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {data.arbol.length} {data.arbol.length === 1 ? 'trabajo' : 'trabajos'}
        </p>
        <button
          type="button"
          onClick={() => setTrabajoModal({ open: true, trabajo: null })}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo trabajo
        </button>
      </div>

      {data.arbol.length === 0 ? (
        <EmptyState
          title="Todavía no tienes trabajos registrados"
          description="Empieza creando un Trabajo (ej. un cargo o proceso). Luego podrás agregarle Funciones y Actividades."
          action={
            <button
              type="button"
              onClick={() => setTrabajoModal({ open: true, trabajo: null })}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Crear el primer trabajo
            </button>
          }
        />
      ) : (
        data.arbol.map((trabajo) => (
          <TrabajoAccordion
            key={trabajo.id}
            trabajo={trabajo}
            funcionesAbiertas={funcionesAbiertas}
            onToggleFuncion={toggleFuncion}
            onEditarTrabajo={(t) => setTrabajoModal({ open: true, trabajo: t })}
            onEliminarTrabajo={data.eliminarTrabajo}
            onNuevaFuncion={(t) => setFuncionModal({ open: true, trabajoId: t.id, funcion: null })}
            onEditarFuncion={(f) => setFuncionModal({ open: true, trabajoId: f.trabajoId, funcion: f })}
            onEliminarFuncion={data.eliminarFuncion}
            onNuevaActividad={(f) => setActividadModal({ open: true, funcionId: f.id, actividad: null })}
            onEditarActividad={(a) => setActividadModal({ open: true, funcionId: a.funcionId, actividad: a })}
            onEliminarActividad={data.eliminarActividad}
            onToggleActividadCompletada={(a, nuevoEstado) => data.actualizarActividad(a.id, { estado: nuevoEstado })}
          />
        ))
      )}

      <TrabajoFormModal
        open={trabajoModal.open}
        trabajo={trabajoModal.trabajo}
        onClose={() => setTrabajoModal({ open: false, trabajo: null })}
        onSubmit={(form) =>
          trabajoModal.trabajo
            ? data.actualizarTrabajo(trabajoModal.trabajo.id, form)
            : data.crearTrabajo(form)
        }
      />

      <FuncionFormModal
        open={funcionModal.open}
        funcion={funcionModal.funcion}
        onClose={() => setFuncionModal({ open: false, trabajoId: null, funcion: null })}
        onSubmit={(form) =>
          funcionModal.funcion
            ? data.actualizarFuncion(funcionModal.funcion.id, form)
            : data.crearFuncion({ ...form, trabajoId: funcionModal.trabajoId })
        }
      />

      <ActividadFormModal
        open={actividadModal.open}
        actividad={actividadModal.actividad}
        onClose={() => setActividadModal({ open: false, funcionId: null, actividad: null })}
        onSubmit={(form) =>
          actividadModal.actividad
            ? data.actualizarActividad(actividadModal.actividad.id, form)
            : data.crearActividad({ ...form, funcionId: actividadModal.funcionId })
        }
      />
    </div>
  )
}
