import { describe, expect, it } from 'vitest'
import { createMemoryFs } from './memoryFs'
import { moveEntry, rutaDisponible } from './fsUtils'
import { nombreSeguro } from './paths'

describe('nombreSeguro', () => {
  it('reemplaza caracteres inválidos en Windows', () => {
    expect(nombreSeguro('Informe Q1/Q2: ¿listo?')).toBe('Informe Q1-Q2- ¿listo-')
  })
  it('no deja nombres vacíos, ocultos ni reservados', () => {
    expect(nombreSeguro('   ')).toBe('Sin nombre')
    expect(nombreSeguro('.papelera')).toBe('papelera')
    expect(nombreSeguro('CON')).toBe('CON_')
    expect(nombreSeguro('Acta final. ')).toBe('Acta final')
  })
})

describe('moveEntry', () => {
  it('mueve una carpeta completa con su contenido', async () => {
    const fs = createMemoryFs({ 'A/x.md': '1', 'A/sub/y.md': '2' })
    await moveEntry(fs, 'A', 'B')
    expect(fs._snapshot()).toEqual({ 'B/sub/y.md': '2', 'B/x.md': '1' })
  })

  it('renombrar solo mayúsculas no pierde el archivo', async () => {
    const fs = createMemoryFs({ 'acta.md': 'contenido' })
    await moveEntry(fs, 'acta.md', 'Acta.md')
    expect(fs._snapshot()).toEqual({ 'Acta.md': 'contenido' })
  })
})

describe('rutaDisponible', () => {
  it('agrega (2), (3)… sin distinguir mayúsculas', async () => {
    const fs = createMemoryFs({ 'F/Acta.md': '', 'F/acta (2).md': '' })
    expect(await rutaDisponible(fs, 'F', 'acta', '.md')).toBe('F/acta (3).md')
  })
})
