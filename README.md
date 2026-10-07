# App de Cumplimiento de Funciones

[![CI](https://github.com/Kmilo1004/GestorCumplimiento/actions/workflows/ci.yml/badge.svg)](https://github.com/Kmilo1004/GestorCumplimiento/actions/workflows/ci.yml)

**Úsala en línea:** https://kmilo1004.github.io/GestorCumplimiento/ (Chrome o Edge).
La página solo entrega el programa; tus datos se quedan en la carpeta que
elijas en tu equipo.

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
│           ├── Responder PQRS 2026-10.md   ← una actividad
│           └── Evidencias/
│               └── Responder PQRS 2026-10/ ← actas, PDF, fotos de esa actividad
├── Agenda/2026/10/2026-10-07.md        ← nota diaria: compromisos con hora y notas
├── .cumplimiento/config.json           ← datos internos de la bóveda
└── .papelera/                          ← lo que eliminas se mueve aquí
```

Una actividad se ve así:

```markdown
---
id: 3f2a…
tipo: actividad
estado: en_progreso          # pendiente | en_progreso | completada
prioridad: alta              # alta | media | baja
fecha_limite: 2026-10-15
tags: [pqrs, contraloria]    # etiquetas, las mismas que usa Obsidian
recurrencia: mensual         # opcional: semanal, quincenal, mensual, bimestral, trimestral, semestral, anual
serie: Responder PQRS        # nombre de la serie si es recurrente
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
- **Actividades recurrentes:** cada periodo es una nota propia
  (`Informe mensual 2026-10.md`). Al completarla se crea sola la del siguiente
  periodo con la misma prioridad, etiquetas y descripción. Quincenal sigue el
  calendario colombiano (15 → fin de mes → 15).
- **Evidencias:** los adjuntos se copian a `Evidencias/<Actividad>/` dentro de
  la función. La carpeta manda: lo que pongas ahí desde el explorador aparece
  en la app. Si renombras la actividad desde la app, su carpeta la acompaña
  (si la renombras desde Obsidian, renombra también su carpeta de evidencias).
- **Agenda:** vistas de día, semana (por defecto) y mes, con festivos de
  Colombia. Las actividades aparecen en su fecha límite (en PC se arrastran a
  otro día para reprogramarlas). Los compromisos con hora (reuniones, citas)
  y la nota del día se guardan en `Agenda/AAAA/MM/AAAA-MM-DD.md`, compatible
  con el plugin "Daily notes" de Obsidian (formato `YYYY/MM/YYYY-MM-DD`,
  carpeta `Agenda`). Los compromisos son casillas `- [ ] 09:00–10:00 …`.
  Cuando su hora de fin (o de inicio, o el día completo si no tienen hora)
  ya pasó, la app los marca `[x]` sola. Si uno no se realizó, se marca como
  "No se realizó" (`- [-]`, tarea cancelada en Obsidian) y ya no se toca.
- Respaldo: copia la carpeta completa. Si la bóveda está en OneDrive, marca la
  carpeta como "Mantener siempre en este dispositivo" y evita editar la misma
  nota en dos equipos a la vez (OneDrive crearía copias en conflicto).

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
- Prioridad (alta/media/baja), etiquetas y actividades recurrentes.
- Evidencias adjuntas (PDF, imágenes, documentos) por actividad.
- Filtros por estado, trabajo, prioridad, etiqueta y rango de fechas;
  orden por fecha o prioridad.
- Navegación por niveles: tarjetas de trabajos → página del trabajo con
  pestañas por función. Actividades en una línea, agrupadas por urgencia
  (Vencidas, Hoy, Próximos 7 días…) o en tablero por estado (arrastrar en PC).
- Panel de detalle de cada actividad y formulario rápido para agregar
  (lo opcional queda en "Más opciones").
- Búsqueda de actividades (sin importar tildes) y filtros plegables.
- Diseño adaptable: menú lateral en PC, menú inferior y botón + en celular.
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

## Datos de ejemplo

Para probar la app sin tus datos reales:

```bash
npm run ejemplo
```

Crea la carpeta `boveda-ejemplo/` con 3 trabajos, 6 funciones y 15
actividades de un funcionario (presupuesto, PQRS, entes de control, comité
de convivencia y formación). Incluye prioridades, etiquetas, actividades
recurrentes, evidencias en PDF y compromisos en la agenda. Las fechas se calculan desde el día en que
lo ejecutas, así que siempre hay actividades vencidas, próximas y a tiempo.
Ábrela desde la app con **Bóveda → Cambiar de carpeta**. Para regenerarla,
borra la carpeta y vuelve a ejecutar el comando (no sobrescribe nada).

## Integración y publicación (GitHub Actions)

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

- En cada push y Pull Request corre lint, pruebas y build.
- Si todo pasa en `main`, publica la app en GitHub Pages.

Configuración única en GitHub: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas (Vitest) |
| `npm run ejemplo` | Genera una bóveda con datos de muestra en `boveda-ejemplo/` |
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
| 2 | Modelo ampliado: prioridad, etiquetas, recurrencia, evidencias | ✅ |
| 3 | Agenda: día/semana/mes, compromisos y notas diarias | ✅ |
| 4 | Recordatorios y app de escritorio (Tauri) | Pendiente |
| 5 | Informes de gestión (Markdown / PDF / Word) | Pendiente |
| 6 | Calidad: más pruebas y revisión | Continuo |
