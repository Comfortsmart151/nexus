# NEXUS V3.6 — Navegación persistente + revisión manual de partidas IA

## Navegación
- Se añadió `AppShell` al layout raíz.
- La navegación principal permanece visible en todas las rutas de trabajo de NEXUS.
- Landing conserva su diseño y Dashboard conserva su sidebar existente para evitar duplicación.
- La opción activa se calcula desde la ruta actual.

## Revisión de partidas detectadas por planos
Antes de incorporar una propuesta IA ahora se puede editar:
- cantidad detectada;
- unidad;
- desperdicio/holgura adicional (%);
- ajuste manual de precio (%);
- nota de revisión.

El sistema muestra la cantidad final a incorporar antes de aprobar. El desperdicio de esta pantalla se aplica a la cantidad de la partida detectada (no sustituye el desperdicio técnico de cada recurso del APU). El ajuste de precio se conserva en la partida y se aplica sobre el precio unitario calculado por el APU, por lo que también fluye al presupuesto y a sus totales/exportaciones.

Los valores se guardan dentro del análisis del plano en localStorage antes de la incorporación.
