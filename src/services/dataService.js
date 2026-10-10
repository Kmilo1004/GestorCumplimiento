// dataService: API pública de datos que usa la UI (a través de DataContext).
//
// Esta es la ÚNICA capa que la interfaz conoce. Los datos viven en una
// bóveda de carpetas con archivos Markdown (ver
// docs/adr/0001-persistencia-en-boveda-de-carpetas.md). El acceso a disco
// está detrás de la interfaz de `services/fs`, así que pasar a Tauri solo
// requiere otra implementación de esa interfaz, no cambios aquí ni en la UI.

import { ESTADOS, crearActividad, crearFuncion, crearTrabajo } from '../models'
import { esFechaValida, nombreDePeriodo, serieDe, siguienteFecha } from '../utils/recurrencia'
import { createWebFs } from './fs/webFs'
import { createVaultRepository } from './vault/vaultRepository'
import { mensajeExceso } from './vault/limiteRuta'

// Selección de la carpeta y migración: se exponen aquí para que el Context
// no dependa de los módulos internos de services/.
export {
  carpetaGuardada,
  elegirCarpeta,
  estadoPermiso,
  guardarConfig,
  leerConfig,
  navegadorCompatible,
  pedirPermiso,
} from './vault/vaultHandle'
export { leerDatosAnteriores } from './legacyIndexedDB'

const EXPORT_VERSION = 1

let repo = null

// Conecta la bóveda (carpeta elegida por el usuario) como almacenamiento.
export function conectarBoveda(directoryHandle) {
  repo = createVaultRepository(createWebFs(directoryHandle))
}

// Permite usar otro repositorio (las pruebas usan uno sobre el fs en memoria).
export function usarRepositorio(repositorio) {
  repo = repositorio
}

function repositorio() {
  if (!repo) throw new Error('No hay una bóveda abierta.')
  return repo
}

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es')

// ---------- Carga completa ----------

// Trae las tres colecciones; DataContext arma el árbol. Con `recargar` vuelve
// a leer las carpetas para reflejar cambios hechos fuera de la app.
export async function cargarTodo({ recargar = false } = {}) {
  const { trabajos, funciones, actividades } = await repositorio().cargar({ recargar })
  return {
    trabajos: trabajos.sort(porNombre),
    funciones: funciones.sort(porNombre),
    actividades: actividades.sort((a, b) => (a.fecha_limite || '').localeCompare(b.fecha_limite || '')),
  }
}

// Aviso si guardar `entidad` dejaría una ruta demasiado larga para Windows
// ('' si cabe). tipo: 'trabajo' | 'funcion' | 'actividad'. Sirve para avisar
// mientras se escribe; el repositorio vuelve a revisarlo al guardar.
export function avisoLargoRuta(tipo, entidad) {
  if (!repo) return ''
  const exceso = repo.excesoDeRuta(tipo, entidad)
  return exceso ? mensajeExceso(tipo, exceso) : ''
}

async function actualizar(tipo, guardar, id, cambios, mensaje) {
  const actual = await repositorio().obtener(tipo, id)
  if (!actual) throw new Error(mensaje)
  return guardar({ ...actual, ...cambios, id, updatedAt: new Date().toISOString() })
}

// ---------- Trabajos ----------

export function crearTrabajoService(datos) {
  return repositorio().guardarTrabajo(crearTrabajo(datos))
}

export function actualizarTrabajo(id, cambios) {
  return actualizar('trabajo', repositorio().guardarTrabajo, id, cambios, 'Trabajo no encontrado')
}

export function eliminarTrabajo(id) {
  return repositorio().eliminarTrabajo(id)
}

// ---------- Funciones ----------

export function crearFuncionService(datos) {
  return repositorio().guardarFuncion(crearFuncion(datos))
}

export function actualizarFuncion(id, cambios) {
  return actualizar('funcion', repositorio().guardarFuncion, id, cambios, 'Función no encontrada')
}

export function eliminarFuncion(id) {
  return repositorio().eliminarFuncion(id)
}

// ---------- Actividades ----------

// Una actividad recurrente se nombra "<serie> <periodo>" ("Informe mensual
// 2026-10"). Si no tiene serie todavía, se deduce del nombre (ver serieDe).
function conNombreDePeriodo(actividad) {
  if (!actividad.recurrencia) return { ...actividad, serie: '' }
  const serie = serieDe(actividad)
  const nombre = esFechaValida(actividad.fecha_limite)
    ? nombreDePeriodo(serie, actividad.fecha_limite, actividad.recurrencia)
    : serie
  return { ...actividad, serie, nombre }
}

// Al completar una actividad recurrente se crea la del siguiente periodo,
// salvo que ya exista (p. ej. si se desmarcó y se volvió a marcar).
async function crearSiguientePeriodo(actividad) {
  const fecha = siguienteFecha(actividad.fecha_limite, actividad.recurrencia)
  if (!fecha) return null
  const { actividades } = await repositorio().cargar()
  const yaExiste = actividades.some(
    (a) => a.funcionId === actividad.funcionId && a.serie === actividad.serie && a.fecha_limite === fecha,
  )
  if (yaExiste) return null
  return repositorio().guardarActividad(
    conNombreDePeriodo(
      crearActividad({
        funcionId: actividad.funcionId,
        serie: actividad.serie,
        descripcion: actividad.descripcion,
        prioridad: actividad.prioridad,
        tags: actividad.tags,
        recurrencia: actividad.recurrencia,
        camposPersonalizados: actividad.camposPersonalizados,
        fecha_limite: fecha,
      }),
    ),
  )
}

const esRecurrenteCompletada = (a) => a.estado === ESTADOS.COMPLETADA && Boolean(a.recurrencia)

// `archivos` (opcional): File[] que se copian como evidencias.
export async function crearActividadService({ archivos = [], ...datos }) {
  let actividad = await repositorio().guardarActividad(conNombreDePeriodo(crearActividad(datos)))
  if (archivos.length) actividad = await repositorio().agregarEvidencias(actividad.id, archivos)
  // Registrar un periodo ya cumplido también programa el siguiente.
  if (esRecurrenteCompletada(actividad)) await crearSiguientePeriodo(actividad)
  return actividad
}

// ¿El cambio afecta el nombre de periodo? Si no, y el usuario renombró la
// nota a mano (ya no sigue "<serie> <periodo>"), se respeta su nombre.
function debeRenombrarPeriodo(actual, nueva) {
  if (!nueva.recurrencia) return false
  const cambioPeriodo =
    actual.recurrencia !== nueva.recurrencia ||
    actual.fecha_limite !== nueva.fecha_limite ||
    serieDe(actual) !== serieDe(nueva)
  const seguiaConvencion =
    !actual.recurrencia || actual.nombre === nombreDePeriodo(serieDe(actual), actual.fecha_limite, actual.recurrencia)
  return cambioPeriodo || seguiaConvencion
}

export async function actualizarActividad(id, { archivos = [], ...cambios }) {
  const actual = await repositorio().obtener('actividad', id)
  if (!actual) throw new Error('Actividad no encontrada')
  const nueva = { ...actual, ...cambios, id, updatedAt: new Date().toISOString() }
  const aGuardar = debeRenombrarPeriodo(actual, nueva)
    ? conNombreDePeriodo(nueva)
    : // En una recurrente el formulario manda la serie en `nombre`: se conserva
      // el nombre que el usuario le dio a la nota.
      { ...nueva, nombre: nueva.recurrencia ? actual.nombre : nueva.nombre, serie: nueva.recurrencia ? serieDe(nueva) : '' }
  let actividad = await repositorio().guardarActividad(aGuardar)
  if (archivos.length) actividad = await repositorio().agregarEvidencias(id, archivos)
  if (actual.estado !== ESTADOS.COMPLETADA && esRecurrenteCompletada(actividad)) {
    await crearSiguientePeriodo(actividad)
  }
  return actividad
}

export function eliminarEvidencia(actividadId, nombre) {
  return repositorio().eliminarEvidencia(actividadId, nombre)
}

// Devuelve el archivo (Blob) para abrirlo o descargarlo.
export function leerEvidencia(actividadId, nombre) {
  return repositorio().leerEvidencia(actividadId, nombre)
}

export function eliminarActividad(id) {
  return repositorio().eliminarActividad(id)
}

// ---------- Agenda: notas diarias y compromisos ----------

// [{ fecha, compromisos, notas, existe }] de los días que tienen nota.
export function listarAgenda(desde, hasta) {
  return repositorio().listarAgenda(desde, hasta)
}

export function leerNotaDiaria(fecha) {
  return repositorio().leerNotaDelDia(fecha)
}

// compromisos: [{ hecho, inicio, fin, titulo }]; notas: texto libre.
export function guardarNotaDiaria(fecha, { compromisos, notas }) {
  return repositorio().guardarNotaDelDia(fecha, { compromisos, notas })
}

// Marca hechos los compromisos que ya pasaron (desde `desde` o en toda la
// agenda). Devuelve cuántas notas cambiaron.
export function marcarCompromisosPasados(ahora, opciones) {
  return repositorio().marcarCompromisosPasados(ahora, opciones)
}

// Cambio atómico: transformar({ compromisos, notas }) -> { compromisos, notas }.
export function modificarNotaDiaria(fecha, transformar) {
  return repositorio().modificarNotaDelDia(fecha, transformar)
}

// ---------- Configuración de la bóveda ----------

// [{ clave, etiqueta, tipo, opciones, aplicaA }] definidos en Configuración.
export function leerCamposPersonalizados() {
  return repositorio().leerCampos()
}

// Reemplaza la lista completa de definiciones. Devuelve la lista normalizada.
export function guardarCamposPersonalizados(campos) {
  return repositorio().guardarCampos(campos)
}

// { formato, creadoEn } de la bóveda abierta.
export function leerInfoBoveda() {
  return repositorio().leerInfoBoveda()
}

// ---------- Backup: exportar / importar JSON ----------

export async function exportarDatos() {
  const { trabajos, funciones, actividades } = await cargarTodo()
  return {
    app: 'app-cumplimiento',
    version: EXPORT_VERSION,
    exportadoEn: new Date().toISOString(),
    trabajos,
    funciones,
    actividades,
  }
}

function validarBackup(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no tiene un formato JSON válido.')
  }
  const { trabajos, funciones, actividades } = data
  if (!Array.isArray(trabajos) || !Array.isArray(funciones) || !Array.isArray(actividades)) {
    throw new Error('El archivo no corresponde a un backup de esta app (faltan trabajos/funciones/actividades).')
  }
}

// modo: 'reemplazar' mueve todo lo existente a la papelera antes de importar.
// modo: 'combinar' agrega o actualiza por id sobre lo que ya existe.
// También sirve para migrar los datos de la versión anterior (IndexedDB).
// Devuelve cuántos elementos se omitieron por no tener a qué padre pertenecer.
export async function importarDatos(data, { modo = 'reemplazar' } = {}) {
  validarBackup(data)
  const r = repositorio()

  if (modo === 'reemplazar') await r.vaciar()

  const actual = await r.cargar()
  const trabajoIds = new Set(actual.trabajos.map((t) => t.id))
  const funcionIds = new Set(actual.funciones.map((f) => f.id))
  let omitidos = 0
  // Un elemento que no se puede guardar (p. ej. nombre demasiado largo para
  // Windows) se omite junto con lo que cuelga de él, sin cortar la importación.
  const intentar = async (guardar) => {
    try {
      await guardar()
      return true
    } catch (err) {
      console.error(err)
      omitidos++
      return false
    }
  }

  for (const t of data.trabajos) {
    if (await intentar(() => r.guardarTrabajo({ ...crearTrabajo(t), ...t }))) trabajoIds.add(t.id)
  }
  for (const f of data.funciones) {
    if (!trabajoIds.has(f.trabajoId)) {
      omitidos++
      continue
    }
    if (await intentar(() => r.guardarFuncion({ ...crearFuncion(f), ...f }))) funcionIds.add(f.id)
  }
  for (const a of data.actividades) {
    if (!funcionIds.has(a.funcionId)) {
      omitidos++
      continue
    }
    await intentar(() => r.guardarActividad({ ...crearActividad(a), ...a }))
  }

  return { omitidos }
}
