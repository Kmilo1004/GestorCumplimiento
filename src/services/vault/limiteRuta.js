// Límite de largo de las rutas dentro de la bóveda.
//
// Windows no abre archivos cuya ruta completa pase de 260 caracteres
// (ver docs/adr/0003-limite-de-rutas-en-windows.md). El navegador no revela
// dónde está la bóveda en el disco, así que se limita la parte que sí
// controla la app: la ruta desde la raíz de la bóveda. Con 160 quedan 100
// caracteres para la carpeta de la bóveda o de los respaldos
// ("C:\Users\<usuario>\Documents\<Bóveda>\" ronda los 60).
//
// La ruta más larga de una actividad es la de sus evidencias:
//   Trabajos/<Trabajo>/<Función>/Evidencias/<Actividad>/<archivo>

import { joinPath } from '../fs/paths'

export const MAX_RUTA = 160
// Espacio mínimo que se deja para lo que aún no existe: el nombre de un
// archivo adjunto, y las funciones/actividades que se creen después.
export const MIN_ARCHIVO = 20
const MIN_FUNCION = 30
const MIN_ACTIVIDAD = 30

const relleno = (n) => 'x'.repeat(n)

function largoEvidencia(trabajo, funcion, actividad) {
  return joinPath('Trabajos', trabajo, funcion, 'Evidencias', actividad).length + 1 + MIN_ARCHIVO
}

// { trabajo, funciones: [{ nombre, actividades: [nombre] }] } -> largo de la
// ruta más larga que existiría (o podría existir) bajo ese trabajo.
export function largoMasLargo({ trabajo, funciones }) {
  const lista = funciones.length ? funciones : [{ nombre: relleno(MIN_FUNCION), actividades: [] }]
  return Math.max(
    ...lista.map((f) => {
      const actividades = f.actividades.length ? f.actividades : [relleno(MIN_ACTIVIDAD)]
      return Math.max(...actividades.map((a) => largoEvidencia(trabajo, f.nombre, a)))
    }),
  )
}

const QUIEN = { trabajo: 'del trabajo', funcion: 'de la función', actividad: 'de la actividad' }

export function mensajeExceso(tipo, exceso) {
  return `El nombre ${QUIEN[tipo]} es demasiado largo para Windows. Acórtalo al menos ${exceso} ${
    exceso === 1 ? 'carácter' : 'caracteres'
  }; el texto completo puede ir en la descripción.`
}
