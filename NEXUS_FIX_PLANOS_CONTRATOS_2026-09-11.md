# NEXUS — Corrección Planos + Contratos

Fecha: 2026-09-11

## Corregido

- Hydration mismatch en `PlansWorkspace`.
  - El proyecto ya no se lee directamente desde `localStorage` durante el primer render.
  - Se agregó un estado de inicialización cliente (`Cargando proyecto...`) y la lectura se realiza en `useEffect`.
  - Se añadió manejo de errores al subir y abrir planos.

- Error `Cannot read properties of null (reading 'reset')` en `ContractsWorkspace`.
  - El elemento `form` se captura antes de cualquier `await`.
  - El `reset()` se ejecuta sobre la referencia estable luego de guardar.
  - Se añadió `try/catch/finally` para que `Guardando...` siempre termine, incluso si ocurre un error.
  - Se añadió manejo de errores al abrir adjuntos.
  - Se aplicó el mismo patrón de inicialización cliente para evitar posibles hydration mismatches en Contratos.

## No modificado

- Biblioteca Maestra
- Precios
- APU
- Proyectos
- Presupuestos
- Servicios de almacenamiento de archivos
