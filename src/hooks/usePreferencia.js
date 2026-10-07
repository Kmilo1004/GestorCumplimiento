import { useState } from 'react'

// Preferencia de interfaz recordada en este navegador (p. ej. lista o
// tablero). Es solo comodidad: si el almacenamiento falla, usa el valor por
// defecto. Los datos de trabajo nunca van aquí, van a la bóveda.
export function usePreferencia(clave, porDefecto) {
  const [valor, setValor] = useState(() => {
    try {
      return localStorage.getItem(`cumplimiento:${clave}`) ?? porDefecto
    } catch {
      return porDefecto
    }
  })

  const guardar = (nuevo) => {
    setValor(nuevo)
    try {
      localStorage.setItem(`cumplimiento:${clave}`, nuevo)
    } catch {
      // Navegación privada o almacenamiento bloqueado: se mantiene en memoria.
    }
  }

  return [valor, guardar]
}
