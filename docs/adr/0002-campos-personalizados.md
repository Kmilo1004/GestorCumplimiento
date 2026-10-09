# ADR-0002: Campos personalizados definidos por el usuario

**Estado:** Aceptado
**Fecha:** 2026-10-09
**Decide:** Usuario (funcionario dueño de la app)

## Contexto

El modelo de Trabajo, Función y Actividad tiene campos fijos. El usuario necesita
guardar información propia de su trabajo (radicado, normativa aplicable, fecha de
ingreso…) como datos estructurados, no como texto suelto en la descripción.

## Decisión

1. Las **definiciones** de los campos se guardan en la bóveda, en
   `.cumplimiento/campos.json`:

   ```json
   { "version": 1, "campos": [
     { "clave": "radicado", "etiqueta": "Radicado", "tipo": "texto",
       "aplicaA": ["actividad"], "opciones": [] }
   ] }
   ```

   `tipo`: `texto` | `numero` | `fecha` | `lista`. `aplicaA`: `trabajo`, `funcion`
   y/o `actividad`.
2. Los **valores** se guardan como claves normales del frontmatter de cada archivo
   (`radicado: RAD-2026-001`), para que se vean y editen en Obsidian.
3. Se administran desde **Configuración** (tuerca junto al nombre de la bóveda).

## Alternativas descartadas

- **IndexedDB:** las definiciones quedarían atadas a un navegador y no viajarían
  con la carpeta. Por regla del proyecto, IndexedDB solo guarda el handle y banderas.
- **Valores anidados** (`campos: { radicado: … }`): más fácil de aislar, pero
  incómodo de leer y filtrar en Obsidian.

## Consecuencias

- La clave sale del nombre visible ("Código de contrato" → `codigo_de_contrato`) y
  no cambia al renombrar el campo, para no perder los valores ya guardados.
- No se permiten claves que la app ya usa (`id`, `estado`, `fecha_limite`, …); el
  escritor de Markdown tampoco las sobrescribe aunque lleguen.
- Eliminar un campo no borra sus valores de los archivos: quedan como cualquier
  otra clave desconocida, que la app conserva y no muestra (ver ADR-0001).
- Un `campos.json` dañado o ausente no impide abrir la bóveda: se trata como
  "sin campos".
- En esta versión los campos se ven en los formularios y en el detalle de la
  actividad, pero no en las listas, el resumen ni los filtros.
