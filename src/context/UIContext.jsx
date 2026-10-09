import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useData } from './DataContext'
import ActividadDetalle from '../components/actividades/ActividadDetalle'
import ActividadFormModal from '../components/trabajos/ActividadFormModal'
import ConfiguracionModal from '../components/configuracion/ConfiguracionModal'

// Estado de interfaz compartido: el panel de detalle de una actividad, el
// formulario de actividad y la Configuración se abren desde cualquier pantalla.
const UIContext = createContext(null)

export function UIProvider({ children, onIrATrabajos }) {
  const { arbol, crearActividad, actualizarActividad } = useData()
  const [detalleId, setDetalleId] = useState(null)
  const [formulario, setFormulario] = useState({ open: false, actividad: null, funcionId: '', valores: null })
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false)

  const abrirConfiguracion = useCallback(() => setConfiguracionAbierta(true), [])
  const abrirDetalle = useCallback((id) => setDetalleId(id), [])
  const cerrarDetalle = useCallback(() => setDetalleId(null), [])

  // Sin función indicada se preselecciona la primera que exista.
  // `valores` precarga campos (p. ej. { fecha_limite } desde la agenda).
  const nuevaActividad = useCallback(
    (funcionId, valores = null) =>
      setFormulario({
        open: true,
        actividad: null,
        funcionId: funcionId || arbol.find((t) => t.funciones.length)?.funciones[0]?.id || '',
        valores,
      }),
    [arbol],
  )

  const editarActividad = useCallback((actividad) => {
    setFormulario({ open: true, actividad, funcionId: actividad.funcionId, valores: null })
  }, [])

  const cerrarFormulario = useCallback(() => setFormulario((f) => ({ ...f, open: false })), [])

  const guardar = (form) =>
    formulario.actividad ? actualizarActividad(formulario.actividad.id, form) : crearActividad(form)

  const value = useMemo(
    () => ({ abrirDetalle, nuevaActividad, editarActividad, abrirConfiguracion }),
    [abrirDetalle, nuevaActividad, editarActividad, abrirConfiguracion],
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
        valoresIniciales={formulario.valores}
        onClose={cerrarFormulario}
        onSubmit={guardar}
        onIrATrabajos={onIrATrabajos}
      />
      <ConfiguracionModal open={configuracionAbierta} onClose={() => setConfiguracionAbierta(false)} />
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI debe usarse dentro de <UIProvider>')
  return ctx
}
