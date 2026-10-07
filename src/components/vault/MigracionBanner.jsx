import { useState } from 'react'
import { useData } from '../../context/DataContext'

// Ofrece pasar a la bóveda los datos que la versión anterior de la app
// guardaba dentro del navegador (IndexedDB). Se muestra una sola vez.
export default function MigracionBanner() {
  const { migracionPendiente, resolverMigracion } = useData()
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  if (!migracionPendiente) return null

  const { trabajos, funciones, actividades } = migracionPendiente

  const resolver = async (importar) => {
    setProcesando(true)
    setError('')
    try {
      await resolverMigracion({ importar })
    } catch (err) {
      setError(err.message || 'No se pudieron importar los datos.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-medium text-amber-900">Hay datos de la versión anterior en este navegador</p>
        <p className="mt-1 text-amber-800">
          {trabajos.length} trabajos, {funciones.length} funciones y {actividades.length} actividades. ¿Quieres
          copiarlos a tu bóveda como archivos? No se borra nada del navegador.
        </p>
        {error && <p className="mt-2 text-red-700">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={procesando}
            onClick={() => resolver(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {procesando ? 'Importando…' : 'Importar a la bóveda'}
          </button>
          <button
            type="button"
            disabled={procesando}
            onClick={() => resolver(false)}
            className="rounded-lg px-4 py-2 font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            No importar
          </button>
        </div>
      </div>
    </div>
  )
}
