# NEXUS — Compatibilidad Técnica APU ↔ Biblioteca

## Cambio consolidado
- Los recursos definidos por ID canónico en una regla APU se resuelven por ese ID antes de cualquier matching difuso.
- Se bloquean sustituciones con dimensiones/especificaciones numéricas incompatibles (ej. 6 in → 10 in).
- La regla de muro de block de 6 in apunta ahora a IDs reales de la Biblioteca Maestra:
  - MAT-04-001082 — Block de hormigón 6 in estándar
  - MAT-03-000026 — Cemento Portland puzolánico 42.5 kg
  - MAT-03-000029 — Arena lavada para hormigón
  - MO-04-000019 — Albañil de mampostería
  - MO-04-000020 — Ayudante de albañil
- Se retiraron de esta regla los opcionales `Agua para construcción` y `Herramientas menores` mientras no exista un recurso canónico técnicamente adecuado. Esto evita sustituciones absurdas como esmalte base agua.
- Si un recurso técnico requerido no puede resolverse de forma compatible, NEXUS debe dejarlo para revisión en vez de sustituirlo silenciosamente.

## Resultado esperado de la prueba
Para “muro de block de 6 in”, el generador no debe seleccionar block de 10 in, esmaltes ni ayudantes genéricos. Debe utilizar los cinco recursos canónicos indicados arriba.
