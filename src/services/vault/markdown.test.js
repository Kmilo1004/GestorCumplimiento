import { describe, expect, it } from 'vitest'
import {
  actualizarFrontmatter,
  escribirActividad,
  leerActividad,
  leerCamposPersonalizados,
  leerContenedor,
  separarFrontmatter,
} from './markdown'

const actividad = {
  id: 'a1',
  nombre: 'Responder PQRS',
  descripcion: 'Contestar las PQRS del mes.',
  fecha_limite: '2026-10-15',
  estado: 'en_progreso',
  notas: 'Pendiente radicado 123.',
  prioridad: 'media',
  tags: [],
  recurrencia: '',
  serie: '',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
}

describe('markdown de actividades', () => {
  it('ida y vuelta conserva los datos', () => {
    const texto = escribirActividad(actividad)
    const { datos } = leerActividad(texto)
    const { nombre: _nombre, ...sinNombre } = actividad
    expect(datos).toEqual(sinNombre)
  })

  it('genera un Markdown legible con frontmatter', () => {
    const texto = escribirActividad(actividad)
    expect(texto.startsWith('---\n')).toBe(true)
    expect(texto).toContain('estado: en_progreso')
    expect(texto).toContain('fecha_limite: 2026-10-15')
    expect(texto).toContain('## Notas\n\nPendiente radicado 123.')
  })

  it('conserva claves de frontmatter que agregó el usuario (p. ej. aliases)', () => {
    const editado = actualizarFrontmatter(escribirActividad(actividad), { aliases: ['PQRS'] })
    const reescrito = escribirActividad({ ...actividad, estado: 'completada' }, editado)
    expect(separarFrontmatter(reescrito).frontmatter.aliases).toEqual(['PQRS'])
    expect(leerActividad(reescrito).datos.estado).toBe('completada')
  })

  it('tolera archivos creados a mano sin frontmatter', () => {
    const { datos } = leerActividad('Solo texto\n')
    expect(datos).toMatchObject({ id: '', estado: 'pendiente', descripcion: 'Solo texto', notas: '' })
  })

  it('tolera YAML inválido y estados desconocidos', () => {
    expect(leerActividad('---\nid: [roto\n---\nhola').datos.descripcion).toBe('hola')
    expect(leerActividad('---\nestado: inventado\n---\n').datos.estado).toBe('pendiente')
  })

  it('reconoce un frontmatter vacío (---/---)', () => {
    expect(separarFrontmatter('---\n---\nTexto')).toEqual({ frontmatter: {}, cuerpo: 'Texto' })
  })

  it('un "## Notas" dentro de la descripción no se confunde con la sección', () => {
    const conEncabezado = { ...actividad, descripcion: 'Revisar\n## Notas\nde campo' }
    const { datos } = leerActividad(escribirActividad(conEncabezado))
    expect(datos.descripcion).toBe('Revisar\n## Notas\nde campo')
    expect(datos.notas).toBe(actividad.notas)
  })

  it('acepta fechas que YAML interpreta como Date', () => {
    const { datos } = leerActividad('---\nfecha_limite: !!timestamp 2026-10-15\n---\n')
    expect(datos.fecha_limite).toBe('2026-10-15')
  })
})

describe('markdown de trabajos y funciones', () => {
  it('el cuerpo es la descripción', () => {
    const { datos } = leerContenedor('---\nid: t1\ntipo: trabajo\n---\nSecretaría de Hacienda\n')
    expect(datos).toMatchObject({ id: 't1', descripcion: 'Secretaría de Hacienda' })
  })
})

describe('campos de la Fase 2', () => {
  const completa = {
    ...actividad,
    prioridad: 'alta',
    tags: ['informe', 'contraloria'],
    recurrencia: 'mensual',
    serie: 'Informe mensual',
  }

  it('ida y vuelta de prioridad, etiquetas y recurrencia', () => {
    const { datos } = leerActividad(escribirActividad(completa))
    expect(datos).toMatchObject({
      prioridad: 'alta',
      tags: ['informe', 'contraloria'],
      recurrencia: 'mensual',
      serie: 'Informe mensual',
    })
  })

  it('quitar etiquetas o recurrencia las borra del frontmatter', () => {
    const antes = escribirActividad(completa)
    const despues = escribirActividad({ ...completa, tags: [], recurrencia: '', serie: '' }, antes)
    const { frontmatter } = separarFrontmatter(despues)
    expect(frontmatter).not.toHaveProperty('tags')
    expect(frontmatter).not.toHaveProperty('recurrencia')
    expect(frontmatter).not.toHaveProperty('serie')
  })

  it('acepta etiquetas escritas a mano en Obsidian', () => {
    // Se respetan las mayúsculas y "informe" repetido cuenta como la misma.
    expect(leerActividad('---\ntags: "#Informe, PQRS, informe"\n---\n').datos.tags).toEqual(['Informe', 'PQRS'])
    expect(leerActividad('---\ntag: urgente\n---\n').datos.tags).toEqual(['urgente'])
  })

  it('valores desconocidos vuelven a los valores por defecto', () => {
    const { datos } = leerActividad('---\nprioridad: urgentísima\nrecurrencia: diaria\n---\n')
    expect(datos).toMatchObject({ prioridad: 'media', recurrencia: '', serie: '' })
  })
})

describe('campos personalizados en el frontmatter', () => {
  const definiciones = [
    { clave: 'radicado', aplicaA: ['actividad'] },
    { clave: 'vence', aplicaA: ['actividad'] },
    { clave: 'codigo', aplicaA: ['trabajo'] },
  ]

  it('solo toma los campos definidos para ese tipo de entidad', () => {
    const frontmatter = { radicado: 'RAD-1', codigo: 'T-1', otra: 'x', vence: new Date('2026-10-20T00:00:00Z') }
    expect(leerCamposPersonalizados(frontmatter, definiciones, 'actividad')).toEqual({
      radicado: 'RAD-1',
      vence: '2026-10-20',
    })
    expect(leerCamposPersonalizados(frontmatter, definiciones, 'trabajo')).toEqual({ codigo: 'T-1' })
  })

  it('nunca sobrescribe las claves reservadas de la app', () => {
    const texto = escribirActividad({ ...actividad, camposPersonalizados: { estado: 'hackeado', radicado: 'R' } })
    const { frontmatter } = separarFrontmatter(texto)
    expect(frontmatter.estado).toBe(actividad.estado)
    expect(frontmatter.radicado).toBe('R')
  })
})
