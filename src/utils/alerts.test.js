import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { agruparPorUrgencia, fechaCorta, grupoUrgencia } from './alerts'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 7, 10, 0)) // 7 oct 2026, hora local
})
afterEach(() => vi.useRealTimers())

const a = (fecha_limite, extra = {}) => ({ estado: 'pendiente', prioridad: 'media', fecha_limite, ...extra })

describe('grupoUrgencia', () => {
  it.each([
    ['2026-10-05', 'vencidas'],
    ['2026-10-07', 'hoy'],
    ['2026-10-08', 'semana'],
    ['2026-10-14', 'semana'],
    ['2026-10-15', 'despues'],
    ['', 'sin_fecha'],
  ])('%s -> %s', (fecha, grupo) => {
    expect(grupoUrgencia(a(fecha))).toBe(grupo)
  })

  it('las completadas van aparte aunque estén vencidas', () => {
    expect(grupoUrgencia(a('2026-10-01', { estado: 'completada' }))).toBe('completadas')
  })
})

describe('agruparPorUrgencia', () => {
  it('ordena grupos y, dentro, por fecha y luego prioridad; omite grupos vacíos', () => {
    const grupos = agruparPorUrgencia([
      a('2026-10-09', { nombre: 'b-media' }),
      a('2026-10-09', { nombre: 'a-alta', prioridad: 'alta' }),
      a('2026-10-01', { nombre: 'vencida' }),
      a('2026-10-08', { nombre: 'mañana' }),
    ])
    expect(grupos.map((g) => g.id)).toEqual(['vencidas', 'semana'])
    expect(grupos[1].actividades.map((x) => x.nombre)).toEqual(['mañana', 'a-alta', 'b-media'])
  })
})

describe('fechaCorta', () => {
  it.each([
    ['2026-10-07', 'Hoy'],
    ['2026-10-08', 'Mañana'],
    ['2026-10-06', 'Ayer'],
    ['2026-10-04', 'Hace 3 d'],
    ['2026-10-10', 'En 3 d'],
  ])('%s -> %s', (fecha, texto) => {
    expect(fechaCorta(fecha)).toBe(texto)
  })

  it('fechas lejanas muestran día y mes', () => {
    expect(fechaCorta('2026-11-20')).toMatch(/20.*nov/)
  })
})

describe('contarPorUrgencia', () => {
  it('cuenta abiertas por grupo y completadas aparte', async () => {
    const { contarPorUrgencia } = await import('./alerts')
    expect(
      contarPorUrgencia([a('2026-10-01'), a('2026-10-07'), a('2026-10-09'), a(''), a('2026-10-01', { estado: 'completada' })]),
    ).toEqual({ vencidas: 1, hoy: 1, semana: 1, abiertas: 4, completadas: 1 })
  })
})
