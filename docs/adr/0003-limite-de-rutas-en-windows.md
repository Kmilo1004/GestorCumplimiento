# ADR-0003: Límite de largo de rutas para Windows

**Estado:** Aceptado
**Fecha:** 2026-10-09
**Decide:** Usuario (funcionario dueño de la app)

## Contexto

La app se usa en un portátil con Windows. Windows no abre archivos cuya ruta
completa pase de 260 caracteres, salvo que TI active `LongPathsEnabled` y cada
programa lo soporte (el Explorador no lo hace del todo). Una bóveda con nombres
de función y actividad largos no se pudo abrir: el error fue "A requested file
or directory could not be found".

Cada nombre de trabajo, función y actividad es una carpeta o archivo, así que
los nombres se suman en una sola ruta:

```
<carpeta de la bóveda>\Trabajos\<Trabajo>\<Función>\Evidencias\<Actividad>\<adjunto>
```

## Decisión

1. La ruta **desde la raíz de la bóveda** no puede pasar de **160 caracteres**
   (`MAX_RUTA` en `src/services/vault/limiteRuta.js`). El navegador no revela
   dónde está la bóveda en el disco; 160 deja unos 100 caracteres para esa
   carpeta o para la de los respaldos.
2. Se mide la ruta más larga que existirá: la carpeta de evidencias de cada
   actividad más 20 caracteres para el nombre de un adjunto. Una función o
   trabajo sin hijos reserva 30 caracteres para la función y la actividad que se
   creen después.
3. Se revisa **antes de guardar**: el formulario avisa mientras se escribe
   ("Acórtalo al menos N caracteres") y no deja guardar; el repositorio lo vuelve
   a revisar y rechaza el guardado sin escribir nada.
4. Lo que ya era demasiado largo (creado a mano u otra app) se puede seguir
   editando mientras la ruta no crezca.
5. Los nombres de los adjuntos se recortan automáticamente para que quepan.
6. Al importar un respaldo JSON, lo que no cabe se omite (con su contenido) y se
   cuenta en el resultado, en vez de cortar la importación.

## Consecuencias

- Nombres largos de trabajos o funciones dejan menos espacio a las actividades:
  el texto completo debe ir en la descripción o en un campo personalizado.
- Si la bóveda está en una carpeta muy profunda (más de ~100 caracteres), aún
  podría pasarse del límite; conviene ubicarla en `Documentos` o similar.
