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

## Comandos

- `npm run dev` — desarrollo (abrir en Chrome/Edge)
- `npm test` — Vitest (pruebas de `services/` con el fs en memoria)
- `npm run lint` — oxlint
- `npm run build`

## Probar en el navegador sin selector de carpetas

El selector nativo no se puede automatizar. Para pruebas, guardar un handle
de OPFS como bóveda: `navigator.storage.getDirectory()` → `getDirectoryHandle('MiBoveda', {create:true})`
y ponerlo en IndexedDB `cumplimiento-config`, store `kv`, clave `boveda`; luego recargar.
