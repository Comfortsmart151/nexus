# NEXUS V4.2 — Flujo real del proyecto

- El progreso deja de depender de un 20% fijo y se calcula con datos reales.
- Paso 2 Capítulos: refleja cantidad real de capítulos.
- Paso 3 Partidas: nuevo centro global `/projects/[id]/items` con todas las partidas del proyecto.
- Paso 4 Análisis de precios: nuevo centro global `/projects/[id]/analyses` con APU valorizados y pendientes.
- Paso 5 Resumen y presupuesto: enlaza al presupuesto consolidado existente.
- Se conserva el flujo natural Capítulo → Partida → APU.
- El CTA principal del proyecto cambia según la etapa pendiente.

Cálculo de progreso: Información general 20%; capítulos 20% al existir; partidas 20% al existir; APU hasta 20% proporcionalmente según partidas valorizadas; presupuesto 20% cuando todas las partidas están valorizadas.
