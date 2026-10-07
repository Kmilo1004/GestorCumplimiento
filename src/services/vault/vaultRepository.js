// Repositorio de la bóveda: guarda Trabajos, Funciones y Actividades como
// carpetas y archivos Markdown (ver docs/adr/0001-persistencia-en-boveda-de-carpetas.md).
//
//   Trabajos/<Trabajo>/_trabajo.md
//   Trabajos/<Trabajo>/<Función>/_funcion.md
//   Trabajos/<Trabajo>/<Función>/<Actividad>.md
//   Trabajos/<Trabajo>/<Función>/Evidencias/<Actividad>/<adjuntos>
//
// Reglas:
// - El nombre de cada entidad es el nombre de su carpeta o archivo.
// - La jerarquía es la ubicación: trabajoId / funcionId se deducen de la
//   carpeta donde está el archivo, no se guardan en él.
// - Eliminar mueve a .papelera/<fecha>/… ; nunca se borra definitivamente.
// - Las evidencias de una actividad son los archivos de su carpeta en
//   Evidencias/: la carpeta es la fuente de verdad (se pueden agregar desde
//   el explorador) y se mueve junto con la actividad.
// - Si un archivo no tiene id (creado a mano) o tiene uno repetido (carpeta
//   copiada), se le asigna uno nuevo al leer la bóveda.
//
// Depende solo de la interfaz de sistema de archivos (services/fs), así que
// funciona igual con la File System Access API, en memoria (tests) o con
// Tauri en el futuro.

import { generarId } from '../../models'
import { joinPath, nombreSeguro } from '../fs/paths'
import { moveEntry, mismaRuta, rutaDisponible } from '../fs/fsUtils'
import {
  actualizarFrontmatter,
  escribirActividad,
  escribirContenedor,
  leerActividad,
  leerContenedor,
} from './markdown'

export const CARPETA_TRABAJOS = 'Trabajos'
export const CARPETA_PAPELERA = '.papelera'
export const ARCHIVO_CONFIG = '.cumplimiento/config.json'
export const ARCHIVO_TRABAJO = '_trabajo.md'
export const ARCHIVO_FUNCION = '_funcion.md'
export const CARPETA_EVIDENCIAS = 'Evidencias'
export const FORMATO_BOVEDA = 1

const EXT = '.md'

function esNotaDeActividad({ name, kind }) {
  return kind === 'file' && name.toLowerCase().endsWith(EXT) && !name.startsWith('_') && !name.startsWith('.')
}

function esCarpetaVisible({ name, kind }) {
  return kind === 'directory' && !name.startsWith('.')
}

function sinExtension(nombreArchivo) {
  return nombreArchivo.slice(0, -EXT.length)
}

// "Acta final.pdf" -> { base: 'Acta final', extension: '.pdf' }
function partirNombreArchivo(nombre) {
  const punto = nombre.lastIndexOf('.')
  if (punto <= 0) return { base: nombre, extension: '' }
  return { base: nombre.slice(0, punto), extension: nombre.slice(punto).toLowerCase() }
}

const esArchivoVisible = ({ name, kind }) => kind === 'file' && !name.startsWith('.')

export function createVaultRepository(fs, { ahora = () => new Date() } = {}) {
  // Índice en memoria. Para cada entidad se guarda la entidad tal como la ve
  // la UI y el nombre real en disco (`carpeta` o `archivo`).
  let trabajos = new Map() // id -> { entidad, carpeta }
  let funciones = new Map() // id -> { entidad, carpeta }
  let actividades = new Map() // id -> { entidad, archivo }
  let cargado = false

  // Todas las escrituras pasan por esta cola para que dos operaciones
  // rápidas seguidas (p. ej. doble clic) no se pisen en disco.
  let cola = Promise.resolve()
  function enCola(tarea) {
    const resultado = cola.then(tarea)
    cola = resultado.catch(() => {})
    return resultado
  }

  // ---------- Rutas ----------

  function rutaTrabajo(trabajoId) {
    const t = trabajos.get(trabajoId)
    if (!t) throw new Error('Trabajo no encontrado')
    return joinPath(CARPETA_TRABAJOS, t.carpeta)
  }

  function rutaFuncion(funcionId) {
    const f = funciones.get(funcionId)
    if (!f) throw new Error('Función no encontrada')
    return joinPath(rutaTrabajo(f.entidad.trabajoId), f.carpeta)
  }

  function rutaEvidencias(actividadId) {
    const a = actividades.get(actividadId)
    if (!a) throw new Error('Actividad no encontrada')
    return joinPath(rutaFuncion(a.entidad.funcionId), CARPETA_EVIDENCIAS, sinExtension(a.archivo))
  }

  function rutaActividad(actividadId) {
    const a = actividades.get(actividadId)
    if (!a) throw new Error('Actividad no encontrada')
    return joinPath(rutaFuncion(a.entidad.funcionId), a.archivo)
  }

  // ---------- Inicialización y lectura ----------

  async function inicializar() {
    await fs.mkdir(CARPETA_TRABAJOS)
    if (!(await fs.exists(ARCHIVO_CONFIG))) {
      const config = { app: 'app-cumplimiento', formato: FORMATO_BOVEDA, creadoEn: ahora().toISOString() }
      await fs.writeFile(ARCHIVO_CONFIG, `${JSON.stringify(config, null, 2)}\n`)
    }
  }

  // Interpreta un archivo de entidad y, si le falta el id o lo tiene
  // repetido, le asigna uno nuevo reescribiendo solo su frontmatter.
  async function conId(ruta, original, lector, idsUsados, frontmatterBase) {
    const { datos } = lector(original ?? '')
    const momento = ahora().toISOString()
    datos.createdAt = datos.createdAt || momento
    datos.updatedAt = datos.updatedAt || datos.createdAt
    const reparar = !datos.id || idsUsados.has(datos.id)
    if (reparar) datos.id = generarId()
    idsUsados.add(datos.id)
    if (reparar) {
      await fs.writeFile(
        ruta,
        actualizarFrontmatter(original ?? '', {
          ...frontmatterBase(datos),
          id: datos.id,
          createdAt: datos.createdAt,
          updatedAt: datos.updatedAt,
        }),
      )
    }
    return datos
  }

  // Lista una carpeta en orden alfabético: así, si hay ids repetidos (carpeta
  // copiada), siempre conserva el id el mismo archivo ("X" antes que "X - copia").
  async function listarOrdenado(ruta, filtro) {
    const entradas = ((await fs.listDir(ruta)) ?? []).filter(filtro)
    return entradas.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }

  // Evidencias/<Actividad>/* de una función -> Map(nombreActividad -> [archivos])
  async function leerEvidenciasDeFuncion(rutaF) {
    const carpetas = await listarOrdenado(joinPath(rutaF, CARPETA_EVIDENCIAS), esCarpetaVisible)
    const archivos = await Promise.all(
      carpetas.map(({ name }) => listarOrdenado(joinPath(rutaF, CARPETA_EVIDENCIAS, name), esArchivoVisible)),
    )
    return new Map(carpetas.map(({ name }, i) => [name, archivos[i].map((a) => a.name)]))
  }

  // Lee varios archivos en paralelo (la lectura es lo lento en disco).
  function leerTodos(rutas) {
    return Promise.all(rutas.map((r) => fs.readFile(r)))
  }

  async function escanear() {
    await inicializar()
    const nuevosTrabajos = new Map()
    const nuevasFunciones = new Map()
    const nuevasActividades = new Map()
    const ids = new Set()

    const dirsTrabajo = await listarOrdenado(CARPETA_TRABAJOS, esCarpetaVisible)
    const rutasT = dirsTrabajo.map(({ name }) => joinPath(CARPETA_TRABAJOS, name))
    const [textosT, contenidosT] = await Promise.all([
      leerTodos(rutasT.map((r) => joinPath(r, ARCHIVO_TRABAJO))),
      Promise.all(rutasT.map((r) => listarOrdenado(r, esCarpetaVisible))),
    ])

    for (const [i, dirTrabajo] of dirsTrabajo.entries()) {
      const rutaT = rutasT[i]
      const datosT = await conId(joinPath(rutaT, ARCHIVO_TRABAJO), textosT[i], leerContenedor, ids, () => ({
        tipo: 'trabajo',
      }))
      const trabajo = { ...datosT, nombre: dirTrabajo.name }
      nuevosTrabajos.set(trabajo.id, { entidad: trabajo, carpeta: dirTrabajo.name })

      const dirsFuncion = contenidosT[i]
      const rutasF = dirsFuncion.map(({ name }) => joinPath(rutaT, name))
      const [textosF, notasF] = await Promise.all([
        leerTodos(rutasF.map((r) => joinPath(r, ARCHIVO_FUNCION))),
        Promise.all(
          rutasF.map((r) =>
            Promise.all([listarOrdenado(r, esNotaDeActividad), leerEvidenciasDeFuncion(r)]),
          ),
        ),
      ])

      for (const [j, dirFuncion] of dirsFuncion.entries()) {
        const rutaF = rutasF[j]
        const datosF = await conId(joinPath(rutaF, ARCHIVO_FUNCION), textosF[j], leerContenedor, ids, () => ({
          tipo: 'funcion',
        }))
        const funcion = { ...datosF, trabajoId: trabajo.id, nombre: dirFuncion.name }
        nuevasFunciones.set(funcion.id, { entidad: funcion, carpeta: dirFuncion.name })

        const [notas, evidencias] = notasF[j]
        const textosA = await leerTodos(notas.map(({ name }) => joinPath(rutaF, name)))
        for (const [k, nota] of notas.entries()) {
          const datosA = await conId(joinPath(rutaF, nota.name), textosA[k], leerActividad, ids, (d) => ({
            tipo: 'actividad',
            estado: d.estado,
          }))
          const nombre = sinExtension(nota.name)
          const actividad = { ...datosA, funcionId: funcion.id, nombre, evidencias: evidencias.get(nombre) ?? [] }
          nuevasActividades.set(actividad.id, { entidad: actividad, archivo: nota.name })
        }
      }
    }

    trabajos = nuevosTrabajos
    funciones = nuevasFunciones
    actividades = nuevasActividades
    cargado = true
  }

  function foto() {
    const valores = (mapa) => [...mapa.values()].map(({ entidad }) => ({ ...entidad }))
    return { trabajos: valores(trabajos), funciones: valores(funciones), actividades: valores(actividades) }
  }

  // Devuelve todo el contenido. Con `recargar` vuelve a leer el disco
  // (para ver cambios hechos fuera de la app, p. ej. en Obsidian).
  function cargar({ recargar = false } = {}) {
    return enCola(async () => {
      if (recargar || !cargado) await escanear()
      return foto()
    })
  }

  async function asegurarCargado() {
    if (!cargado) await escanear()
  }

  // ---------- Escritura genérica ----------

  // Coloca la carpeta/archivo de una entidad en `carpetaPadre` con el nombre
  // deseado. Si ya existía en otra ruta (renombrado o cambio de padre) la
  // mueve. Devuelve el nombre final en disco (puede llevar " (2)").
  // Si el nombre no cambió se conserva el del disco tal cual, para no
  // renombrar notas hechas a mano (y romper sus [[enlaces]]) al editarlas.
  async function ubicar({ carpetaPadre, nombreDeseado, extension, rutaActual, nombreActual }) {
    const sinCambio = rutaActual && String(nombreDeseado ?? '').trim() === nombreActual
    const base = sinCambio ? nombreActual : nombreSeguro(nombreDeseado)
    const objetivo = joinPath(carpetaPadre, `${base}${extension}`)
    if (rutaActual && mismaRuta(rutaActual, objetivo)) {
      if (rutaActual !== objetivo) await moveEntry(fs, rutaActual, objetivo) // solo cambió mayúsculas
      return `${base}${extension}`
    }
    const destino = await rutaDisponible(fs, carpetaPadre, base, extension)
    if (rutaActual) await moveEntry(fs, rutaActual, destino)
    return destino.slice(carpetaPadre.length + 1)
  }

  async function aPapelera(ruta) {
    const sello = ahora().toISOString().replace(/[:.]/g, '-')
    const destino = await rutaDisponible(fs, joinPath(CARPETA_PAPELERA, sello), ruta)
    await moveEntry(fs, ruta, destino)
  }

  // ---------- Trabajos ----------

  function guardarTrabajo(trabajo) {
    return enCola(async () => {
      await asegurarCargado()
      const previo = trabajos.get(trabajo.id)
      const carpeta = await ubicar({
        carpetaPadre: CARPETA_TRABAJOS,
        nombreDeseado: trabajo.nombre,
        extension: '',
        rutaActual: previo ? rutaTrabajo(trabajo.id) : null,
        nombreActual: previo?.entidad.nombre,
      })
      const entidad = { ...trabajo, nombre: carpeta }
      const ruta = joinPath(CARPETA_TRABAJOS, carpeta, ARCHIVO_TRABAJO)
      await fs.writeFile(ruta, escribirContenedor('trabajo', entidad, (await fs.readFile(ruta)) ?? ''))
      trabajos.set(entidad.id, { entidad, carpeta })
      return { ...entidad }
    })
  }

  function eliminarTrabajo(id) {
    return enCola(async () => {
      await asegurarCargado()
      await aPapelera(rutaTrabajo(id))
      trabajos.delete(id)
      for (const [fid, f] of funciones) {
        if (f.entidad.trabajoId !== id) continue
        funciones.delete(fid)
        for (const [aid, a] of actividades) if (a.entidad.funcionId === fid) actividades.delete(aid)
      }
    })
  }

  // ---------- Funciones ----------

  function guardarFuncion(funcion) {
    return enCola(async () => {
      await asegurarCargado()
      const carpetaPadre = rutaTrabajo(funcion.trabajoId)
      const previo = funciones.get(funcion.id)
      const carpeta = await ubicar({
        carpetaPadre,
        nombreDeseado: funcion.nombre,
        extension: '',
        rutaActual: previo ? rutaFuncion(funcion.id) : null,
        nombreActual: previo?.entidad.nombre,
      })
      const entidad = { ...funcion, nombre: carpeta }
      const ruta = joinPath(carpetaPadre, carpeta, ARCHIVO_FUNCION)
      await fs.writeFile(ruta, escribirContenedor('funcion', entidad, (await fs.readFile(ruta)) ?? ''))
      funciones.set(entidad.id, { entidad, carpeta })
      return { ...entidad }
    })
  }

  function eliminarFuncion(id) {
    return enCola(async () => {
      await asegurarCargado()
      await aPapelera(rutaFuncion(id))
      funciones.delete(id)
      for (const [aid, a] of actividades) if (a.entidad.funcionId === id) actividades.delete(aid)
    })
  }

  // ---------- Actividades ----------

  function guardarActividad(actividad) {
    return enCola(async () => {
      await asegurarCargado()
      const carpetaPadre = rutaFuncion(actividad.funcionId)
      const previo = actividades.get(actividad.id)
      const evidenciasAntes = previo ? rutaEvidencias(actividad.id) : null
      const archivo = await ubicar({
        carpetaPadre,
        nombreDeseado: actividad.nombre,
        extension: EXT,
        rutaActual: previo ? rutaActividad(actividad.id) : null,
        nombreActual: previo?.entidad.nombre,
      })
      // Las evidencias las decide la carpeta, no quien llama.
      const entidad = { ...actividad, nombre: sinExtension(archivo), evidencias: previo?.entidad.evidencias ?? [] }
      const ruta = joinPath(carpetaPadre, archivo)
      await fs.writeFile(ruta, escribirActividad(entidad, (await fs.readFile(ruta)) ?? ''))
      actividades.set(entidad.id, { entidad, archivo })
      // Renombrada o movida de función: su carpeta de evidencias la acompaña.
      const evidenciasDespues = rutaEvidencias(entidad.id)
      if (evidenciasAntes && evidenciasAntes !== evidenciasDespues && (await fs.exists(evidenciasAntes))) {
        // Si ya hay una carpeta con el nombre nuevo no es de ninguna actividad
        // (ubicar garantizó que el nombre está libre): se aparta a la papelera
        // en vez de mezclar o sobrescribir archivos.
        if (!mismaRuta(evidenciasAntes, evidenciasDespues) && (await fs.exists(evidenciasDespues))) {
          await aPapelera(evidenciasDespues)
        }
        await moveEntry(fs, evidenciasAntes, evidenciasDespues)
      }
      return { ...entidad }
    })
  }

  function eliminarActividad(id) {
    return enCola(async () => {
      await asegurarCargado()
      const evidencias = rutaEvidencias(id)
      await aPapelera(rutaActividad(id))
      if (await fs.exists(evidencias)) await aPapelera(evidencias)
      actividades.delete(id)
    })
  }

  // ---------- Evidencias ----------

  // Solo se aceptan nombres que existen en la carpeta (evita rutas como "../x").
  function rutaDeEvidencia(id, nombre) {
    if (!actividades.get(id)?.entidad.evidencias.includes(nombre)) {
      throw new Error('La evidencia no pertenece a esta actividad.')
    }
    return joinPath(rutaEvidencias(id), nombre)
  }

  async function refrescarEvidencias(id) {
    const item = actividades.get(id)
    const lista = await listarOrdenado(rutaEvidencias(id), esArchivoVisible)
    item.entidad = { ...item.entidad, evidencias: lista.map((a) => a.name) }
    return { ...item.entidad }
  }

  // Copia archivos (File/Blob con .name) a la carpeta de evidencias de la
  // actividad. Devuelve la actividad actualizada.
  function agregarEvidencias(id, archivos) {
    return enCola(async () => {
      await asegurarCargado()
      const carpeta = rutaEvidencias(id)
      for (const archivo of archivos) {
        const { base, extension } = partirNombreArchivo(archivo.name || 'evidencia')
        const destino = await rutaDisponible(fs, carpeta, nombreSeguro(base), extension)
        await fs.writeFile(destino, archivo)
      }
      return refrescarEvidencias(id)
    })
  }

  function eliminarEvidencia(id, nombre) {
    return enCola(async () => {
      await asegurarCargado()
      await aPapelera(rutaDeEvidencia(id, nombre))
      return refrescarEvidencias(id)
    })
  }

  function leerEvidencia(id, nombre) {
    return enCola(async () => {
      await asegurarCargado()
      const blob = await fs.readBlob(rutaDeEvidencia(id, nombre))
      if (!blob) throw new Error('La evidencia ya no existe en la carpeta.')
      return blob
    })
  }

  // ---------- Consultas puntuales ----------

  function obtener(tipo, id) {
    return enCola(async () => {
      await asegurarCargado()
      const mapa = { trabajo: trabajos, funcion: funciones, actividad: actividades }[tipo]
      const item = mapa.get(id)
      return item ? { ...item.entidad } : undefined
    })
  }

  // Mueve todo el contenido de Trabajos/ a la papelera (importar "reemplazar").
  function vaciar() {
    return enCola(async () => {
      await asegurarCargado()
      const entradas = (await fs.listDir(CARPETA_TRABAJOS)) ?? []
      for (const { name } of entradas) await aPapelera(joinPath(CARPETA_TRABAJOS, name))
      trabajos = new Map()
      funciones = new Map()
      actividades = new Map()
    })
  }

  return {
    cargar,
    obtener,
    guardarTrabajo,
    eliminarTrabajo,
    guardarFuncion,
    eliminarFuncion,
    guardarActividad,
    eliminarActividad,
    vaciar,
    agregarEvidencias,
    eliminarEvidencia,
    leerEvidencia,
  }
}
