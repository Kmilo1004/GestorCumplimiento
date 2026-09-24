import { useRef, useState } from 'react'
import { useData } from '../../context/DataContext'
import Modal from '../ui/Modal'

function descargarJSON(objeto, nombreArchivo) {
  const blob = new Blob([JSON.stringify(objeto, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function BackupView() {
  const data = useData()
  const fileInputRef = useRef(null)
  const [pendiente, setPendiente] = useState(null) // { json, nombreArchivo }
  const [modo, setModo] = useState('reemplazar')
  const [estado, setEstado] = useState({ tipo: null, mensaje: '' }) // tipo: 'exito' | 'error'
  const [procesando, setProcesando] = useState(false)

  const handleExportar = async () => {
    try {
      const backup = await data.exportarDatos()
      const fecha = new Date().toISOString().slice(0, 10)
      descargarJSON(backup, `cumplimiento-backup-${fecha}.json`)
      setEstado({ tipo: 'exito', mensaje: 'Backup descargado correctamente.' })
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: err.message || 'No se pudo exportar el backup.' })
    }
  }

  const handleArchivoSeleccionado = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!archivo) return
    try {
      const texto = await archivo.text()
      const json = JSON.parse(texto)
      setPendiente({ json, nombreArchivo: archivo.name })
      setModo('reemplazar')
    } catch {
      setEstado({ tipo: 'error', mensaje: 'El archivo no es un JSON válido.' })
    }
  }

  const confirmarImportacion = async () => {
    if (!pendiente) return
    setProcesando(true)
    try {
      await data.importarDatos(pendiente.json, { modo })
      setEstado({ tipo: 'exito', mensaje: 'Datos importados correctamente.' })
      setPendiente(null)
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: err.message || 'No se pudo importar el archivo.' })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Exportar datos</h2>
        <p className="mt-1 text-sm text-slate-400">
          Descarga un archivo JSON con todos tus trabajos, funciones y actividades. Guárdalo como respaldo o
          para moverlo a otro dispositivo.
        </p>
        <button
          type="button"
          onClick={handleExportar}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 10.5 12 15m0 0 4.5-4.5M12 15V3" />
          </svg>
          Exportar a JSON
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Importar datos</h2>
        <p className="mt-1 text-sm text-slate-400">
          Restaura tus datos desde un archivo de backup exportado previamente por esta app.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleArchivoSeleccionado}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 7.5 12 3m0 0L7.5 7.5M12 3v13.5" />
          </svg>
          Elegir archivo JSON
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Estado actual de los datos</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold text-slate-800">{data.resumen.totalTrabajos}</p>
            <p className="text-[11px] text-slate-400">Trabajos</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{data.resumen.totalFunciones}</p>
            <p className="text-[11px] text-slate-400">Funciones</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{data.resumen.totalActividades}</p>
            <p className="text-[11px] text-slate-400">Actividades</p>
          </div>
        </div>
      </div>

      {estado.tipo && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            estado.tipo === 'exito'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {estado.mensaje}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Todo se guarda localmente en este dispositivo (IndexedDB). Nada se envía a internet en esta fase.
      </p>

      <Modal
        open={Boolean(pendiente)}
        title="Confirmar importación"
        onClose={() => setPendiente(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPendiente(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={procesando}
              onClick={confirmarImportacion}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {procesando ? 'Importando…' : 'Importar'}
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600">
          Archivo: <span className="font-medium">{pendiente?.nombreArchivo}</span>
        </p>
        <div className="space-y-2">
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
            <input
              type="radio"
              name="modo"
              checked={modo === 'reemplazar'}
              onChange={() => setModo('reemplazar')}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-slate-700">Reemplazar todo</span>
              <span className="block text-xs text-slate-400">Borra los datos actuales y los sustituye por los del archivo.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
            <input
              type="radio"
              name="modo"
              checked={modo === 'combinar'}
              onChange={() => setModo('combinar')}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-slate-700">Combinar</span>
              <span className="block text-xs text-slate-400">Agrega/actualiza sin borrar lo que ya tienes (por id).</span>
            </span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
