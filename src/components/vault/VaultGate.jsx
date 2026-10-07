import { useState } from 'react'
import { useData } from '../../context/DataContext'

function IconoCarpeta() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  )
}

// Pantalla que se muestra mientras no haya una bóveda abierta: pide elegir
// la carpeta donde se guardan los datos o confirmar el acceso a la guardada.
export default function VaultGate() {
  const { boveda, elegirBoveda, reabrirBoveda } = useData()
  const [error, setError] = useState('')

  const ejecutar = (accion) => async () => {
    setError('')
    try {
      await accion()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo abrir la carpeta.')
    }
  }

  if (boveda.estado === 'iniciando') {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-400">Buscando tu bóveda…</div>
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <IconoCarpeta />
        </div>

        {boveda.estado === 'sin-soporte' && (
          <>
            <h2 className="text-lg font-semibold text-slate-900">Navegador no compatible</h2>
            <p className="mt-2 text-sm text-slate-500">
              Para guardar tus datos en carpetas de tu equipo abre esta app en <strong>Google Chrome</strong> o{' '}
              <strong>Microsoft Edge</strong> de escritorio.
            </p>
          </>
        )}

        {boveda.estado === 'sin-boveda' && (
          <>
            <h2 className="text-lg font-semibold text-slate-900">Elige tu bóveda</h2>
            <p className="mt-2 text-sm text-slate-500">
              Tus trabajos, funciones y actividades se guardan como archivos Markdown en una carpeta de tu equipo,
              igual que en Obsidian. Puedes abrirlos, copiarlos o respaldarlos cuando quieras.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Sugerencia: crea una carpeta vacía, por ejemplo <span className="font-mono">Documentos/Cumplimiento</span>.
            </p>
            <button
              type="button"
              onClick={ejecutar(elegirBoveda)}
              className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Elegir carpeta
            </button>
          </>
        )}

        {boveda.estado === 'sin-permiso' && (
          <>
            <h2 className="text-lg font-semibold text-slate-900">Abrir bóveda</h2>
            <p className="mt-2 text-sm text-slate-500">
              El navegador necesita que confirmes el acceso a la carpeta{' '}
              <span className="font-medium text-slate-700">{boveda.nombre}</span>.
            </p>
            <button
              type="button"
              onClick={ejecutar(reabrirBoveda)}
              className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Abrir “{boveda.nombre}”
            </button>
            <button
              type="button"
              onClick={ejecutar(elegirBoveda)}
              className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Elegir otra carpeta
            </button>
          </>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
