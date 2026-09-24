import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as dataService from '../services/dataService'
import { construirArbol, resumenGeneral } from '../utils/compliance'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [trabajos, setTrabajos] = useState([])
  const [funciones, setFunciones] = useState([])
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refrescar = useCallback(async () => {
    try {
      setError(null)
      const datos = await dataService.cargarTodo()
      setTrabajos(datos.trabajos)
      setFunciones(datos.funciones)
      setActividades(datos.actividades)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudieron cargar los datos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refrescar()
  }, [refrescar])

  const arbol = useMemo(
    () => construirArbol({ trabajos, funciones, actividades }),
    [trabajos, funciones, actividades],
  )

  const resumen = useMemo(() => resumenGeneral(arbol), [arbol])

  // Actividades "enriquecidas" con el nombre del trabajo y la función a la
  // que pertenecen; útil para la vista de filtros y el dashboard.
  const actividadesConContexto = useMemo(() => {
    const funcionPorId = new Map(funciones.map((f) => [f.id, f]))
    const trabajoPorId = new Map(trabajos.map((t) => [t.id, t]))
    return actividades.map((actividad) => {
      const funcion = funcionPorId.get(actividad.funcionId)
      const trabajo = funcion ? trabajoPorId.get(funcion.trabajoId) : undefined
      return {
        ...actividad,
        funcionNombre: funcion?.nombre || '(función eliminada)',
        trabajoId: funcion?.trabajoId || null,
        trabajoNombre: trabajo?.nombre || '(trabajo eliminado)',
      }
    })
  }, [actividades, funciones, trabajos])

  // ---- Mutaciones: escriben en dataService y recargan el estado ----

  const crearTrabajo = useCallback(async (datos) => {
    await dataService.crearTrabajoService(datos)
    await refrescar()
  }, [refrescar])

  const actualizarTrabajo = useCallback(async (id, cambios) => {
    await dataService.actualizarTrabajo(id, cambios)
    await refrescar()
  }, [refrescar])

  const eliminarTrabajo = useCallback(async (id) => {
    await dataService.eliminarTrabajo(id)
    await refrescar()
  }, [refrescar])

  const crearFuncion = useCallback(async (datos) => {
    await dataService.crearFuncionService(datos)
    await refrescar()
  }, [refrescar])

  const actualizarFuncion = useCallback(async (id, cambios) => {
    await dataService.actualizarFuncion(id, cambios)
    await refrescar()
  }, [refrescar])

  const eliminarFuncion = useCallback(async (id) => {
    await dataService.eliminarFuncion(id)
    await refrescar()
  }, [refrescar])

  const crearActividad = useCallback(async (datos) => {
    await dataService.crearActividadService(datos)
    await refrescar()
  }, [refrescar])

  const actualizarActividad = useCallback(async (id, cambios) => {
    await dataService.actualizarActividad(id, cambios)
    await refrescar()
  }, [refrescar])

  const eliminarActividad = useCallback(async (id) => {
    await dataService.eliminarActividad(id)
    await refrescar()
  }, [refrescar])

  const exportarDatos = useCallback(() => dataService.exportarDatos(), [])

  const importarDatos = useCallback(
    async (json, opciones) => {
      const resultado = await dataService.importarDatos(json, opciones)
      await refrescar()
      return resultado
    },
    [refrescar],
  )

  const value = {
    loading,
    error,
    trabajos,
    funciones,
    actividades,
    actividadesConContexto,
    arbol,
    resumen,
    refrescar,
    crearTrabajo,
    actualizarTrabajo,
    eliminarTrabajo,
    crearFuncion,
    actualizarFuncion,
    eliminarFuncion,
    crearActividad,
    actualizarActividad,
    eliminarActividad,
    exportarDatos,
    importarDatos,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de <DataProvider>')
  return ctx
}
