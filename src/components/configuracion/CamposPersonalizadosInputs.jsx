import { Field, Select, TextInput } from '../ui/Field'
import { useData } from '../../context/DataContext'
import { TIPOS_CAMPO } from '../../models'

// Entradas de los campos personalizados que aplican a `entidad`
// ('trabajo' | 'funcion' | 'actividad'). `valores` es { clave: valor }.
export default function CamposPersonalizadosInputs({ entidad, valores, onChange }) {
  const { camposPersonalizados } = useData()
  const definiciones = camposPersonalizados.filter((c) => c.aplicaA.includes(entidad))
  if (!definiciones.length) return null

  const cambiar = (clave, valor) => onChange({ ...valores, [clave]: valor })

  return (
    <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
      {definiciones.map((def) => {
        const valor = valores?.[def.clave] ?? ''
        const alCambiar = (e) => cambiar(def.clave, e.target.value)
        return (
          <Field key={def.clave} label={def.etiqueta}>
            {def.tipo === TIPOS_CAMPO.LISTA ? (
              <Select value={valor} onChange={alCambiar}>
                <option value="">—</option>
                {/* Un valor escrito a mano que no está en las opciones no se pierde. */}
                {valor && !def.opciones.includes(valor) && <option value={valor}>{valor}</option>}
                {def.opciones.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            ) : (
              <TextInput
                type={def.tipo === TIPOS_CAMPO.FECHA ? 'date' : def.tipo === TIPOS_CAMPO.NUMERO ? 'number' : 'text'}
                inputMode={def.tipo === TIPOS_CAMPO.NUMERO ? 'decimal' : undefined}
                step={def.tipo === TIPOS_CAMPO.NUMERO ? 'any' : undefined}
                value={valor}
                onChange={alCambiar}
              />
            )}
          </Field>
        )
      })}
    </div>
  )
}
