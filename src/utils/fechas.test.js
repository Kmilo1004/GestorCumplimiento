import { describe, expect, it } from 'vitest'
import {
  cuadriculaMes,
  diasDeSemana,
  esISO,
  festivo,
  festivosColombia,
  inicioSemana,
  rangoSemana,
  sumarMeses,
} from './fechas'

describe('semanas y meses', () => {
  it('la semana empieza el lunes', () => {
    expect(inicioSemana('2026-10-07')).toBe('2026-10-05') // miércoles -> lunes
    expect(inicioSemana('2026-10-11')).toBe('2026-10-05') // domingo -> lunes anterior
    expect(diasDeSemana('2026-10-07')).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ])
  })

  it('la cuadrícula del mes cubre semanas completas', () => {
    const semanas = cuadriculaMes('2026-10-15')
    expect(semanas[0][0]).toBe('2026-09-28')
    expect(semanas.at(-1).at(-1)).toBe('2026-11-01')
    expect(semanas).toHaveLength(5)
    expect(cuadriculaMes('2027-02-10')).toHaveLength(4) // feb 2027 empieza lunes y termina domingo
  })

  it('sumar meses respeta el fin de mes', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28')
    expect(sumarMeses('2026-12-15', 1)).toBe('2027-01-15')
    expect(sumarMeses('2026-03-31', -1)).toBe('2026-02-28')
  })

  it('valida fechas ISO reales', () => {
    expect(esISO('2026-10-07')).toBe(true)
    expect(esISO('2026-02-30')).toBe(false)
    expect(esISO('7/10/2026')).toBe(false)
  })

  it('texto del rango de la semana', () => {
    expect(rangoSemana('2026-10-07')).toBe('5 – 11 oct 2026')
    expect(rangoSemana('2026-10-01')).toMatch(/^28 sept? – 4 oct 2026$/)
  })
})

describe('festivos de Colombia', () => {
  it('2026 tiene los 18 festivos oficiales', () => {
    expect([...festivosColombia(2026).keys()].sort()).toEqual([
      '2026-01-01',
      '2026-01-12',
      '2026-03-23',
      '2026-04-02',
      '2026-04-03',
      '2026-05-01',
      '2026-05-18',
      '2026-06-08',
      '2026-06-15',
      '2026-06-29',
      '2026-07-20',
      '2026-08-07',
      '2026-08-17',
      '2026-10-12',
      '2026-11-02',
      '2026-11-16',
      '2026-12-08',
      '2026-12-25',
    ])
  })

  it('2025 calcula bien Semana Santa y los traslados', () => {
    expect(festivo('2025-04-17')).toBe('Jueves Santo')
    expect(festivo('2025-04-18')).toBe('Viernes Santo')
    expect(festivo('2025-06-02')).toBe('Ascensión del Señor')
    expect(festivo('2025-08-18')).toBe('Asunción de la Virgen')
    expect(festivo('2025-10-07')).toBeNull()
  })
})
