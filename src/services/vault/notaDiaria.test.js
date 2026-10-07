import { describe, expect, it } from 'vitest'
import { escribirNotaDiaria, leerNotaDiaria } from './notaDiaria'

describe('nota diaria', () => {
  it('lee compromisos con y sin hora, hechos o no', () => {
    const { compromisos, notas } = leerNotaDiaria(
      '---\nfecha: 2026-10-07\n---\n## Agenda\n\n- [ ] 9:00-10:30 Comité\n- [x] 14:00 Llamada\n- Capacitación\n\n## Notas\n\nTodo bien.\n',
    )
    expect(compromisos).toEqual([
      { hecho: false, inicio: '09:00', fin: '10:30', titulo: 'Comité' },
      { hecho: true, inicio: '14:00', fin: '', titulo: 'Llamada' },
      { hecho: false, inicio: '', fin: '', titulo: 'Capacitación' },
    ])
    expect(notas).toBe('Todo bien.')
  })

  it('escribe un Markdown ordenado por hora, compatible con Obsidian', () => {
    const texto = escribirNotaDiaria('2026-10-07', {
      compromisos: [
        { hecho: false, inicio: '14:00', fin: '', titulo: 'Llamada' },
        { hecho: true, inicio: '', fin: '', titulo: 'Capacitación' },
        { hecho: false, inicio: '09:00', fin: '10:00', titulo: 'Comité' },
      ],
      notas: 'Revisar acta.',
    })
    expect(texto).toBe(
      '---\nfecha: 2026-10-07\ntipo: nota-diaria\n---\n## Agenda\n\n- [x] Capacitación\n- [ ] 09:00–10:00 Comité\n- [ ] 14:00 Llamada\n\n## Notas\n\nRevisar acta.\n',
    )
  })

  it('ida y vuelta conserva los datos', () => {
    const datos = {
      compromisos: [{ hecho: false, inicio: '08:00', fin: '09:00', titulo: 'Revisión – presupuesto' }],
      notas: 'Línea 1\n\nLínea 2',
    }
    const { compromisos, notas } = leerNotaDiaria(escribirNotaDiaria('2026-10-07', datos))
    expect({ compromisos, notas }).toEqual(datos)
  })

  it('conserva lo que el usuario escribió fuera de Agenda y Notas', () => {
    const original =
      '---\nfecha: 2026-10-07\ntags: [diario]\n---\nIntro libre\n\n## Agenda\n\n- [ ] 10:00 Reunión\nTexto suelto\n\n## Reflexión\n\nMi sección propia.\n'
    const nuevo = escribirNotaDiaria(
      '2026-10-07',
      { compromisos: [{ hecho: true, inicio: '10:00', fin: '', titulo: 'Reunión' }], notas: 'Nueva nota' },
      original,
    )
    expect(nuevo).toContain('tags:')
    expect(nuevo).toContain('Intro libre')
    expect(nuevo).toContain('- [x] 10:00 Reunión\nTexto suelto')
    expect(nuevo).toContain('## Reflexión\n\nMi sección propia.')
    expect(nuevo).toContain('## Notas\n\nNueva nota')
  })

  it('reconoce encabezados con tilde o mayúsculas distintas', () => {
    const { notas } = leerNotaDiaria('## NOTAS\n\nhola')
    expect(notas).toBe('hola')
  })
})
