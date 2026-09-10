# NEXUS — Integración Biblioteca Maestra 2026-09-07

## Integrado
- Biblioteca maestra: 4,665 recursos con IDs permanentes.
- Precios directos disponibles: 84 recursos.
- Ledger consolidado: 183 observaciones de precio.
- Alias RD incorporados a `tags` para búsqueda.
- Migración versionada e idempotente: `2026.09.07-consolidated`.
- La migración conserva recursos locales reales, favoritos, historial y precios manuales cuando el maestro no tiene precio.
- El seed histórico 586/599 deja de ejecutarse al abrir Biblioteca, evitando reinserciones/duplicados.
- Motor de recomendación de precios integrado en `NexusPricingService`.
- Motor de costo APU no inventa cantidades, precios ni rendimientos.
- Seeds de 50 APU, componentes y rendimientos incluidos como base de referencia.

## Validación de datos ejecutada
- 4,665 IDs únicos / 4,665 recursos.
- 0 IDs maestros duplicados.
- 84 recursos con precio directo > 0.
- 84 recursos con historial de precio.
- Búsquedas verificadas en el dataset: `alambre thhn 12`, `varilla 3/8`, `block 6`, `tubo pvc 4`, `sheetrock`.

## Build
No fue posible ejecutar `npm run lint`/`npm run build` en el entorno de empaquetado porque el ZIP recibido no incluía `node_modules` y `npm ci` no logró completar la descarga de dependencias. No se declara un build exitoso sin haberlo ejecutado.

En la PC del proyecto:
```powershell
npm ci
npm run lint
npm run build
npm run dev
```
