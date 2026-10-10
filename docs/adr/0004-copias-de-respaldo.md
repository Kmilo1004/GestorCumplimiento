# ADR-0004: Copias de respaldo automáticas en otra carpeta

**Estado:** Aceptado
**Fecha:** 2026-10-09
**Decide:** Usuario (funcionario dueño de la app)

## Contexto

La bóveda vive en una sola carpeta del portátil. Si el disco falla o la
carpeta se borra, se pierde todo. La exportación JSON existente es manual y no
incluye agenda, campos personalizados ni evidencias.

## Decisión

1. **Destino aparte, elegido por el usuario** (OneDrive, USB, carpeta de red).
   No puede ser la bóveda, ni estar dentro de ella, ni contenerla: las copias
   acabarían dentro de la propia bóveda.
2. **Copia completa** de la bóveda, con evidencias, agenda y
   `.cumplimiento/`; solo se excluye `.papelera/`:

   ```
   <destino>/<Bóveda>/2026-10-09 15-30/...
   <destino>/<Bóveda>/2026-10-09 15-30/.respaldo-completo.json
   ```

3. **Frecuencia** elegible: cada 12 horas, diaria (predeterminada), semanal o
   desactivada.
4. **Solo con la app abierta** (es una página web): al abrir la bóveda se revisa
   si ya toca, y luego cada minuto. Tras un fallo se espera 15 minutos antes de
   reintentar.
5. **Marca de copia completa** escrita al final. Una copia cortada no cuenta
   como respaldo y se borra en la siguiente poda.
6. **Se conservan las últimas 10** copias completas por bóveda. En la carpeta de
   respaldos las más viejas **se borran de verdad**, no van a `.papelera/`: ese
   es justamente el límite pedido. La regla "nunca borrar" sigue aplicando a la
   bóveda.
7. Si un archivo no se puede copiar (p. ej. ruta demasiado larga), la copia
   sigue y lo anota; la app muestra cuántos fallaron.
8. El handle de la carpeta de destino y la frecuencia se guardan en IndexedDB
   (son de cada equipo, como el handle de la bóveda). La fecha de la última
   copia se lee de la propia carpeta de respaldos.
9. Si al reabrir la app el navegador pide confirmar el acceso al destino, se
   muestra el aviso "Copias de respaldo en pausa" hasta que el usuario lo permita.

## Consecuencias

- Las copias ocupan espacio: 10 copias completas, con evidencias, pesan 10 veces
  la bóveda.
- Con la app cerrada no hay copias; en Tauri (Fase 4 del ADR-0001) podrían
  hacerse en segundo plano usando la misma lógica (`services/vault/respaldo.js`).
- La ruta del destino suma al largo de cada archivo copiado (ver ADR-0003):
  conviene un destino de ruta corta.
