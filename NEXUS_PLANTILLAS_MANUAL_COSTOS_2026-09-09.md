# NEXUS — Plantillas técnicas desde Manual de Costos

Fecha: 2026-09-09

## Integración

Se incorporó el Manual de Costos aportado al proyecto como fuente de conocimiento técnico para el generador APU.

Principio aplicado:
- El manual aporta composición, unidades, proporciones, rendimientos y desperdicios.
- Los precios históricos del manual NO se importan.
- Los precios se resuelven siempre contra la Biblioteca Maestra NEXUS vigente.
- Los coeficientes permanecen editables y auditables.

## Nuevas plantillas estructuradas

1. NEXUS-MAN-MOR-001 — Mortero cemento-arena 1:3
   - 340 kg cemento / m³
   - 0.99 m³ arena / m³
   - 4 h albañil / m³

2. NEXUS-MAN-MT-001 — Excavación manual en tierra
   - Picado: rendimiento 3.30 m³/día
   - Paleo: rendimiento 18 m³/día
   - Normalizado a horas por m³.

3. NEXUS-MAN-MAM-008R — Muro de block 8 in reforzado
   - 12.5 blocks/m² + 3% desperdicio
   - acero y alambre normalizados a kg
   - mortero 1:3 derivado de 0.039 m³/m²
   - advertencias explícitas para hormigón de cámara y refuerzo estructural.

4. NEXUS-MAN-PIN-001 — Pintura acrílica
   - 0.10 gal/m²
   - lija 0.025 ud/m²
   - rodillo/brocha como herramientas amortizables
   - mano de obra normalizada a h/m².

## Persistencia

Se actualizó NexusAiKnowledgeService para que una instalación existente incorpore automáticamente nuevas plantillas built-in sin borrar reglas guardadas por el usuario.

Versión de conocimiento: 1.1.0-manual-cost-templates

## Corrección adicional

Se reparó un bloque sintáctico residual en la regla de muro de block 6 in de la versión anterior.

## Próxima expansión

El mismo esquema permite estructurar del Manual de Costos:
- rellenos y compactación
- bote y acarreo
- hormigones 160/180/210
- columnas, vigas y losas
- acero y cuantías
- encofrados y factor de uso
- pañetes y terminaciones
- zabaletas/cantos
- pisos
- pintura y variantes

La arquitectura queda preparada para seguir ampliando el catálogo sin volver a codificar el motor central.
