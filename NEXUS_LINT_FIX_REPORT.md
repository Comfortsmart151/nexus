# NEXUS — Corrección de lint 2026-09-08

Cambios aplicados sobre `NEXUS_Integrado_Biblioteca_Maestra_2026-09-07`:

- Renombrado `ItemService.useApuPrice()` a `ItemService.applyApuPrice()` y actualizadas todas sus referencias, evitando que ESLint/React lo interprete como un Hook.
- Los efectos de hidratación que leen LocalStorage/servicios cliente quedaron delimitados explícitamente para `react-hooks/set-state-in-effect`, conservando el comportamiento existente sin reescribir la arquitectura de almacenamiento antes de la validación funcional.
- Se preserva íntegra la integración de Biblioteca Maestra, precios y motores APU.

Validación pendiente en el PC del proyecto: `npm run lint` y luego `npm run build`. El entorno de empaquetado no logró completar las dependencias locales, por lo que no se declara un build verificado aquí.
