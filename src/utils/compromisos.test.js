import { describe, expect, it } from 'vitest'
import { marcarPasados, siguienteEstado, yaPaso } from './compromisos'

const ahora = new Date(2026, 9, 7, 11, 30) // 7 oct 2026, 11:30 hora local
const c = (inicio = '', fin = '', extra = {}) => ({ titulo: 'x', inicio, fin, hecho: false, cancelado: false, ...extra })

describe('yaPaso', () => {
  it.each([
    ['2026-10-06', c(), true, 'día anterior'],
    ['2026-10-08', c('08:00'), false, 'día siguiente'],
    ['2026-10-07', c('09:00', '10:00'), true, 'terminó a las 10:00'],
    ['2026-10-07', c('11:00', '12:00'), false, 'aún en curso: cuenta la hora de fin'],
    ['2026-10-07', c('11:30'), true, 'sin fin: cuenta la de inicio'],
    ['2026-10-07', c('14:00'), false, 'más tarde hoy'],
    ['2026-10-07', c(), false, 'todo el día: pasa al terminar el día'],
  ])('%s %o -> %s (%s)', (fecha, comp, esperado) => {
    expect(yaPaso(fecha, comp, ahora)).toBe(esperado)
  })
})

describe('marcarPasados', () => {
  it('marca solo los pendientes que ya pasaron y respeta "no se realizó"', () => {
    const { compromisos, cambio } = marcarPasados(
      '2026-10-07',
      [c('09:00', '10:00'), c('09:00', '', { cancelado: true }), c('15:00')],
      ahora,
    )
    expect(cambio).toBe(true)
    expect(compromisos.map((x) => [x.hecho, x.cancelado])).toEqual([
      [true, false],
      [false, true],
      [false, false],
    ])
  })

  it('no informa cambios si no hay nada que marcar', () => {
    expect(marcarPasados('2026-10-08', [c('09:00')], ahora).cambio).toBe(false)
  })
})

describe('siguienteEstado (casilla)', () => {
  it('futuro: pendiente <-> hecho', () => {
    expect(siguienteEstado('2026-10-08', c(), ahora)).toBe('hecho')
    expect(siguienteEstado('2026-10-08', c('', '', { hecho: true }), ahora)).toBe('pendiente')
  })
  it('pasado: hecho -> no se realizó -> hecho', () => {
    expect(siguienteEstado('2026-10-06', c('', '', { hecho: true }), ahora)).toBe('cancelado')
    expect(siguienteEstado('2026-10-06', c('', '', { cancelado: true }), ahora)).toBe('hecho')
  })
})
