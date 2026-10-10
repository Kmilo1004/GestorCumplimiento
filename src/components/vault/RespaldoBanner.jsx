import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { FRECUENCIAS_RESPALDO } from '../../models'

// Aviso visible cuando las copias automáticas están activadas pero no se
// pueden hacer: así nunca se queda sin respaldos sin enterarse.
export default function RespaldoBanner() {
  const { respaldo, permitirRespaldo, hacerRespaldo } = useData()
  const { abrirConfiguracion } = useUI()
  const [error, setError] = useState('')

  if (respaldo.frecuencia === FRECUENCIAS_RESPALDO.DESACTIVADA) return null
  const pausado = respaldo.estado === 'sin-permiso'
  const fallo = respaldo.estado === 'listo' && respaldo.error && !respaldo.enCurso
  if (!pausado && !fallo) return null

  const permitir = async () => {
    setError('')
    try {
      await permitirRespaldo()
    } catch (err) {
      setError(err.message || 'No se pudo dar acceso a la carpeta.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-medium text-amber-900">
          {pausado ? 'Copias de respaldo en pausa' : 'No se pudo hacer la copia de respaldo'}
        </p>
        <p className="mt-1 break-words text-amber-800">
          {pausado
            ? `Edge necesita que confirmes el acceso a la carpeta "${respaldo.destino}".`
            : respaldo.error}
        </p>
        {error && <p className="mt-2 text-red-700">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pausado ? permitir : hacerRespaldo}
            className="min-h-[44px] rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700"
          >
            {pausado ? 'Permitir acceso' : 'Reintentar'}
          </button>
          <button
            type="button"
            onClick={abrirConfiguracion}
            className="min-h-[44px] rounded-lg px-4 py-2 font-medium text-amber-900 hover:bg-amber-100"
          >
            Configuración
          </button>
        </div>
      </div>
    </div>
  )
}
