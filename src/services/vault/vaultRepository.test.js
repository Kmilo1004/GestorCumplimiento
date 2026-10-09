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

describe('evidencias en la bóveda', () => {
  it('se leen de la carpeta (también las agregadas desde el explorador)', async () => {
    const fs = createMemoryFs({
      'Trabajos/T/F/Comité.md': '---\nid: a1\n---\n',
      'Trabajos/T/F/Evidencias/Comité/acta.pdf': 'x',
      'Trabajos/T/F/Evidencias/Comité/foto.jpg': 'y',
    })
    const { actividades } = await createVaultRepository(fs).cargar()
    expect(actividades[0].evidencias).toEqual(['acta.pdf', 'foto.jpg'])
  })

  it('se mueven al renombrar la actividad o cambiarla de función', async () => {
    const fs = createMemoryFs()
    const repo = createVaultRepository(fs, { ahora: () => fecha })
    const { t, a } = await sembrar(repo)
    await repo.agregarEvidencias(a.id, [new File(['x'], 'acta.pdf')])
    const f2 = await repo.guardarFuncion(crearFuncion({ trabajoId: t.id, nombre: 'Contratación' }))
    const movida = await repo.guardarActividad({ ...a, nombre: 'PQRS octubre', funcionId: f2.id })

    expect(movida.evidencias).toEqual(['acta.pdf'])
    const archivos = Object.keys(fs._snapshot())
    expect(archivos).toContain('Trabajos/Secretaría/Contratación/Evidencias/PQRS octubre/acta.pdf')
    expect(archivos.some((p) => p.includes('Gestión documental/Evidencias'))).toBe(false)
  })

  it('van a la papelera junto con la actividad', async () => {
    const fs = createMemoryFs()
    const repo = createVaultRepository(fs, { ahora: () => fecha })
    const { a } = await sembrar(repo)
    await repo.agregarEvidencias(a.id, [new File(['x'], 'acta.pdf')])
    await repo.eliminarActividad(a.id)
    expect(Object.keys(fs._snapshot()).filter((p) => p.startsWith('Trabajos/') && p.includes('Evidencias'))).toEqual([])
  })
})

describe('vaultRepository: campos personalizados', () => {
  let fs
  let repo
  const RADICADO = { clave: 'radicado', etiqueta: 'Radicado', tipo: 'texto', aplicaA: ['actividad'] }

  beforeEach(() => {
    fs = createMemoryFs()
    repo = createVaultRepository(fs, { ahora: () => fecha })
  })

  it('sin campos.json no hay campos y la bóveda abre igual', async () => {
    await sembrar(repo)
    expect(await repo.leerCampos()).toEqual([])
  })

  it('guarda las definiciones en .cumplimiento/campos.json y las vuelve a leer', async () => {
    await repo.guardarCampos([RADICADO])
    const guardado = JSON.parse(fs._snapshot()['.cumplimiento/campos.json'])
    expect(guardado.campos).toEqual([{ ...RADICADO, opciones: [] }])
    expect(await createVaultRepository(fs).leerCampos()).toEqual([{ ...RADICADO, opciones: [] }])
  })

  it('descarta definiciones con clave reservada o repetida', async () => {
    const campos = await repo.guardarCampos([
      RADICADO,
      { etiqueta: 'Estado', tipo: 'texto', aplicaA: ['actividad'] },
      { ...RADICADO, etiqueta: 'Otro radicado' },
    ])
    expect(campos.map((c) => c.clave)).toEqual(['radicado'])
  })

  it('un campos.json dañado no impide abrir la bóveda', async () => {
    await fs.writeFile('.cumplimiento/campos.json', '{ esto no es json')
    await sembrar(repo)
    expect(await repo.leerCampos()).toEqual([])
    expect((await repo.cargar({ recargar: true })).actividades).toHaveLength(1)
  })

  it('el valor se escribe en el frontmatter y se lee de vuelta', async () => {
    await repo.guardarCampos([RADICADO])
    const { a } = await sembrar(repo)
    await repo.guardarActividad({ ...a, camposPersonalizados: { radicado: 'RAD-2026-001' } })
    const { frontmatter } = separarFrontmatter(fs._snapshot()['Trabajos/Secretaría/Gestión documental/Responder PQRS.md'])
    expect(frontmatter.radicado).toBe('RAD-2026-001')
    const datos = await createVaultRepository(fs).cargar()
    expect(datos.actividades[0].camposPersonalizados).toEqual({ radicado: 'RAD-2026-001' })
  })

  it('vaciar el campo quita la clave del archivo', async () => {
    await repo.guardarCampos([RADICADO])
    const { a } = await sembrar(repo)
    const conValor = await repo.guardarActividad({ ...a, camposPersonalizados: { radicado: 'RAD-1' } })
    await repo.guardarActividad({ ...conValor, camposPersonalizados: { radicado: '' } })
    const { frontmatter } = separarFrontmatter(fs._snapshot()['Trabajos/Secretaría/Gestión documental/Responder PQRS.md'])
    expect(frontmatter).not.toHaveProperty('radicado')
  })

  it('al definir un campo se leen los valores que ya estaban en los archivos', async () => {
    await sembrar(repo)
    const ruta = 'Trabajos/Secretaría/Gestión documental/Responder PQRS.md'
    const texto = fs._snapshot()[ruta]
    await fs.writeFile(ruta, texto.replace('tipo: actividad', 'tipo: actividad\nradicado: RAD-9'))
    await repo.cargar({ recargar: true })
    expect((await repo.cargar()).actividades[0].camposPersonalizados).toEqual({})
    await repo.guardarCampos([RADICADO])
    expect((await repo.cargar()).actividades[0].camposPersonalizados).toEqual({ radicado: 'RAD-9' })
  })

  it('una clave sin definición sigue en el archivo pero no se muestra', async () => {
    const { a } = await sembrar(repo)
    const ruta = 'Trabajos/Secretaría/Gestión documental/Responder PQRS.md'
    await fs.writeFile(ruta, fs._snapshot()[ruta].replace('tipo: actividad', 'tipo: actividad\nproyecto: X'))
    const datos = await repo.cargar({ recargar: true })
    expect(datos.actividades[0].camposPersonalizados).toEqual({})
    await repo.guardarActividad({ ...datos.actividades[0], notas: 'otra' })
    expect(separarFrontmatter(fs._snapshot()[ruta]).frontmatter.proyecto).toBe('X')
    expect(a.id).toBe(datos.actividades[0].id)
  })

  it('los campos de trabajo y función se guardan en _trabajo.md y _funcion.md', async () => {
    await repo.guardarCampos([{ clave: 'codigo', etiqueta: 'Código', tipo: 'texto', aplicaA: ['trabajo', 'funcion'] }])
    const { t, f } = await sembrar(repo)
    await repo.guardarTrabajo({ ...t, camposPersonalizados: { codigo: 'T-1' } })
    await repo.guardarFuncion({ ...f, camposPersonalizados: { codigo: 'F-1' } })
    const datos = await createVaultRepository(fs).cargar()
    expect(datos.trabajos[0].camposPersonalizados).toEqual({ codigo: 'T-1' })
    expect(datos.funciones[0].camposPersonalizados).toEqual({ codigo: 'F-1' })
  })

  it('lee el formato y la fecha de creación de la bóveda', async () => {
    expect(await repo.leerInfoBoveda()).toEqual({ formato: 1, creadoEn: fecha.toISOString() })
  })
})
