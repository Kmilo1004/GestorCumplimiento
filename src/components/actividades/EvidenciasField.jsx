import { useRef, useState } from 'react'

function IconoArchivo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5" />
    </svg>
  )
}

// Lista de evidencias de una actividad:
// - `guardadas`: nombres de archivos ya en la bóveda (se abren o eliminan al momento).
// - `nuevas`: File[] elegidos en el formulario; se copian al guardar.
export default function EvidenciasField({ guardadas, nuevas, onAgregar, onQuitarNueva, onAbrir, onEliminar }) {
  const inputRef = useRef(null)
  const [confirmando, setConfirmando] = useState(null)
  const total = guardadas.length + nuevas.length

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">
          Evidencias {total > 0 && <span className="font-normal text-slate-400">({total})</span>}
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          + Adjuntar
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            onAgregar([...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
      </div>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
          Actas, oficios, fotos o PDF que respalden la actividad. Se guardan en la carpeta Evidencias de la bóveda.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {guardadas.map((nombre) => (
            <li key={nombre} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700">
              <IconoArchivo />
              <button
                type="button"
                onClick={() => onAbrir(nombre)}
                className="min-w-0 flex-1 truncate text-left hover:text-brand-600 hover:underline"
                title={`Abrir ${nombre}`}
              >
                {nombre}
              </button>
              {confirmando === nombre ? (
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmando(null)
                      onEliminar(nombre)
                    }}
                    className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white"
                  >
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando(null)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmando(nombre)}
                  className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label={`Eliminar ${nombre}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9M4.5 6h15m-1.5 0v13.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6m3-2.5h4a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" />
                  </svg>
                </button>
              )}
            </li>
          ))}
          {nuevas.map((archivo, i) => (
            <li key={`${archivo.name}-${i}`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700">
              <IconoArchivo />
              <span className="min-w-0 flex-1 truncate">{archivo.name}</span>
              <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">Nueva</span>
              <button
                type="button"
                onClick={() => onQuitarNueva(i)}
                className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={`Quitar ${archivo.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
