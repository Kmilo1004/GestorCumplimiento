# CLAUDE.md

App local (React 19 + Vite + Tailwind) para que un funcionario organice
Trabajo → Función → Actividad, con informes, recordatorios y agenda.
Todo el texto de la app, comentarios y documentación van **en español**.

## Reglas del proyecto

- **Solo local.** Sin backend, sin nube, sin llamadas de red con datos del usuario.
- **Los datos viven en una bóveda de carpetas** con Markdown + frontmatter
  YAML (ver `docs/adr/0001-persistencia-en-boveda-de-carpetas.md`). No volver
  a guardar datos de negocio en IndexedDB/localStorage; IndexedDB solo guarda
  el handle de la carpeta y banderas de configuración.
- **Capas:** UI → `DataContext` → `services/dataService.js` →
  `services/vault/vaultRepository.js` → interfaz `services/fs/*`.
  Los componentes nunca importan `vault/` ni `fs/` directamente.
- El repositorio solo usa la interfaz de `fs` (contrato en `services/fs/memoryFs.js`),
  para poder agregar `tauriFs` en la Fase 4 sin tocar nada más.
- El nombre de una entidad = nombre de su archivo/carpeta; la jerarquía = su ubicación.
  Al leer, conservar claves de frontmatter desconocidas y tolerar archivos hechos a mano.
- Eliminar = mover a `.papelera/`, nunca borrar definitivamente.
- Decisiones de arquitectura nuevas → nuevo ADR en `docs/adr/`.
- **Toda la UI debe verse bien en PC y en celular** (mobile-first, sin scroll
  horizontal a 375 px, botones de tamaño táctil). Verificar ambos tamaños en el navegador.

## Interfaz

- Navegación por hash (`hooks/useRuta.js`): `#/resumen`, `#/trabajos/<id>/<funcionId>`,
  `#/actividades`, `#/boveda`. Así funciona el botón Atrás del celular.
- PC (≥ `lg`): menú lateral; celular: menú inferior + botón flotante "+".
- Una actividad se muestra en una línea (`ActividadFila`); el detalle completo va en
  el panel (`ActividadDetalle`, abierto con `useUI().abrirDetalle(id)`). El
  formulario de actividad también se abre desde `useUI()`.
- Acciones secundarias (editar/eliminar) en `MenuAcciones` (⋯), no como íconos en cada fila.
- Íconos con `components/ui/Icono.jsx` (no repetir `<path>` en los componentes).
- Fechas de calendario como texto `YYYY-MM-DD` en hora local (`utils/fechas.js`);
  nunca `new Date('YYYY-MM-DD')` (lo interpreta en UTC y corre un día).
- En grillas responsivas usar `grid-cols-1` en móvil: `grid` sin columnas toma el
  ancho mínimo del contenido y desborda la pantalla.

## Comandos

- `npm run dev` — desarrollo (abrir en Chrome/Edge)
- `npm test` — Vitest (pruebas de `services/` con el fs en memoria)
- `npm run lint` — oxlint
- `npm run build`

## Probar en el navegador sin selector de carpetas

El selector nativo no se puede automatizar. Para pruebas, guardar un handle
de OPFS como bóveda: `navigator.storage.getDirectory()` → `getDirectoryHandle('MiBoveda', {create:true})`
y ponerlo en IndexedDB `cumplimiento-config`, store `kv`, clave `boveda`; luego recargar.
