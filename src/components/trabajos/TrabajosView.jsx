import { useState } from 'react'
import TrabajosLista from './TrabajosLista'
import TrabajoDetalle from './TrabajoDetalle'
import TrabajoFormModal from './TrabajoFormModal'
import FuncionFormModal from './FuncionFormModal'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useData } from '../../context/DataContext'

// Sección Trabajos: lista de trabajos (#/trabajos) o un trabajo
// (#/trabajos/<id>[/<funcionId>]). Aquí viven los formularios de trabajo y
// función y la confirmación de eliminar.
export default function TrabajosView({ trabajoId, funcionId, navegar }) {
  const data = useData()
  const [trabajoModal, setTrabajoModal] = useState({ open: false, trabajo: null })
  const [funcionModal, setFuncionModal] = useState({ open: false, trabajoId: null, funcion: null })
  const [eliminar, setEliminar] = useState(null) // { tipo: 'trabajo'|'funcion', entidad }

  const confirmarEliminar = async () => {
    const { tipo, entidad } = eliminar
    setEliminar(null)
    if (tipo === 'trabajo') {
      await data.eliminarTrabajo(entidad.id)
      navegar('trabajos')
    } else {
      await data.eliminarFuncion(entidad.id)
      navegar('trabajos', entidad.trabajoId)
    }
  }

  const acciones = {
    onEditarTrabajo: (t) => setTrabajoModal({ open: true, trabajo: t }),
    onEliminarTrabajo: (t) => setEliminar({ tipo: 'trabajo', entidad: t }),
    onNuevaFuncion: (t) => setFuncionModal({ open: true, trabajoId: t.id, funcion: null }),
    onEditarFuncion: (f) => setFuncionModal({ open: true, trabajoId: f.trabajoId, funcion: f }),
    onEliminarFuncion: (f) => setEliminar({ tipo: 'funcion', entidad: f }),
  }

  return (
    <>
      {trabajoId ? (
        <TrabajoDetalle
          trabajoId={trabajoId}
          funcionId={funcionId}
          onVolver={() => navegar('trabajos')}
          onElegirFuncion={(id) => navegar('trabajos', trabajoId, id)}
          {...acciones}
        />
      ) : (
        <TrabajosLista
          onAbrir={(id) => navegar('trabajos', id)}
          onNuevo={() => setTrabajoModal({ open: true, trabajo: null })}
          onEditar={acciones.onEditarTrabajo}
          onEliminar={acciones.onEliminarTrabajo}
        />
      )}

      <TrabajoFormModal
        open={trabajoModal.open}
        trabajo={trabajoModal.trabajo}
        onClose={() => setTrabajoModal({ open: false, trabajo: null })}
        onSubmit={async (form) => {
          if (trabajoModal.trabajo) return data.actualizarTrabajo(trabajoModal.trabajo.id, form)
          const nuevo = await data.crearTrabajo(form)
          if (nuevo) navegar('trabajos', nuevo.id)
        }}
      />

      <FuncionFormModal
        open={funcionModal.open}
        funcion={funcionModal.funcion}
        trabajoId={funcionModal.trabajoId}
        onClose={() => setFuncionModal({ open: false, trabajoId: null, funcion: null })}
        onSubmit={async (form) => {
          if (funcionModal.funcion) return data.actualizarFuncion(funcionModal.funcion.id, form)
          const nueva = await data.crearFuncion({ ...form, trabajoId: funcionModal.trabajoId })
          if (nueva) navegar('trabajos', funcionModal.trabajoId, nueva.id)
        }}
      />

      <ConfirmDialog
        open={Boolean(eliminar)}
        title={eliminar?.tipo === 'trabajo' ? 'Eliminar trabajo' : 'Eliminar función'}
        message={
          eliminar &&
          `“${eliminar.entidad.nombre}” y todo lo que contiene se moverán a la papelera de la bóveda (.papelera). Podrás recuperarlos desde esa carpeta.`
        }
        onConfirm={confirmarEliminar}
        onCancel={() => setEliminar(null)}
      />
    </>
  )
}
