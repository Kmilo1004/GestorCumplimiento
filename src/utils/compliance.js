// Cálculo de % de cumplimiento, propagado hacia arriba:
// Actividad (según estado) -> Función (promedio de sus actividades)
// -> Trabajo (promedio de sus funciones).
//
// Funciones puras: reciben datos ya cargados, no tocan la bóveda ni el disco.

import { PROGRESO_POR_ESTADO, ESTADOS } from '../models'

export function progresoActividad(actividad) {
  return PROGRESO_POR_ESTADO[actividad?.estado] ?? 0
}

export function progresoFuncion(actividades = []) {
  if (actividades.length === 0) return 0
  const suma = actividades.reduce((acc, a) => acc + progresoActividad(a), 0)
  return Math.round(suma / actividades.length)
}

export function progresoTrabajo(funcionesConProgreso = []) {
  if (funcionesConProgreso.length === 0) return 0
  const suma = funcionesConProgreso.reduce((acc, f) => acc + f.progreso, 0)
  return Math.round(suma / funcionesConProgreso.length)
}

// Construye el árbol Trabajo -> Función -> Actividad a partir de las tres
// listas planas que devuelve dataService.cargarTodo(), añadiendo el
// progreso calculado en cada nivel.
export function construirArbol({ trabajos = [], funciones = [], actividades = [] }) {
  return trabajos.map((trabajo) => {
    const funcionesDelTrabajo = funciones
      .filter((f) => f.trabajoId === trabajo.id)
      .map((funcion) => {
        const actividadesDeLaFuncion = actividades
          .filter((a) => a.funcionId === funcion.id)
          .sort((a, b) => (a.fecha_limite || '').localeCompare(b.fecha_limite || ''))

        return {
          ...funcion,
          actividades: actividadesDeLaFuncion,
          progreso: progresoFuncion(actividadesDeLaFuncion),
        }
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

    return {
      ...trabajo,
      funciones: funcionesDelTrabajo,
      progreso: progresoTrabajo(funcionesDelTrabajo),
    }
  })
}

export function resumenGeneral(arbolTrabajos = []) {
  const totalTrabajos = arbolTrabajos.length
  const todasFunciones = arbolTrabajos.flatMap((t) => t.funciones)
  const todasActividades = todasFunciones.flatMap((f) => f.actividades)

  const porEstado = {
    [ESTADOS.PENDIENTE]: 0,
    [ESTADOS.EN_PROGRESO]: 0,
    [ESTADOS.COMPLETADA]: 0,
  }
  for (const actividad of todasActividades) {
    if (porEstado[actividad.estado] !== undefined) porEstado[actividad.estado] += 1
  }

  const progresoGlobal =
    totalTrabajos === 0
      ? 0
      : Math.round(arbolTrabajos.reduce((acc, t) => acc + t.progreso, 0) / totalTrabajos)

  return {
    totalTrabajos,
    totalFunciones: todasFunciones.length,
    totalActividades: todasActividades.length,
    porEstado,
    progresoGlobal,
  }
}
