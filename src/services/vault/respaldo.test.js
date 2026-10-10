import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryFs } from '../fs/memoryFs'
import { crearActividad, crearFuncion, crearTrabajo } from '../../models'
import { createVaultRepository } from './vaultRepository'
import {
  ARCHIVO_MARCA,
  crearRespaldo,
  listarRespaldos,
  selloDeRespaldo,
  tocaRespaldo,
  ultimoRespaldo,
} from './respaldo'

const BOVEDA = 'MiBoveda'
const hora = (h, dia = 9) => new Date(2026, 9, dia, h, 0, 0)

describe('respaldo', () => {
  let origen
  let destino

  beforeEach(async () => {
    origen = createMemoryFs()
    destino = createMemoryFs()
    const repo = createVaultRepository(origen)
    const t = await repo.guardarTrabajo(crearTrabajo({ nombre: 'Secretaría' }))
    const f = await repo.guardarFuncion(crearFuncion({ trabajoId: t.id, nombre: 'PQRS' }))
    const a = await repo.guardarActividad(crearActividad({ funcionId: f.id, nombre: 'Responder' }))
    await repo.agregarEvidencias(a.id, [new File([new Uint8Array([1, 2, 3])], 'acta.pdf')])
    await repo.eliminarActividad((await repo.guardarActividad(crearActividad({ funcionId: f.id, nombre: 'Borrada' }))).id)
  })

  it('copia toda la bóveda con evidencias, sin la papelera', async () => {
    const r = await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(15) })
    expect(r.carpeta).toBe('MiBoveda/2026-10-09 15-00')
    const copiados = Object.keys(destino._snapshot())
    expect(copiados).toContain('MiBoveda/2026-10-09 15-00/Trabajos/Secretaría/PQRS/Responder.md')
    expect(copiados).toContain('MiBoveda/2026-10-09 15-00/Trabajos/Secretaría/PQRS/Evidencias/Responder/acta.pdf')
    expect(copiados).toContain('MiBoveda/2026-10-09 15-00/.cumplimiento/config.json')
    expect(copiados.some((p) => p.includes('.papelera'))).toBe(false)
    const pdf = await destino.readBlob('MiBoveda/2026-10-09 15-00/Trabajos/Secretaría/PQRS/Evidencias/Responder/acta.pdf')
    expect([...new Uint8Array(await pdf.arrayBuffer())]).toEqual([1, 2, 3])
    expect(r.fallidos).toEqual([])
  })

  it('la última copia es la completa más reciente', async () => {
    await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(9) })
    await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(15) })
    expect((await ultimoRespaldo(destino, BOVEDA)).creadoEn).toBe(hora(15).toISOString())
  })

  it('una copia cortada (sin marca) no cuenta como respaldo', async () => {
    await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(9) })
    await destino.writeFile('MiBoveda/2026-10-09 18-00/Trabajos/x.md', 'a medias')
    expect((await ultimoRespaldo(destino, BOVEDA)).creadoEn).toBe(hora(9).toISOString())
  })

  it('conserva solo las últimas 10 y borra las cortadas', async () => {
    await destino.writeFile('MiBoveda/2026-10-01 08-00/Trabajos/x.md', 'a medias')
    for (let dia = 2; dia <= 13; dia++) {
      await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(8, dia) })
    }
    const respaldos = await listarRespaldos(destino, BOVEDA)
    expect(respaldos).toHaveLength(10)
    expect(respaldos.every((r) => r.completa)).toBe(true)
    expect(respaldos.at(-1).nombre).toBe('2026-10-04 08-00')
  })

  it('dos copias en el mismo minuto no se pisan', async () => {
    const a = await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(15) })
    const b = await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(15) })
    expect(a.carpeta).not.toBe(b.carpeta)
    expect(await listarRespaldos(destino, BOVEDA)).toHaveLength(2)
  })

  it('si un archivo falla sigue con los demás y lo anota', async () => {
    const original = destino.writeFile
    destino.writeFile = async (ruta, datos) => {
      if (ruta.endsWith('acta.pdf')) throw new Error('ruta demasiado larga')
      return original(ruta, datos)
    }
    const r = await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(15) })
    expect(r.fallidos).toEqual(['Trabajos/Secretaría/PQRS/Evidencias/Responder/acta.pdf'])
    expect(r.archivos).toBeGreaterThan(0)
    const marca = JSON.parse(await destino.readFile(`${r.carpeta}/${ARCHIVO_MARCA}`))
    expect(marca.fallidos).toHaveLength(1)
  })

  it('las copias de otra bóveda van en su propia carpeta', async () => {
    await crearRespaldo(origen, destino, { nombreBoveda: BOVEDA, ahora: hora(9) })
    await crearRespaldo(origen, destino, { nombreBoveda: 'Otra', ahora: hora(9) })
    expect(await listarRespaldos(destino, BOVEDA)).toHaveLength(1)
    expect(await listarRespaldos(destino, 'Otra')).toHaveLength(1)
  })

  it('el sello usa la hora local y no tiene ":"', () => {
    expect(selloDeRespaldo(new Date(2026, 0, 5, 7, 3))).toBe('2026-01-05 07-03')
  })
})

describe('tocaRespaldo', () => {
  const base = new Date(2026, 9, 9, 8, 0).toISOString()
  const mas = (horas) => new Date(new Date(base).getTime() + horas * 3_600_000)

  it('sin copias previas toca de inmediato, salvo si está desactivado', () => {
    expect(tocaRespaldo(null, 'diaria')).toBe(true)
    expect(tocaRespaldo(null, 'desactivada')).toBe(false)
  })

  it('respeta cada 12 horas, diaria y semanal', () => {
    expect(tocaRespaldo(base, '12h', mas(11))).toBe(false)
    expect(tocaRespaldo(base, '12h', mas(12))).toBe(true)
    expect(tocaRespaldo(base, 'diaria', mas(23))).toBe(false)
    expect(tocaRespaldo(base, 'diaria', mas(24))).toBe(true)
    expect(tocaRespaldo(base, 'semanal', mas(24 * 6))).toBe(false)
    expect(tocaRespaldo(base, 'semanal', mas(24 * 7))).toBe(true)
  })

  it('tolera unos minutos para no correr la hora cada día', () => {
    expect(tocaRespaldo(base, 'diaria', mas(24 - 3 / 60))).toBe(true)
  })
})

describe('vaultRepository.respaldarEn', () => {
  it('respalda pasando por la cola del repositorio', async () => {
    const origen = createMemoryFs()
    const destino = createMemoryFs()
    const repo = createVaultRepository(origen, { ahora: () => hora(10) })
    await repo.guardarTrabajo(crearTrabajo({ nombre: 'Secretaría' }))
    const r = await repo.respaldarEn(destino, { nombreBoveda: BOVEDA })
    expect(r.creadoEn).toBe(hora(10).toISOString())
    expect(Object.keys(destino._snapshot())).toContain('MiBoveda/2026-10-09 10-00/Trabajos/Secretaría/_trabajo.md')
  })
})
