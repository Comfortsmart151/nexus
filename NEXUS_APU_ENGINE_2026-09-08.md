# NEXUS — Motor Técnico APU 2026-09-08

## Cambios integrados
- APU ya no se considera completo solo por tener recursos.
- Detecta precios <= 0 y cantidades inválidas; muestra costo parcial y estado en revisión.
- `priced` solo se asigna cuando el APU es realmente costeable.
- Recursos del APU conservan estado/origen del precio: confirmado, referencial por confirmar, manual o faltante.
- La tabla del APU muestra la trazabilidad del precio.
- NEXUS AI aplica coeficientes sobre una base estándar de 1 unidad de partida (`analysisVolume = 1`).
- Reglas de muro de block 6" y 8" alineadas con unidades reales de la Biblioteca Maestra (kg y hora) para evitar mezclar funda/día con kg/hora.
- Recursos opcionales sin precio dejan de introducir RD$0.00 en propuestas automáticas.
- Bloque 6" referencial por m²: 12.5 block + 5% desperdicio; cemento 5.1 kg + 5%; arena 0.018 m³ + 8%; albañil 0.8 h; ayudante 0.8 h. Todos los coeficientes siguen siendo editables y deben validarse según proyecto.

## Validación recomendada
Crear o usar una partida `Muro de block de 6"`, cantidad 100 m². Abrir `Generar con IA`, aplicar propuesta y verificar que el análisis quede sobre 1 m² y el presupuesto multiplique el precio unitario por 100 m².
