# ADR-0001: Persistencia local en una bóveda de carpetas (Markdown + frontmatter)

**Estado:** Aceptado
**Fecha:** 2026-10-07
**Decide:** Usuario (funcionario dueño de la app)

## Contexto

La app organiza las funciones y actividades laborales de un funcionario
(informes, recordatorios, agenda). Requisitos:

- Funciona **solo en local**: sin backend ni nube.
- Los datos deben vivir **en carpetas y archivos legibles**, como en Obsidian,
  para que el usuario pueda verlos, copiarlos, respaldarlos o editarlos fuera
  de la app.
- La primera versión (commit inicial) guardaba todo en IndexedDB, dentro del
  navegador: invisible para el usuario y fácil de perder al limpiar el navegador.
- Más adelante (Fase 4, recordatorios) se quiere empaquetar como app de
  escritorio (Tauri) para tener notificaciones con la ventana cerrada.

## Decisión

1. Los datos se guardan en una **bóveda**: una carpeta elegida por el usuario.

   ```
   MiBoveda/
   ├── Trabajos/
   │   └── <Trabajo>/
   │       ├── _trabajo.md
   │       └── <Función>/
   │           ├── _funcion.md
   │           └── <Actividad>.md
   ├── .cumplimiento/config.json     ← metadatos de la bóveda
   └── .papelera/                    ← lo eliminado se mueve aquí, no se borra
   ```

2. Cada entidad es un archivo Markdown con **frontmatter YAML** para los datos
   estructurados (`id`, `estado`, `fecha_limite`, fechas de auditoría) y el
   cuerpo para el texto libre (descripción y `## Notas`).
3. **El nombre es el nombre del archivo/carpeta** (como en Obsidian) y la
   **jerarquía es la ubicación**: mover una actividad a otra carpeta de función
   en el explorador o en Obsidian la cambia de función.
4. El acceso a disco pasa por una **interfaz de sistema de archivos** mínima
   (`src/services/fs/`). Hoy se implementa con la File System Access API del
   navegador (Chrome/Edge); en Tauri se agregará otra implementación sin tocar
   el repositorio de la bóveda, `dataService`, el Context ni la UI.
5. IndexedDB se conserva solo para recordar qué carpeta eligió el usuario
   (el handle) y para migrar los datos de la versión anterior.

## Opciones consideradas

### A: Web + File System Access API (elegida para empezar)
| Dimensión | Evaluación |
|---|---|
| Complejidad | Baja: reutiliza toda la app actual |
| Costo | Ninguno |
| Compatibilidad | Chrome / Edge en escritorio (no Firefox ni Safari) |
| Familiaridad | Alta: mismo stack React + Vite |

**Pros:** cambio pequeño; sin instalar nada nuevo.
**Contras:** el navegador pide confirmar el permiso de la carpeta en cada
sesión (un clic); recordatorios solo con la app abierta.

### B: App de escritorio con Tauri
**Pros:** acceso total a disco, notificaciones nativas, bandeja del sistema.
**Contras:** requiere Rust y configuración de empaquetado.

### C: Electron
**Pros:** igual que Tauri, ecosistema JS puro.
**Contras:** instaladores pesados (~100 MB), más memoria.

### D: Seguir en IndexedDB
Descartada: no cumple “todo en carpetas”.

## Análisis de trade-offs

A ofrece el 90 % del valor ya y, gracias a la interfaz de `fs`, no cierra la
puerta a B. Se pospone B hasta que los recordatorios con la app cerrada sean
necesarios (Fase 4). Markdown + frontmatter se eligió sobre JSON por ser
legible, editable y compatible con Obsidian.

## Consecuencias

- Más fácil: respaldos (copiar la carpeta), editar en Obsidian, sincronizar con
  OneDrive/carpeta de red si el usuario quiere.
- Más difícil: el usuario puede dejar archivos inválidos; la app debe
  tolerarlos (asignar `id` faltante, ignorar lo que no entienda).
- Renombrar un trabajo o función implica mover una carpeta (copiar + borrar).
- La app vuelve a leer la bóveda al recuperar el foco para reflejar cambios
  externos; con miles de archivos podría requerir un índice incremental.
- Nombres con caracteres no válidos en Windows (`\ / : * ? " < > |`) se
  reemplazan por `-`.

## Acciones

1. [x] Interfaz `fs` + implementación web + implementación en memoria (tests).
2. [x] Repositorio de la bóveda (lectura, escritura, renombrado, papelera).
3. [x] `dataService` sobre la bóveda; pantalla para elegir/reabrir bóveda.
4. [x] Migración desde IndexedDB y desde backups JSON.
5. [ ] Fase 4: implementación `tauriFs` y empaquetado de escritorio.
