import { useId, useState } from 'react'
import { normalizarTags } from '../../models'

// Campo de etiquetas: se escriben y se confirman con Enter, coma o espacio.
// Sugiere las etiquetas que ya existen en la bóveda.
export default function TagInput({ value = [], onChange, sugerencias = [] }) {
  const [texto, setTexto] = useState('')
  const listaId = useId()

  const agregar = (entrada) => {
    const nuevas = normalizarTags([...value, ...normalizarTags(entrada)])
    if (nuevas.length !== value.length) onChange(nuevas)
    setTexto('')
  }

  const quitar = (tag) => onChange(value.filter((t) => t !== tag))

  const onKeyDown = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      if (!texto.trim()) {
        if (e.key === 'Enter') e.preventDefault()
        return
      }
      e.preventDefault()
      agregar(texto)
    } else if (e.key === 'Backspace' && !texto && value.length) {
      quitar(value[value.length - 1])
    }
  }

  const usadas = new Set(value.map((t) => t.toLocaleLowerCase('es')))
  const disponibles = sugerencias.filter((s) => !usadas.has(s.toLocaleLowerCase('es')))

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2 pr-1 text-xs font-medium text-brand-700">
          #{tag}
          <button
            type="button"
            onClick={() => quitar(tag)}
            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-brand-100"
            aria-label={`Quitar etiqueta ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        list={listaId}
        value={texto}
        onChange={(e) => {
          // Elegir una sugerencia del datalist llega como cambio de valor completo.
          // Los teclados de Android no siempre informan la coma/espacio en
          // keydown, así que el separador también se detecta aquí.
          // Solo una elección real del datalist (no escribir un prefijo que
          // coincida con una etiqueta existente) confirma la sugerencia.
          const v = e.target.value
          const eligioSugerencia = e.nativeEvent.inputType === 'insertReplacementText' || !e.nativeEvent.inputType
          if ((eligioSugerencia && disponibles.includes(v)) || /[,\s]/.test(v)) agregar(v)
          else setTexto(v)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => texto.trim() && agregar(texto)}
        placeholder={value.length ? '' : 'Ej: informe, contraloría'}
        className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        aria-label="Agregar etiqueta"
      />
      <datalist id={listaId}>
        {disponibles.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}
