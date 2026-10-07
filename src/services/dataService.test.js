import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryFs } from './fs/memoryFs'
import { createVaultRepository } from './vault/vaultRepository'
import * as dataService from './dataService'

let fs

async function sembrarFuncion() {
  const t = await dataService.crearTrabajoService({ nombre: 'Alcaldía' })
  return dataService.crearFuncionService({ trabajoId: t.id, nombre: 'Planeación' })
}

beforeEach(() => {
  fs = createMemoryFs()
  dataService.usarRepositorio(createVaultRepository(fs))
})

describe('actividades recurrentes', () => {
  it('el nombre incluye el periodo y la serie se guarda aparte', async () => {
    const f = await sembrarFuncion()
    const a = await dataService.crearActividadService({
      funcionId: f.id,
      nombre: 'Informe mensual',
      recurrencia: 'mensual',
      fecha_limite: '2026-10-31',
    })
    expect(a).toMatchObject({ nombre: 'Informe mensual 2026-10', serie: 'Informe mensual' })
    expect(fs._snapshot()['Trabajos/Alcaldía/Planeación/Informe mensual 2026-10.md']).toContain(
      'serie: Informe mensual',
    )
  })

  it('al completarla crea el siguiente periodo con los mismos datos', async () => {
    const f = await sembrarFuncion()
    const a = await dataService.crearActividadService({
      funcionId: f.id,
      nombre: 'Informe mensual',
      recurrencia: 'mensual',
      fecha_limite: '2026-10-31',
      prioridad: 'alta',
      tags: ['informe'],
      notas: 'solo de octubre',
    })
    await dataService.actualizarActividad(a.id, { estado: 'completada' })

    const { actividades } = await dataService.cargarTodo()
    expect(actividades).toHaveLength(2)
    const siguiente = actividades.find((x) => x.id !== a.id)
    expect(siguiente).toMatchObject({
      nombre: 'Informe mensual 2026-11',
      fecha_limite: '2026-11-30',
      estado: 'pendiente',
      prioridad: 'alta',
      tags: ['informe'],
      notas: '',
    })
  })

  it('desmarcar y volver a completar no duplica el siguiente periodo', async () => {
    const f = await sembrarFuncion()
    const a = await dataService.crearActividadService({
      funcionId: f.id,
      nombre: 'Informe',
      recurrencia: 'mensual',
      fecha_limite: '2026-10-31',
    })
    await dataService.actualizarActividad(a.id, { estado: 'completada' })
    await dataService.actualizarActividad(a.id, { estado: 'pendiente' })
    await dataService.actualizarActividad(a.id, { estado: 'completada' })
    expect((await dataService.cargarTodo()).actividades).toHaveLength(2)
  })

  it('cambiar la fecha renombra la nota al nuevo periodo', async () => {
    const f = await sembrarFuncion()
    const a = await dataService.crearActividadService({
      funcionId: f.id,
      nombre: 'Informe',
      recurrencia: 'trimestral',
      fecha_limite: '2026-10-31',
    })
    const editada = await dataService.actualizarActividad(a.id, { fecha_limite: '2027-01-15' })
    expect(editada.nombre).toBe('Informe 2027-T1')
  })
})

describe('evidencias', () => {
  it('se adjuntan al crear y se pueden leer y eliminar', async () => {
    const f = await sembrarFuncion()
    const archivo = new File(['%PDF-1.4'], 'Acta: firmada.pdf', { type: 'application/pdf' })
    const a = await dataService.crearActividadService({ funcionId: f.id, nombre: 'Comité', archivos: [archivo] })

    expect(a.evidencias).toEqual(['Acta- firmada.pdf'])
    const blob = await dataService.leerEvidencia(a.id, 'Acta- firmada.pdf')
    expect(await blob.text()).toBe('%PDF-1.4')

    const sinEvidencia = await dataService.eliminarEvidencia(a.id, 'Acta- firmada.pdf')
    expect(sinEvidencia.evidencias).toEqual([])
    expect(Object.keys(fs._snapshot()).some((p) => p.startsWith('.papelera/') && p.endsWith('Acta- firmada.pdf'))).toBe(
      true,
    )
  })

  it('no permite rutas fuera de la carpeta de evidencias', async () => {
    const f = await sembrarFuncion()
    const a = await dataService.crearActividadService({ funcionId: f.id, nombre: 'Comité' })
    await expect(dataService.leerEvidencia(a.id, '../_funcion.md')).rejects.toThrow()
  })
})

describe('recurrentes creadas o renombradas a mano', () => {
  it('sin serie en el frontmatter no duplica el periodo', async () => {
    fs = createMemoryFs({
      'Trabajos/T/F/Informe mensual 2026-10.md': '---\nid: a1\nrecurrencia: mensual\nfecha_limite: 2026-10-31\n---\n',
    })
    dataService.usarRepositorio(createVaultRepository(fs))
    await dataService.actualizarActividad('a1', { estado: 'completada' })
    const nombres = (await dataService.cargarTodo()).actividades.map((a) => a.nombre).sort()
    expect(nombres).toEqual(['Informe mensual 2026-10', 'Informe mensual 2026-11'])
  })

  it('respeta el nombre que el usuario le dio a la nota', async () => {
    fs = createMemoryFs({
      'Trabajos/T/F/Informe octubre.md':
        '---\nid: a1\nrecurrencia: mensual\nserie: Informe\nfecha_limite: 2026-10-31\n---\n',
    })
    dataService.usarRepositorio(createVaultRepository(fs))
    // Así llega desde el formulario: la serie en `nombre`.
    await dataService.actualizarActividad('a1', { nombre: 'Informe', serie: 'Informe', prioridad: 'alta' })
    expect(Object.keys(fs._snapshot())).toContain('Trabajos/T/F/Informe octubre.md')
    // Cambiar la fecha sí lo lleva al nombre del nuevo periodo.
    const movida = await dataService.actualizarActividad('a1', { fecha_limite: '2026-11-30' })
    expect(movida.nombre).toBe('Informe 2026-11')
  })

  it('crear un periodo ya completado programa el siguiente', async () => {
    const f = await sembrarFuncion()
    await dataService.crearActividadService({
      funcionId: f.id,
      nombre: 'Informe',
      recurrencia: 'mensual',
      fecha_limite: '2026-09-30',
      estado: 'completada',
    })
    const nombres = (await dataService.cargarTodo()).actividades.map((a) => a.nombre).sort()
    expect(nombres).toEqual(['Informe 2026-09', 'Informe 2026-10'])
  })
})

describe('evidencias huérfanas', () => {
  it('renombrar hacia una carpeta de evidencias existente no mezcla archivos', async () => {
    const f = await sembrarFuncion()
    await fs.writeFile('Trabajos/Alcaldía/Planeación/Evidencias/Acta/viejo.pdf', 'huérfano')
    const a = await dataService.crearActividadService({
      funcionId: f.id,
      nombre: 'Comité',
      archivos: [new File(['nuevo'], 'acta.pdf')],
    })
    const renombrada = await dataService.actualizarActividad(a.id, { nombre: 'Acta' })
    expect(renombrada.evidencias).toEqual(['acta.pdf'])
    const archivos = Object.keys(fs._snapshot())
    expect(archivos).toContain('Trabajos/Alcaldía/Planeación/Evidencias/Acta/acta.pdf')
    expect(archivos).not.toContain('Trabajos/Alcaldía/Planeación/Evidencias/Acta/viejo.pdf')
    expect(archivos.some((p) => p.startsWith('.papelera/') && p.endsWith('Evidencias/Acta/viejo.pdf'))).toBe(true)
  })
})
