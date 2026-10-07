// Implementación de la interfaz de sistema de archivos con la File System
// Access API del navegador (Chrome / Edge). Recibe el FileSystemDirectoryHandle
// de la carpeta raíz de la bóveda. El contrato está documentado en memoryFs.js.

import { joinPath, splitPath } from './paths'

function esNoEncontrado(err) {
  return err?.name === 'NotFoundError' || err?.name === 'TypeMismatchError'
}

export function createWebFs(raiz) {
  async function carpeta(partes, { crear = false } = {}) {
    let actual = raiz
    for (const nombre of partes) {
      actual = await actual.getDirectoryHandle(nombre, { create: crear })
    }
    return actual
  }

  async function archivo(ruta, { crear = false } = {}) {
    const partes = splitPath(ruta)
    const nombre = partes.pop()
    const dir = await carpeta(partes, { crear })
    return dir.getFileHandle(nombre, { create: crear })
  }

  async function escribir(ruta, datos) {
    const handle = await archivo(ruta, { crear: true })
    const writable = await handle.createWritable()
    try {
      await writable.write(datos)
    } finally {
      await writable.close()
    }
  }

  return {
    async listDir(ruta = '') {
      let dir
      try {
        dir = await carpeta(splitPath(ruta))
      } catch (err) {
        if (esNoEncontrado(err)) return null
        throw err
      }
      const entradas = []
      for await (const [name, handle] of dir.entries()) {
        entradas.push({ name, kind: handle.kind })
      }
      return entradas
    },

    async readFile(ruta) {
      try {
        const handle = await archivo(ruta)
        const file = await handle.getFile()
        return await file.text()
      } catch (err) {
        if (esNoEncontrado(err)) return null
        throw err
      }
    },

    async writeFile(ruta, contenido) {
      await escribir(ruta, contenido)
    },

    async copyFile(origen, destino) {
      const file = await (await archivo(origen)).getFile()
      await escribir(destino, file)
    },

    async mkdir(ruta) {
      await carpeta(splitPath(ruta), { crear: true })
    },

    async remove(ruta) {
      const partes = splitPath(joinPath(ruta))
      const nombre = partes.pop()
      try {
        const dir = await carpeta(partes)
        await dir.removeEntry(nombre, { recursive: true })
      } catch (err) {
        if (!esNoEncontrado(err)) throw err
      }
    },

    async exists(ruta) {
      const partes = splitPath(ruta)
      if (!partes.length) return true
      const nombre = partes.pop()
      try {
        const dir = await carpeta(partes)
        // Sin distinguir mayúsculas, igual que el sistema de archivos de Windows.
        const buscado = nombre.toLocaleLowerCase('es')
        for await (const clave of dir.keys()) {
          if (clave.toLocaleLowerCase('es') === buscado) return true
        }
        return false
      } catch (err) {
        if (esNoEncontrado(err)) return false
        throw err
      }
    },
  }
}
