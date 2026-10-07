// Utilidades de rutas para la bóveda. Las rutas son siempre relativas a la
// raíz de la bóveda y usan "/" como separador, sin importar el sistema
// operativo: 'Trabajos/Secretaría/_trabajo.md'.

export function joinPath(...partes) {
  return partes
    .filter((p) => p !== undefined && p !== null && p !== '')
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '')
}

export function splitPath(ruta) {
  return ruta.split('/').filter(Boolean)
}

// Caracteres no permitidos en nombres de archivo en Windows (y "/" en todos).
// oxlint-disable-next-line no-control-regex -- los caracteres de control no son válidos en nombres de archivo
const INVALIDOS = /[\\/:*?"<>|\u0000-\u001f]/g
const RESERVADOS_WINDOWS = /^(con|prn|aux|nul|com\d|lpt\d)$/i

// Convierte un nombre visible ("Informe Q1/Q2") en un nombre de archivo o
// carpeta válido ("Informe Q1-Q2"). Nunca devuelve cadena vacía.
export function nombreSeguro(nombre) {
  let limpio = String(nombre ?? '')
    .replace(INVALIDOS, '-')
    .replace(/\s+/g, ' ')
    .trim()
    // Windows no admite nombres terminados en punto o espacio.
    .replace(/[. ]+$/, '')
    // Un nombre que empieza por "." quedaría oculto (.papelera, .cumplimiento).
    .replace(/^\.+/, '')
  if (RESERVADOS_WINDOWS.test(limpio)) limpio = `${limpio}_`
  if (limpio.length > 120) limpio = limpio.slice(0, 120).trim()
  return limpio || 'Sin nombre'
}
