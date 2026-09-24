# App de Cumplimiento de Funciones

PWA (Fase 1 — MVP local, sin backend) para llevar el control del cumplimiento
de funciones laborales, con jerarquía de 3 niveles:

```
Trabajo → Función → Actividad
```

Hecha con **React + Vite + Tailwind CSS**, persistencia local con
**IndexedDB** y pensada para desplegarse en **GitHub Pages**.

## Funcionalidades

- CRUD completo en los 3 niveles (Trabajo, Función, Actividad).
- Vista jerárquica tipo árbol/acordeón.
- Cada Actividad tiene: nombre, descripción, fecha límite, estado
  (pendiente / en progreso / completada) y notas.
- % de cumplimiento calculado automáticamente hacia arriba (actividad →
  función → trabajo): pendiente = 0%, en progreso = 50%, completada = 100%,
  y cada nivel superior promedia el de sus hijos.
- Alertas de vencimiento: badge de color cuando una actividad está vencida
  (rojo) o próxima a vencer en 2 días o menos (ámbar).
- Dashboard con resumen general y lista de actividades vencidas/próximas.
- Filtros por estado, trabajo y rango de fechas.
- Exportar todos los datos a JSON (backup) e importar desde JSON
  (con opción de reemplazar o combinar).
- Mobile-first, responsive, instalable como PWA y funciona offline después
  de la primera carga.

## Estructura del proyecto

```
app-cumplimiento/
├── src/
│   ├── components/      # UI (layout, ui genérica, trabajos, actividades, dashboard, backup)
│   ├── models/           # Trabajo, Función, Actividad (formas de datos + constantes)
│   ├── services/         # indexedDB.js (bajo nivel) + dataService.js (API que usa la UI)
│   ├── utils/             # compliance.js (% de cumplimiento) y alerts.js (vencimientos)
│   └── context/          # DataContext: carga el árbol y expone el CRUD a toda la app
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
├── data-exports/         # Carpeta sugerida para guardar tus backups JSON descargados
└── .github/workflows/    # Despliegue automático a GitHub Pages (opcional)
```

## Cómo correrla en local

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente http://localhost:5173).

## Build de producción

```bash
npm run build
npm run preview   # para probar el build localmente
```

El resultado queda en `dist/`, con rutas relativas (`base: './'` en
`vite.config.js`), así que funciona tanto en la raíz de un dominio como en
un subdirectorio de GitHub Pages.

## Desplegar en GitHub Pages

**Opción A — Automático (recomendada):**
Ya incluye un workflow en `.github/workflows/deploy.yml`. Solo necesitas:

1. Crear un repositorio en GitHub y subir este proyecto (`git init`,
   `git add .`, `git commit`, `git push`).
2. En GitHub → Settings → Pages, elegir "GitHub Actions" como fuente.
3. Cada push a `main` construye y publica `dist/` automáticamente.

**Opción B — Manual:**

```bash
npm run build
npx gh-pages -d dist
```

(requiere `npm install -D gh-pages` una vez, o usar cualquier otra forma de
publicar el contenido de `dist/` en la rama `gh-pages`).

## Backups

Desde la pestaña **Backup** puedes exportar todos tus datos a un archivo
JSON (útil guardarlo en `data-exports/` o en tu nube personal) y volver a
importarlos, ya sea reemplazando todo o combinando con lo que ya tengas.

## Fase 2 (futuro): sincronización con Firebase Firestore

La UI y los `utils/` de cálculo **solo conocen `src/services/dataService.js`**,
nunca hablan directamente con IndexedDB. Cuando llegue la Fase 2:

1. Se crea un nuevo archivo (p. ej. `src/services/firestoreService.js`) que
   implemente las mismas funciones exportadas que `dataService.js`
   (`listarTrabajos`, `crearTrabajoService`, `cargarTodo`, `exportarDatos`,
   etc.) pero hablando con Firestore.
2. Se reemplaza la implementación de `dataService.js` (o se decide ahí
   mismo, con un flag, si usar IndexedDB u online) sin tocar componentes,
   `DataContext` ni `utils/compliance.js` / `utils/alerts.js`.
3. Los `id` ya son UUID generados en el cliente (`crypto.randomUUID()`), lo
   cual es compatible con IDs de documento en Firestore, así que no hace
   falta migrar identificadores.
