// Implementación en memoria de la interfaz de sistema de archivos.
// Se usa en las pruebas y sirve como referencia del contrato que debe
// cumplir cualquier implementación (webFs hoy, tauriFs en el futuro):
//
//   listDir(ruta)            -> [{ name, kind: 'file' | 'directory' }] | null si no existe
//   readFile(ruta)           -> string | null si no existe
//   readBlob(ruta)           -> Blob | null si no existe (adjuntos binarios)
//   writeFile(ruta, datos)   -> texto o Blob/File; crea las carpetas intermedias si faltan
//   copyFile(origen, destino)-> copia el contenido tal cual (sirve para binarios)
//   mkdir(ruta)              -> crea la carpeta (y sus padres) si no existe
//   remove(ruta)             -> borra archivo o carpeta (recursivo); no falla si no existe
//   exists(ruta)             -> boolean

import { joinPath, splitPath } from './paths'

export function createMemoryFs(archivosIniciales = {}) {
  const archivos = new Map() // ruta -> contenido
  const carpetas = new Set(['']) // rutas de carpetas existentes

  function asegurarCarpetas(ruta) {
    const partes = splitPath(ruta)
    for (let i = 1; i <= partes.length; i++) {
      carpetas.add(partes.slice(0, i).join('/'))
    }
  }

  function padre(ruta) {
    return splitPath(ruta).slice(0, -1).join('/')
  }

  const fs = {
    async listDir(ruta = '') {
      const base = joinPath(ruta)
      if (!carpetas.has(base)) return null
      const prefijo = base ? `${base}/` : ''
      const vistos = new Map()
      for (const c of carpetas) {
        if (c && c.startsWith(prefijo) && !c.slice(prefijo.length).includes('/')) {
          vistos.set(c.slice(prefijo.length), 'directory')
        }
      }
      for (const a of archivos.keys()) {
        if (a.startsWith(prefijo) && !a.slice(prefijo.length).includes('/')) {
          vistos.set(a.slice(prefijo.length), 'file')
        }
      }
      return [...vistos].map(([name, kind]) => ({ name, kind }))
    },

    async readFile(ruta) {
      const r = joinPath(ruta)
      return archivos.has(r) ? archivos.get(r) : null
    },

    async readBlob(ruta) {
      const r = joinPath(ruta)
      if (!archivos.has(r)) return null
      const contenido = archivos.get(r)
      return contenido instanceof Blob ? contenido : new Blob([contenido])
    },

    async writeFile(ruta, contenido) {
      const r = joinPath(ruta)
      if (carpetas.has(r)) throw new Error(`Ya existe una carpeta en ${r}`)
      asegurarCarpetas(padre(r))
      archivos.set(r, contenido)
    },

    async copyFile(origen, destino) {
      const o = joinPath(origen)
      if (!archivos.has(o)) throw new Error(`No existe el archivo ${o}`)
      await fs.writeFile(destino, archivos.get(o))
    },

    async mkdir(ruta) {
      asegurarCarpetas(joinPath(ruta))
    },

    async remove(ruta) {
      const r = joinPath(ruta)
      archivos.delete(r)
      const prefijo = `${r}/`
      for (const a of [...archivos.keys()]) if (a.startsWith(prefijo)) archivos.delete(a)
      for (const c of [...carpetas]) if (c === r || c.startsWith(prefijo)) carpetas.delete(c)
    },

    // Sin distinguir mayúsculas, para comportarse como Windows.
    async exists(ruta) {
      const r = joinPath(ruta).toLocaleLowerCase('es')
      const igual = (x) => x.toLocaleLowerCase('es') === r
      return [...archivos.keys()].some(igual) || [...carpetas].some(igual)
    },

    // Solo para pruebas: foto del contenido actual.
    _snapshot() {
      return Object.fromEntries([...archivos].sort(([a], [b]) => a.localeCompare(b)))
    },
  }

  for (const [ruta, contenido] of Object.entries(archivosIniciales)) {
    asegurarCarpetas(padre(joinPath(ruta)))
    archivos.set(joinPath(ruta), contenido)
  }

  return fs
}
