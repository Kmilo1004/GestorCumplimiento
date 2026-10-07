import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'

const VACIO = new Map()

// Notas diarias del rango [desde, hasta] como Map fecha -> { compromisos, notas }.
// Se vuelve a leer al cambiar el rango o cuando la agenda cambia (versionAgenda).
export function useAgenda(desde, hasta) {
  const { listarAgenda, versionAgenda } = useData()
  const rango = `${desde}|${hasta}`
  const [estado, setEstado] = useState({ rango: null, notas: new Map(), error: '' })

  useEffect(() => {
    let vigente = true
    listarAgenda(desde, hasta)
      .then((lista) => {
        if (vigente) setEstado({ rango, notas: new Map(lista.map((n) => [n.fecha, n])), error: '' })
      })
      .catch((err) => {
        console.error(err)
        if (vigente) setEstado({ rango, notas: new Map(), error: err.message || 'No se pudo leer la agenda.' })
      })
    return () => {
      vigente = false
    }
  }, [desde, hasta, rango, versionAgenda, listarAgenda])

  // "cargando" mientras los datos no correspondan al rango pedido: así nadie
  // edita la nota de un día antes de que llegue su contenido real.
  const cargando = estado.rango !== rango
  return { notas: cargando ? VACIO : estado.notas, cargando, error: estado.error }
}
