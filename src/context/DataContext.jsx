import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as dataService from '../services/dataService'
import { construirArbol, resumenGeneral } from '../utils/compliance'

// Estados de la bóveda:
//   'iniciando'   -> buscando la carpeta guardada
//   'sin-soporte' -> el navegador no permite acceder a carpetas (usar Chrome/Edge)
//   'sin-boveda'  -> aún no se ha elegido carpeta
//   'sin-permiso' -> hay carpeta guardada pero el navegador pide confirmar el acceso
//   'lista'       -> bóveda abierta
const CLAVE_MIGRACION = 'migracionIndexedDBResuelta'
const {
  carpetaGuardada,
  elegirCarpeta,
  estadoPermiso,
  guardarConfig,
  leerConfig,
  leerDatosAnteriores,
  navegadorCompatible,
  pedirPermiso,
} = dataService

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [trabajos, setTrabajos] = useState([])
  const [funciones, setFunciones] = useState([])
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [boveda, setBoveda] = useState({ estado: 'iniciando', nombre: '' })
  const [migracionPendiente, setMigracionPendiente] = useState(null)
  const handleRef = useRef(null)

  const refrescar = useCallback(async ({ recargar = false } = {}) => {
    try {
      setError(null)
      const datos = await dataService.cargarTodo({ recargar })
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

  // ---- Bóveda (carpeta en disco) ----

  const abrirBoveda = useCallback(
    async (handle) => {
      handleRef.current = handle
      dataService.conectarBoveda(handle)
      setLoading(true)
      setBoveda({ estado: 'lista', nombre: handle.name })
      await refrescar({ recargar: true })
      try {
        if (!(await leerConfig(CLAVE_MIGRACION))) {
          setMigracionPendiente(await leerDatosAnteriores())
        }
      } catch (err) {
        console.error(err)
      }
    },
    [refrescar],
  )

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      if (!navegadorCompatible()) {
        setBoveda({ estado: 'sin-soporte', nombre: '' })
        return
      }
      const handle = await carpetaGuardada()
      if (cancelado) return
      if (!handle) {
        setBoveda({ estado: 'sin-boveda', nombre: '' })
        return
      }
      handleRef.current = handle
      if ((await estadoPermiso(handle)) === 'granted') {
        if (!cancelado) await abrirBoveda(handle)
      } else if (!cancelado) {
        setBoveda({ estado: 'sin-permiso', nombre: handle.name })
      }
    })().catch((err) => {
      console.error(err)
      setBoveda({ estado: 'sin-boveda', nombre: '' })
    })
    return () => {
      cancelado = true
    }
  }, [abrirBoveda])

  // Al volver a la app se releen las carpetas, para reflejar cambios hechos
  // en Obsidian o en el explorador de archivos.
  useEffect(() => {
    if (boveda.estado !== 'lista') return
    // 'focus' y 'visibilitychange' suelen dispararse juntos: una sola relectura.
    let ultima = 0
    const alVolver = () => {
      if (document.visibilityState !== 'visible' || Date.now() - ultima < 1000) return
      ultima = Date.now()
      refrescar({ recargar: true })
    }
    window.addEventListener('focus', alVolver)
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.removeEventListener('focus', alVolver)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [boveda.estado, refrescar])

  // Deben llamarse desde un clic (el navegador lo exige).
  const elegirBoveda = useCallback(async () => {
    try {
      await abrirBoveda(await elegirCarpeta())
    } catch (err) {
      if (err?.name !== 'AbortError') throw err
    }
  }, [abrirBoveda])

  const reabrirBoveda = useCallback(async () => {
    const handle = handleRef.current
    if (!handle) return
    if ((await pedirPermiso(handle)) !== 'granted') {
      throw new Error('No se concedió acceso a la carpeta. Vuelve a intentarlo y elige "Permitir".')
    }
    await abrirBoveda(handle)
  }, [abrirBoveda])

  const resolverMigracion = useCallback(
    async ({ importar }) => {
      if (importar && migracionPendiente) {
        await dataService.importarDatos(migracionPendiente, { modo: 'combinar' })
        await refrescar()
      }
      await guardarConfig(CLAVE_MIGRACION, true)
      setMigracionPendiente(null)
    },
    [migracionPendiente, refrescar],
  )

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
    boveda,
    elegirBoveda,
    reabrirBoveda,
    migracionPendiente,
    resolverMigracion,
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
