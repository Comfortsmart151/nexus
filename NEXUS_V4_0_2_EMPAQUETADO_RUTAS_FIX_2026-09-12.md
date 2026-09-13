# NEXUS V4.0.2 — Corrección de empaquetado y rutas

Fecha: 2026-09-12

## Causa real del 404 observado en V4.0.1

El código de las rutas dinámicas sí estaba presente en V4.0.1. El problema era el empaquetado del ZIP: todos los archivos quedaron dentro de una carpeta superior `nexus_v401/`.

Al descomprimir el ZIP dentro de `NEXUS_V4_0_1_...` y ejecutar `npm run dev` desde esa carpeta exterior, npm subió al directorio Desktop y encontró otro `package.json`/`package-lock.json`. Por eso Next.js mostró el aviso de múltiples lockfiles y arrancó un workspace distinto al proyecto empaquetado. Eso explica por qué `/projects/[id]` podía resolver en ese workspace mientras rutas como `/chapters`, `/budget` y `/contracts` devolvían 404.

## Corrección V4.0.2

- El ZIP ahora está empaquetado con `package.json`, `package-lock.json`, `src/`, `public/` y `next.config.ts` directamente en la raíz.
- Se conserva íntegro el árbol de rutas de V3.9:
  - `/projects/[id]`
  - `/projects/[id]/chapters`
  - `/projects/[id]/chapters/[chapterId]/items`
  - `/projects/[id]/chapters/[chapterId]/items/[itemId]`
  - `/projects/[id]/budget`
  - `/projects/[id]/contracts`
  - `/projects/[id]/plans`
  - `/projects/[id]/plans/[planId]/analysis`
- Se mantienen las integraciones de V4.0/V4.0.1: precios regionales Construcosto y motor semántico de análisis.

## Verificación de estructura

Se comparó el árbol de rutas de V3.9 con V4.0.1 y las páginas dinámicas son equivalentes; la regresión provenía del nivel extra del ZIP, no de la eliminación de rutas.
