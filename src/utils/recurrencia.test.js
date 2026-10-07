import { describe, expect, it } from 'vitest'
import { etiquetaPeriodo, nombreDePeriodo, siguienteFecha } from './recurrencia'

describe('siguienteFecha', () => {
  it.each([
    ['2026-10-07', 'semanal', '2026-10-14'],
    ['2026-12-28', 'semanal', '2027-01-04'],
    ['2026-10-15', 'quincenal', '2026-10-31'],
    ['2026-10-31', 'quincenal', '2026-11-15'],
    ['2026-02-28', 'quincenal', '2026-03-15'],
    ['2026-10-10', 'quincenal', '2026-10-25'],
    ['2026-10-10', 'mensual', '2026-11-10'],
    ['2026-01-31', 'mensual', '2026-02-28'],
    ['2028-01-31', 'mensual', '2028-02-29'],
    ['2026-04-30', 'mensual', '2026-05-31'],
    ['2026-02-28', 'mensual', '2026-03-31'],
    ['2026-01-30', 'mensual', '2026-02-28'],
    ['2026-11-15', 'bimestral', '2027-01-15'],
    ['2026-12-31', 'trimestral', '2027-03-31'],
    ['2026-06-30', 'semestral', '2026-12-31'],
    ['2028-02-29', 'anual', '2029-02-28'],
  ])('%s + %s = %s', (fecha, recurrencia, esperado) => {
    expect(siguienteFecha(fecha, recurrencia)).toBe(esperado)
  })

  it('sin fecha o sin recurrencia no calcula nada', () => {
    expect(siguienteFecha('', 'mensual')).toBe('')
    expect(siguienteFecha('2026-10-10', '')).toBe('')
  })
})

describe('etiquetaPeriodo', () => {
  it.each([
    ['2026-10-07', 'semanal', '2026-S41'],
    ['2027-01-01', 'semanal', '2026-S53'],
    ['2026-10-15', 'quincenal', '2026-10-15'],
    ['2026-10-31', 'mensual', '2026-10'],
    ['2026-11-15', 'bimestral', '2026-11'],
    ['2026-11-15', 'trimestral', '2026-T4'],
    ['2026-06-30', 'semestral', '2026-S1'],
    ['2026-12-31', 'anual', '2026'],
  ])('%s (%s) -> %s', (fecha, recurrencia, esperado) => {
    expect(etiquetaPeriodo(fecha, recurrencia)).toBe(esperado)
  })

  it('arma el nombre de la nota del periodo', () => {
    expect(nombreDePeriodo('Informe mensual', '2026-10-31', 'mensual')).toBe('Informe mensual 2026-10')
    expect(nombreDePeriodo('Informe', '', 'mensual')).toBe('Informe')
  })
})

describe('serieDe', () => {
  it('usa la serie guardada o la deduce quitando el periodo', async () => {
    const { serieDe } = await import('./recurrencia')
    expect(serieDe({ serie: 'Informe', nombre: 'x' })).toBe('Informe')
    expect(serieDe({ nombre: 'Informe 2026-10', fecha_limite: '2026-10-31', recurrencia: 'mensual' })).toBe('Informe')
    expect(serieDe({ nombre: 'Informe octubre', fecha_limite: '2026-10-31', recurrencia: 'mensual' })).toBe(
      'Informe octubre',
    )
  })
})
