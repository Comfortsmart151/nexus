# NEXUS V4.0.1 — Construcosto conectado al motor semántico

## Corrección
Los 440 análisis de costos de Construcosto dejan de ser únicamente un catálogo consultable y pasan a participar antes que las reglas genéricas del generador APU.

## Ejemplo validado
- Entrada: `charrancha`
- Coincidencia: `100.02 · REPLANTEO Y CHARRANCHA`
- Unidad: m²
- Agosto 2026: Santo Domingo RD$280.88; Santiago–Cibao RD$279.76; Punta Cana RD$279.64.

## Protección técnica
La coincidencia exige un umbral alto. Una coincidencia Construcosto fuerte tiene prioridad sobre una regla genérica para evitar APUs semánticamente incorrectos.

El archivo fuente de análisis suministra el costo total de la partida, pero no el desglose interno de materiales/mano de obra/equipos. Por ello NEXUS crea una referencia compuesta auditable en el APU y la identifica explícitamente como análisis Construcosto, sin inventar un desglose inexistente.

La región se toma del proyecto; para proyectos sin región explícita se conserva Santiago–Cibao como compatibilidad.
