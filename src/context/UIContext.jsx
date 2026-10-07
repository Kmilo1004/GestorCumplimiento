import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useData } from './DataContext'
import ActividadDetalle from '../components/actividades/ActividadDetalle'
import ActividadFormModal from '../components/trabajos/ActividadFormModal'

// Estado de interfaz compartido: el panel de detalle de una actividad y el
// formulario de actividad se pueden abrir desde cualquier pantalla.
const UIContext = createContext(null)

export function UIProvider({ children, onIrATrabajos }) {
  const { arbol, crearActividad, actualizarActividad } = useData()
  const [detalleId, setDetalleId] = useState(null)
  const [formulario, setFormulario] = useState({ open: false, actividad: null, funcionId: '' })

  const abrirDetalle = useCallback((id) => setDetalleId(id), [])
  const cerrarDetalle = useCallback(() => setDetalleId(null), [])

  // Sin función indicada se preselecciona la primera que exista.
  const nuevaActividad = useCallback(
    (funcionId) =>
      setFormulario({
        open: true,
        actividad: null,
        funcionId: funcionId || arbol.find((t) => t.funciones.length)?.funciones[0]?.id || '',
      }),
    [arbol],
  )

  const editarActividad = useCallback((actividad) => {
    setFormulario({ open: true, actividad, funcionId: actividad.funcionId })
  }, [])

  const cerrarFormulario = useCallback(() => setFormulario((f) => ({ ...f, open: false })), [])

  const guardar = (form) =>
    formulario.actividad ? actualizarActividad(formulario.actividad.id, form) : crearActividad(form)

  const value = useMemo(
    () => ({ abrirDetalle, nuevaActividad, editarActividad }),
    [abrirDetalle, nuevaActividad, editarActividad],
  )

  return (
    <UIContext.Provider value={value}>
      {children}
      {detalleId && (
        <ActividadDetalle actividadId={detalleId} onClose={cerrarDetalle} onEditar={editarActividad} />
      )}
      <ActividadFormModal
        open={formulario.open}
        actividad={formulario.actividad}
        funcionId={formulario.funcionId}
        onClose={cerrarFormulario}
        onSubmit={guardar}
        onIrATrabajos={onIrATrabajos}
      />
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>')
  return ctx
}
