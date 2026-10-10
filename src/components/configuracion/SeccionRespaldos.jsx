import { useState } from 'react'
import Icono from '../ui/Icono'
import { Field, Select } from '../ui/Field'
import { useData } from '../../context/DataContext'
import {
  RESPALDOS_A_CONSERVAR as CONSERVAR,
  FRECUENCIAS_RESPALDO as FRECUENCIAS,
  FRECUENCIA_RESPALDO_LABELS as FRECUENCIA_LABELS,
  FRECUENCIA_RESPALDO_LIST as FRECUENCIA_LIST,
} from '../../models'

function fechaHora(iso) {
  if (!iso) return ''
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime())
    ? ''
    : fecha.toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const botonSecundario =
  'flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'

// Configuración de las copias de respaldo automáticas en otra carpeta.
export default function SeccionRespaldos() {
  const { respaldo, hacerRespaldo, elegirDestinoRespaldo, permitirRespaldo, cambiarFrecuenciaRespaldo } = useData()
  const [error, setError] = useState('')

  const ejecutar = (accion) => async () => {
    setError('')
    try {
      await accion()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo completar la acción.')
    }
  }

  const { estado, destino, frecuencia, ultimo, enCurso } = respaldo
  const mensajeError = error || respaldo.error

  return (
    <section className="mt-6 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-slate-800">Copias de respaldo</h3>
      <p className="mt-1 text-sm text-slate-500">
        Copia toda la bóveda (con evidencias) en otra carpeta: OneDrive, una USB o una carpeta de red. Se conservan las
        últimas {CONSERVAR}. Las copias automáticas se hacen mientras la app está abierta.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 py-1 pl-3 pr-1">
        <Icono nombre="carpeta" className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={`min-w-0 flex-1 truncate text-sm ${destino ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
          {destino || 'Sin carpeta de respaldos'}
        </span>
        <button
          type="button"
          onClick={ejecutar(elegirDestinoRespaldo)}
          className="shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-slate-200"
        >
          {destino ? 'Cambiar' : 'Elegir carpeta'}
        </button>
      </div>
      {!destino && (
        <p className="mt-1 text-xs text-slate-400">
          Usa una carpeta con ruta corta, por ejemplo <span className="font-mono">OneDrive\Respaldos</span>, y distinta a
          la bóveda.
        </p>
      )}

      {estado === 'sin-permiso' && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>Edge necesita que confirmes el acceso a la carpeta de respaldos.</p>
          <button
            type="button"
            onClick={ejecutar(permitirRespaldo)}
            className="mt-2 min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
          >
            Permitir acceso
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
        <Field label="Frecuencia">
          <Select value={frecuencia} onChange={(e) => ejecutar(() => cambiarFrecuenciaRespaldo(e.target.value))()}>
            {FRECUENCIA_LIST.map((f) => (
              <option key={f} value={f}>
                {FRECUENCIA_LABELS[f]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="mb-3">
          <button
            type="button"
            onClick={ejecutar(hacerRespaldo)}
            disabled={estado !== 'listo' || enCurso}
            className={`${botonSecundario} w-full`}
          >
            {enCurso ? 'Copiando…' : 'Hacer copia ahora'}
          </button>
        </div>
      </div>

      {estado === 'listo' && (
        <p className="text-sm text-slate-500">
          {ultimo ? (
            <>
              Última copia: <span className="font-medium text-slate-700">{fechaHora(ultimo.creadoEn)}</span>
              {ultimo.fallidos?.length > 0 && (
                <span className="text-amber-700">
                  {' '}
                  · {ultimo.fallidos.length} {ultimo.fallidos.length === 1 ? 'archivo no se pudo' : 'archivos no se pudieron'}{' '}
                  copiar
                </span>
              )}
            </>
          ) : frecuencia === FRECUENCIAS.DESACTIVADA ? (
            'Aún no hay copias de esta bóveda.'
          ) : (
            'Aún no hay copias de esta bóveda: se hará una en un momento.'
          )}
        </p>
      )}

      {mensajeError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{mensajeError}</div>
      )}
    </section>
  )
}
