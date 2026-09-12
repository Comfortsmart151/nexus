# NEXUS — Exportación dual de presupuesto

Implementado sobre V3.3 Nomenclatura RD.

## Exportaciones
- PDF Cliente: presupuesto comercial por capítulos/partidas, cantidades, P.U., importes y total.
- Excel Cliente: hojas Resumen y Presupuesto, sin desglose interno de APU.
- PDF Técnico: presupuesto general + una sección APU por partida + validaciones + consolidado de recursos.
- Excel Técnico: Resumen, Presupuesto, APU, Recursos consolidados y Alertas y validaciones.

## Regla de cálculo
Las cuatro salidas usan el mismo precio unitario y los mismos ajustes del presupuesto de NEXUS. Para el consolidado técnico, la cantidad de cada recurso se escala por cantidad de partida / volumen de análisis e incluye desperdicio.
