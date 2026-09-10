# NEXUS — Normalización MO + herramientas

## Cambios
- Las plantillas que especifican `resourceCode` ahora vinculan primero el recurso canónico exacto. Esto evita que `Ayudante general` termine sustituido por un recurso genérico con unidad día.
- Mano de obra de plantillas expresada en `hora` se mantiene en horas. Si una fuente comercial viene por día/jornal, NEXUS normaliza el precio a 8 h/jornada antes de calcular.
- Si el usuario activa Herramientas y la plantilla no contiene equipo específico, NEXUS agrega `Herramientas menores (3% mano de obra)` como provisión paramétrica auditable, marcada para revisión; ya no queda silenciosamente en RD$0.00.
- Si una plantilla sí contiene equipos específicos, se usan esos equipos y no se agrega la provisión genérica.

## Validación esperada — Excavación manual en tierra
- Obrero de movimiento de tierra: 2.424 h/m³.
- Ayudante general: 0.444 h/m³.
- Ambos vinculados por código canónico de Biblioteca.
- Herramientas menores: costo distinto de cero cuando la opción Herramientas esté activada.

Nota: el entorno de empaquetado no tiene `node_modules`; la validación final de Next/TypeScript debe ejecutarse en el equipo local con `npm run build`, igual que en las entregas anteriores.
