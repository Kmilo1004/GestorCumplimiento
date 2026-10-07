# App de Cumplimiento de Funciones

App local para que un funcionario organice sus funciones laborales y
actividades, con seguimiento de cumplimiento, alertas de vencimiento y
(próximamente) agenda, recordatorios e informes.

Jerarquía de 3 niveles:

```
Trabajo → Función → Actividad
```

Hecha con **React + Vite + Tailwind CSS**. **Todo se guarda en una carpeta
de tu equipo como archivos Markdown**, igual que en Obsidian. No hay
backend ni nube: nada sale de tu computador.

## Tu bóveda de datos

La primera vez que abres la app eliges una carpeta (la “bóveda”). La app
crea dentro esta estructura:

```
MiBoveda/
├── Trabajos/
│   └── Alcaldía de Medellín/
│       ├── _trabajo.md                 ← descripción del trabajo
│       └── Atención al ciudadano/
│           ├── _funcion.md             ← descripción de la función
│           └── Responder PQRS.md       ← una actividad
├── .cumplimiento/config.json           ← datos internos de la bóveda
└── .papelera/                          ← lo que eliminas se mueve aquí
```

Una actividad se ve así:

```markdown
---
id: 3f2a…
tipo: actividad
estado: en_progreso          # pendiente | en_progreso | completada
fecha_limite: 2026-10-15
createdAt: 2026-10-01T10:00:00.000Z
updatedAt: 2026-10-02T10:00:00.000Z
---
Responder todas las PQRS del mes.

## Notas

Pendiente radicado 123.
```

- **El nombre es el nombre del archivo o carpeta.** Renombrar en la app
  renombra en disco y viceversa.
- **La ubicación es la jerarquía.** Mover una nota a otra carpeta de
  función (en el explorador o en Obsidian) la cambia de función.
- Puedes crear carpetas y notas a mano: la app las adopta y les asigna un
  `id`. Las claves extra del frontmatter (por ejemplo `tags`) se conservan.
- Al volver a la ventana de la app se relee la carpeta, así que los cambios
  hechos en Obsidian aparecen solos (o usa **Bóveda → Releer carpeta**).
- Respaldo: copia la carpeta completa.

Detalles de la decisión en
[docs/adr/0001-persistencia-en-boveda-de-carpetas.md](docs/adr/0001-persistencia-en-boveda-de-carpetas.md).

## Requisitos

- **Google Chrome o Microsoft Edge** de escritorio (usan la File System
  Access API para leer y escribir la carpeta). Firefox y Safari no la
  soportan.
- Node.js 20 o superior para desarrollo.

Cada vez que abres la app el navegador pide confirmar el acceso a la
carpeta con un clic: es una protección del navegador. Cuando la app se
empaquete como programa de escritorio (Tauri) esto desaparecerá.

## Funcionalidades

- CRUD completo en los 3 niveles (Trabajo, Función, Actividad).
- Vista jerárquica tipo árbol/acordeón.
- % de cumplimiento calculado hacia arriba: pendiente = 0 %, en progreso =
  50 %, completada = 100 %; cada nivel promedia el de sus hijos.
- Alertas de vencimiento: vencida (rojo) o a 2 días o menos (ámbar).
- Dashboard con resumen y lista de vencidas/próximas.
- Filtros por estado, trabajo y rango de fechas.
- Exportar/importar JSON (reemplazar o combinar).
- Migración automática de los datos de la versión anterior (que guardaba
  en el navegador).

## Cómo correrla en local

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente http://localhost:5173) en
Chrome o Edge.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas (Vitest) |
| `npm run lint` | Lint (oxlint) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |

## Estructura del proyecto

```
src/
├── components/   UI (layout, ui, trabajos, actividades, dashboard, backup, vault)
├── context/      DataContext: estado de la bóveda, árbol de datos y CRUD
├── models/       Formas de Trabajo, Función, Actividad y constantes
├── services/
│   ├── dataService.js       API de datos que usa la UI (única puerta)
│   ├── fs/                  Interfaz de sistema de archivos (web, memoria; luego Tauri)
│   ├── vault/               Markdown + frontmatter, repositorio de la bóveda, handle
│   └── legacyIndexedDB.js   Lectura de datos antiguos para migrarlos
└── utils/        compliance.js (% de cumplimiento) y alerts.js (vencimientos)
docs/adr/         Decisiones de arquitectura
```

## Hoja de ruta

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Fundamentos, ADR, documentación | ✅ |
| 1 | Bóveda en carpetas (Markdown) | ✅ |
| 2 | Modelo ampliado: prioridad, etiquetas, recurrencia, evidencias | Pendiente |
| 3 | Agenda: día/semana/mes y notas diarias | Pendiente |
| 4 | Recordatorios y app de escritorio (Tauri) | Pendiente |
| 5 | Informes de gestión (Markdown / PDF / Word) | Pendiente |
| 6 | Calidad: más pruebas y revisión | Continuo |
