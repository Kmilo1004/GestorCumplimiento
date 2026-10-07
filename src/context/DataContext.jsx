import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as dataService from '../services/dataService'
import { unicasSinMayusculas } from '../models'
import { aISO, sumarDias } from '../utils/fechas'

const MINUTO = 60_000
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
  // Sube cada vez que la agenda puede haber cambiado (guardado o relectura de
  // la carpeta), para que las vistas del calendario vuelvan a leerla.
  const [versionAgenda, setVersionAgenda] = useState(0)
  const handleRef = useRef(null)

  const refrescar = useCallback(async ({ recargar = false } = {}) => {
    try {
      setError(null)
      const datos = await dataService.cargarTodo({ recargar })
      setTrabajos(datos.trabajos)
      setFunciones(datos.funciones)
      setActividades(datos.actividades)
      if (recargar) setVersionAgenda((v) => v + 1)
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

  // Compromisos que ya pasaron -> hechos. Al abrir la bóveda se revisa toda la
  // agenda; luego, cada minuto, solo hoy y ayer (por si pasó la medianoche).
  useEffect(() => {
    if (boveda.estado !== 'lista') return
    let activo = true
    const revisar = async (completo) => {
      try {
        const ahora = new Date()
        const cambiadas = await dataService.marcarCompromisosPasados(ahora, {
          desde: completo ? null : sumarDias(aISO(ahora), -1),
        })
        if (activo && cambiadas > 0) setVersionAgenda((v) => v + 1)
      } catch (err) {
        console.error('No se pudieron marcar los compromisos pasados:', err)
      }
    }
    revisar(true)
    const intervalo = setInterval(() => revisar(false), MINUTO)
    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [boveda.estado, boveda.nombre])

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

  // trabajoId -> actividades (con contexto), para tarjetas y menús.
  const actividadesPorTrabajo = useMemo(() => {
    const mapa = new Map()
    for (const a of actividadesConContexto) {
      if (!mapa.has(a.trabajoId)) mapa.set(a.trabajoId, [])
      mapa.get(a.trabajoId).push(a)
    }
    return mapa
  }, [actividadesConContexto])

  // ---- Mutaciones: escriben en dataService y recargan el estado ----

  const crearTrabajo = useCallback(async (datos) => {
    const creado = await dataService.crearTrabajoService(datos)
    await refrescar()
    return creado
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
    const creado = await dataService.crearFuncionService(datos)
    await refrescar()
    return creado
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
    const creado = await dataService.crearActividadService(datos)
    await refrescar()
    return creado
  }, [refrescar])

  const actualizarActividad = useCallback(async (id, cambios) => {
    await dataService.actualizarActividad(id, cambios)
    await refrescar()
  }, [refrescar])

  const eliminarActividad = useCallback(async (id) => {
    await dataService.eliminarActividad(id)
    await refrescar()
  }, [refrescar])

  // Devuelve la actividad actualizada para que el formulario refresque su lista.
  const eliminarEvidencia = useCallback(
    async (actividadId, nombre) => {
      const actividad = await dataService.eliminarEvidencia(actividadId, nombre)
      await refrescar()
      return actividad
    },
    [refrescar],
  )

  const leerEvidencia = useCallback((actividadId, nombre) => dataService.leerEvidencia(actividadId, nombre), [])

  // Todas las etiquetas en uso, para sugerirlas al escribir.
  const etiquetas = useMemo(
    () => unicasSinMayusculas(actividades.flatMap((a) => a.tags ?? [])).sort((a, b) => a.localeCompare(b, 'es')),
    [actividades],
  )

  // ---- Agenda ----

  const listarAgenda = useCallback((desde, hasta) => dataService.listarAgenda(desde, hasta), [])
  const leerNotaDiaria = useCallback((fecha) => dataService.leerNotaDiaria(fecha), [])
  const guardarNotaDiaria = useCallback(async (fecha, datos) => {
    const nota = await dataService.guardarNotaDiaria(fecha, datos)
    setVersionAgenda((v) => v + 1)
    return nota
  }, [])
  const modificarNotaDiaria = useCallback(async (fecha, transformar) => {
    const nota = await dataService.modificarNotaDiaria(fecha, transformar)
    setVersionAgenda((v) => v + 1)
    return nota
  }, [])

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
    actividadesPorTrabajo,
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
    eliminarEvidencia,
    leerEvidencia,
    etiquetas,
    versionAgenda,
    listarAgenda,
    leerNotaDiaria,
    guardarNotaDiaria,
    modificarNotaDiaria,
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
