// Genera una bóveda de ejemplo con datos de muestra de un funcionario.
//
//   npm run ejemplo                 -> crea ./boveda-ejemplo
//   npm run ejemplo -- <carpeta>    -> crea la bóveda en otra carpeta
//
// Usa la misma capa de datos de la app (dataService + repositorio de la
// bóveda) sobre un sistema de archivos en memoria y luego lo escribe en disco,
// así el formato es idéntico al que produce la app. Las fechas se calculan a
// partir de hoy para que siempre haya actividades vencidas, próximas y a tiempo.
// Nunca sobrescribe una carpeta que ya tenga contenido.

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createServer } from 'vite'

const destino = resolve(process.argv[2] || 'boveda-ejemplo')

if (existsSync(destino) && readdirSync(destino).length > 0) {
  console.error(`La carpeta ${destino} ya existe y no está vacía. Bórrala o elige otra:`)
  console.error('  npm run ejemplo -- <otra-carpeta>')
  process.exit(1)
}

// ---------- Fechas relativas a hoy ----------

const hoy = new Date()
function fecha(dias) {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function finDeMes(mesesDesdeHoy) {
  const d = new Date(hoy.getFullYear(), hoy.getMonth() + mesesDesdeHoy + 1, 0)
  return fecha(Math.round((d - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000))
}
function finDeTrimestre() {
  const mesFin = Math.floor(hoy.getMonth() / 3) * 3 + 2
  return finDeMes(mesFin - hoy.getMonth())
}

// ---------- Evidencias de muestra ----------

// PDF mínimo válido de una página con unas líneas de texto (sin tildes:
// la fuente estándar Helvetica no las necesita para un ejemplo).
function pdf(nombre, lineas) {
  const texto = lineas
    .map((l, i) => `BT /F1 12 Tf 60 ${760 - i * 20} Td (${l.replace(/[()\\]/g, '\\$&')}) Tj ET`)
    .join('\n')
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(texto, 'latin1')} >>\nstream\n${texto}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ]
  let cuerpo = '%PDF-1.4\n'
  const offsets = []
  objetos.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(cuerpo, 'latin1'))
    cuerpo += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = Buffer.byteLength(cuerpo, 'latin1')
  cuerpo += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  cuerpo += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  cuerpo += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new File([Buffer.from(cuerpo, 'latin1')], nombre, { type: 'application/pdf' })
}

function archivo(nombre, contenido) {
  return new File([contenido], nombre)
}

// ---------- Datos de muestra ----------

const DATOS = [
  {
    nombre: 'Alcaldía - Secretaría de Hacienda',
    descripcion: 'Profesional universitario, código 219, grado 02. Cargo de carrera administrativa.',
    funciones: [
      {
        nombre: 'Gestión presupuestal',
        descripcion: 'Seguimiento a la ejecución del presupuesto de gastos de la Secretaría.',
        actividades: [
          {
            nombre: 'Informe de ejecución presupuestal',
            recurrencia: 'mensual',
            fecha_limite: finDeMes(-1),
            estado: 'completada',
            prioridad: 'alta',
            tags: ['presupuesto', 'informe'],
            descripcion: 'Consolidar la ejecución de gastos e ingresos y enviarla al despacho del Secretario.',
            notas: 'Enviado por correo institucional. Radicado interno 2026-0451.',
            archivos: [
              pdf('Informe ejecucion presupuestal.pdf', [
                'INFORME DE EJECUCION PRESUPUESTAL',
                'Secretaria de Hacienda - Documento de ejemplo',
                'Compromisos: 78% | Obligaciones: 64% | Pagos: 61%',
              ]),
            ],
          },
          {
            nombre: 'Revisar solicitudes de CDP',
            fecha_limite: fecha(1),
            estado: 'pendiente',
            prioridad: 'alta',
            tags: ['presupuesto'],
            descripcion: 'Verificar disponibilidad y rubro de los certificados solicitados por las áreas.',
            notas: 'Hay 6 solicitudes en la bandeja. Dos de ellas sin justificación técnica.',
          },
          {
            nombre: 'Conciliación de cuentas por pagar',
            fecha_limite: fecha(5),
            estado: 'en_progreso',
            prioridad: 'media',
            tags: ['presupuesto', 'contabilidad'],
            descripcion: 'Cruzar cuentas por pagar con tesorería y contabilidad.',
            notas: 'Pendiente respuesta de tesorería sobre 3 órdenes de pago.',
          },
        ],
      },
      {
        nombre: 'Atención al ciudadano',
        descripcion: 'Respuesta a peticiones, quejas, reclamos y sugerencias (PQRS) asignadas.',
        actividades: [
          {
            nombre: 'Responder PQRS asignadas',
            recurrencia: 'semanal',
            fecha_limite: fecha(-2),
            estado: 'en_progreso',
            prioridad: 'alta',
            tags: ['pqrs'],
            descripcion: 'Dar respuesta de fondo dentro de los términos de la Ley 1755 de 2015.',
            notas: 'Quedan 4 por responder. Una es un derecho de petición con término de 10 días.',
          },
          {
            nombre: 'Actualizar matriz de seguimiento de PQRS',
            fecha_limite: fecha(10),
            estado: 'pendiente',
            prioridad: 'baja',
            tags: ['pqrs'],
          },
          {
            nombre: 'Capacitación en lenguaje claro',
            fecha_limite: fecha(-7),
            estado: 'completada',
            prioridad: 'media',
            tags: ['capacitacion'],
            descripcion: 'Curso virtual del DNP sobre lenguaje claro para servidores públicos.',
            archivos: [
              pdf('Certificado lenguaje claro.pdf', [
                'CERTIFICADO DE PARTICIPACION',
                'Curso de Lenguaje Claro - Documento de ejemplo',
                'Intensidad: 20 horas',
              ]),
            ],
          },
        ],
      },
      {
        nombre: 'Informes a entes de control',
        descripcion: 'Reportes a Contraloría, Procuraduría y control interno.',
        actividades: [
          {
            nombre: 'Rendición de cuenta en SIA Contraloría',
            recurrencia: 'trimestral',
            fecha_limite: finDeTrimestre(),
            estado: 'pendiente',
            prioridad: 'alta',
            tags: ['contraloria', 'informe'],
            descripcion: 'Cargar los formatos de rendición de la cuenta en la plataforma SIA.',
          },
          {
            nombre: 'Seguimiento al plan de mejoramiento',
            fecha_limite: fecha(3),
            estado: 'en_progreso',
            prioridad: 'alta',
            tags: ['contraloria', 'control-interno'],
            descripcion: 'Reportar avance de las acciones del hallazgo 4 de la auditoría regular.',
            notas: 'Falta el soporte de la acción 4.2 (circular firmada).',
            archivos: [archivo('Avance acciones hallazgo 4.txt', 'Acción 4.1: cumplida 100%\nAcción 4.2: en curso 60%\n')],
          },
          {
            nombre: 'Informe de austeridad del gasto',
            recurrencia: 'trimestral',
            fecha_limite: finDeTrimestre(),
            estado: 'pendiente',
            prioridad: 'media',
            tags: ['control-interno', 'informe'],
          },
        ],
      },
    ],
  },
  {
    nombre: 'Comité de Convivencia Laboral',
    descripcion: 'Designado como secretario técnico del comité para el periodo 2025-2027.',
    funciones: [
      {
        nombre: 'Secretaría técnica',
        descripcion: 'Convocatorias, actas y archivo del comité.',
        actividades: [
          {
            nombre: 'Acta de reunión ordinaria',
            recurrencia: 'trimestral',
            fecha_limite: fecha(-20),
            estado: 'completada',
            prioridad: 'media',
            tags: ['comite', 'actas'],
            notas: 'Asistieron 4 de 4 miembros. Sin casos nuevos.',
            archivos: [
              pdf('Acta reunion ordinaria.pdf', [
                'ACTA DE REUNION ORDINARIA',
                'Comite de Convivencia Laboral - Documento de ejemplo',
                'Quorum: 4 de 4 miembros',
              ]),
            ],
          },
          {
            nombre: 'Enviar convocatoria a los miembros',
            fecha_limite: fecha(14),
            estado: 'pendiente',
            prioridad: 'baja',
            tags: ['comite'],
          },
        ],
      },
    ],
  },
  {
    nombre: 'Desarrollo profesional',
    descripcion: 'Formación y evaluación del desempeño.',
    funciones: [
      {
        nombre: 'Evaluación del desempeño',
        descripcion: 'Compromisos laborales concertados con el jefe inmediato.',
        actividades: [
          {
            nombre: 'Evidencias de compromisos laborales',
            recurrencia: 'semestral',
            fecha_limite: fecha(30),
            estado: 'en_progreso',
            prioridad: 'alta',
            tags: ['evaluacion'],
            descripcion: 'Reunir evidencias de cumplimiento de los 5 compromisos para la evaluación parcial.',
            notas: 'Ya hay soportes de los compromisos 1, 2 y 4.',
          },
        ],
      },
      {
        nombre: 'Formación',
        descripcion: '',
        actividades: [
          {
            nombre: 'Curso de MIPG',
            fecha_limite: fecha(20),
            estado: 'en_progreso',
            prioridad: 'baja',
            tags: ['capacitacion'],
            descripcion: 'Modelo Integrado de Planeación y Gestión, curso virtual de Función Pública.',
            notas: 'Voy en el módulo 3 de 6.',
          },
        ],
      },
    ],
  },
]

// ---------- Generación ----------

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })
try {
  const { createMemoryFs } = await vite.ssrLoadModule('/src/services/fs/memoryFs.js')
  const { createVaultRepository } = await vite.ssrLoadModule('/src/services/vault/vaultRepository.js')
  const dataService = await vite.ssrLoadModule('/src/services/dataService.js')

  const fs = createMemoryFs()
  dataService.usarRepositorio(createVaultRepository(fs))

  let total = 0
  for (const t of DATOS) {
    const trabajo = await dataService.crearTrabajoService({ nombre: t.nombre, descripcion: t.descripcion })
    for (const f of t.funciones) {
      const funcion = await dataService.crearFuncionService({
        trabajoId: trabajo.id,
        nombre: f.nombre,
        descripcion: f.descripcion,
      })
      for (const a of f.actividades) {
        await dataService.crearActividadService({ ...a, funcionId: funcion.id })
        total++
      }
    }
  }

  // Volcar el fs en memoria a disco.
  const archivos = fs._snapshot()
  for (const [ruta, contenido] of Object.entries(archivos)) {
    const final = join(destino, ...ruta.split('/'))
    mkdirSync(dirname(final), { recursive: true })
    const datos = contenido instanceof Blob ? Buffer.from(await contenido.arrayBuffer()) : contenido
    writeFileSync(final, datos)
  }

  const { actividades } = await dataService.cargarTodo()
  console.log(`Bóveda de ejemplo creada en: ${destino}`)
  console.log(
    `  ${DATOS.length} trabajos, ${actividades.length} actividades (${actividades.length - total} generadas por recurrencia), ${Object.keys(archivos).length} archivos.`,
  )
  console.log('Ábrela en la app con "Elegir carpeta" o "Bóveda → Cambiar de carpeta".')
} finally {
  await vite.close()
}
