import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryFs } from '../fs/memoryFs'
import { crearActividad, crearFuncion, crearTrabajo } from '../../models'
import { separarFrontmatter } from './markdown'
import { createVaultRepository } from './vaultRepository'

const fecha = new Date('2026-10-07T12:00:00.000Z')

async function sembrar(repo) {
  const t = await repo.guardarTrabajo(crearTrabajo({ nombre: 'Secretaría', descripcion: 'Despacho' }))
  const f = await repo.guardarFuncion(crearFuncion({ trabajoId: t.id, nombre: 'Gestión documental' }))
  const a = await repo.guardarActividad(
    crearActividad({ funcionId: f.id, nombre: 'Responder PQRS', fecha_limite: '2026-10-15', notas: 'n' }),
  )
  return { t, f, a }
}

describe('vaultRepository', () => {
  let fs
  let repo

  beforeEach(() => {
    fs = createMemoryFs()
    repo = createVaultRepository(fs, { ahora: () => fecha })
  })

  it('crea la estructura de carpetas tipo Obsidian', async () => {
    await sembrar(repo)
    expect(Object.keys(fs._snapshot())).toEqual([
      '.cumplimiento/config.json',
      'Trabajos/Secretaría/_trabajo.md',
      'Trabajos/Secretaría/Gestión documental/_funcion.md',
      'Trabajos/Secretaría/Gestión documental/Responder PQRS.md',
    ])
  })

  it('una bóveda nueva lee lo que escribió otra instancia', async () => {
    const { t, f, a } = await sembrar(repo)
    const otro = createVaultRepository(fs, { ahora: () => fecha })
    const datos = await otro.cargar()
    expect(datos.trabajos).toEqual([t])
    expect(datos.funciones).toEqual([f])
    expect(datos.actividades).toEqual([a])
  })

  it('renombrar un trabajo mueve su carpeta con todo dentro', async () => {
    const { t, a } = await sembrar(repo)
    await repo.guardarTrabajo({ ...t, nombre: 'Secretaría de Hacienda' })
    const archivos = Object.keys(fs._snapshot())
    expect(archivos).toContain('Trabajos/Secretaría de Hacienda/Gestión documental/Responder PQRS.md')
    expect(archivos.some((p) => p.startsWith('Trabajos/Secretaría/'))).toBe(false)
    const datos = await createVaultRepository(fs).cargar()
    expect(datos.actividades[0].id).toBe(a.id)
  })

  it('cambiar de función mueve el archivo de la actividad', async () => {
    const { t, a } = await sembrar(repo)
    const f2 = await repo.guardarFuncion(crearFuncion({ trabajoId: t.id, nombre: 'Contratación' }))
    await repo.guardarActividad({ ...a, funcionId: f2.id })
    expect(fs._snapshot()['Trabajos/Secretaría/Contratación/Responder PQRS.md']).toBeDefined()
    expect(fs._snapshot()['Trabajos/Secretaría/Gestión documental/Responder PQRS.md']).toBeUndefined()
  })

  it('nombres repetidos reciben sufijo y el nombre visible coincide con el archivo', async () => {
    const { f } = await sembrar(repo)
    const otra = await repo.guardarActividad(crearActividad({ funcionId: f.id, nombre: 'Responder PQRS' }))
    expect(otra.nombre).toBe('Responder PQRS (2)')
  })

  it('eliminar mueve a .papelera en lugar de borrar', async () => {
    const { t } = await sembrar(repo)
    await repo.eliminarTrabajo(t.id)
    const archivos = Object.keys(fs._snapshot())
    expect(archivos.some((p) => p.startsWith('Trabajos/'))).toBe(false)
    expect(archivos).toContain(
      '.papelera/2026-10-07T12-00-00-000Z/Trabajos/Secretaría/Gestión documental/Responder PQRS.md',
    )
    expect(await repo.cargar()).toEqual({ trabajos: [], funciones: [], actividades: [] })
  })

  it('adopta carpetas y notas creadas a mano (asigna id y lo guarda)', async () => {
    fs = createMemoryFs({
      'Trabajos/Alcaldía/Planeación/Plan de acción.md': '---\nestado: completada\ntags: [x]\n---\nTexto',
      'Trabajos/Alcaldía/Planeación/adjunto.pdf': 'binario',
    })
    repo = createVaultRepository(fs, { ahora: () => fecha })
    const { trabajos, funciones, actividades } = await repo.cargar()
    expect(trabajos[0].nombre).toBe('Alcaldía')
    expect(funciones[0].trabajoId).toBe(trabajos[0].id)
    expect(actividades).toHaveLength(1)
    expect(actividades[0]).toMatchObject({ nombre: 'Plan de acción', estado: 'completada', descripcion: 'Texto' })

    const nota = separarFrontmatter(fs._snapshot()['Trabajos/Alcaldía/Planeación/Plan de acción.md'])
    expect(nota.frontmatter.id).toBe(actividades[0].id)
    expect(nota.frontmatter.tags).toEqual(['x'])
    expect(nota.cuerpo).toBe('Texto\n')
  })

  it('editar una nota hecha a mano no cambia su nombre de archivo', async () => {
    fs = createMemoryFs({ 'Trabajos/T/F/Acta  final.md': '---\nid: a1\n---\n' })
    repo = createVaultRepository(fs, { ahora: () => fecha })
    const { actividades } = await repo.cargar()
    await repo.guardarActividad({ ...actividades[0], estado: 'completada' })
    expect(Object.keys(fs._snapshot())).toContain('Trabajos/T/F/Acta  final.md')
  })

  it('reasigna ids repetidos (carpeta copiada en el explorador)', async () => {
    const { t } = await sembrar(repo)
    const snap = fs._snapshot()
    for (const [ruta, contenido] of Object.entries(snap)) {
      if (ruta.startsWith('Trabajos/Secretaría/')) {
        await fs.writeFile(ruta.replace('Trabajos/Secretaría/', 'Trabajos/Secretaría - copia/'), contenido)
      }
    }
    const datos = await repo.cargar({ recargar: true })
    const ids = [...datos.trabajos, ...datos.funciones, ...datos.actividades].map((e) => e.id)
    expect(new Set(ids).size).toBe(6)
    expect(datos.trabajos.find((x) => x.nombre === 'Secretaría').id).toBe(t.id)
  })

  it('las escrituras concurrentes no se pisan', async () => {
    const { f } = await sembrar(repo)
    await Promise.all(
      Array.from({ length: 5 }, () => repo.guardarActividad(crearActividad({ funcionId: f.id, nombre: 'Tarea' }))),
    )
    const { actividades } = await repo.cargar({ recargar: true })
    expect(actividades.filter((a) => a.nombre.startsWith('Tarea'))).toHaveLength(5)
  })
})
