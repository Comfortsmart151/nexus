# NEXUS — Integración masiva del Manual de Costos
Fecha: 2026-09-09

## Resultado
Se sustituyó la estrategia de plantillas piloto por una integración masiva del conocimiento cuantitativo utilizable del Manual de Costos.

- Versión de conocimiento: `1.2.0-manual-cost-full`
- 4 plantillas iniciales conservadas.
- 27 variantes/plantillas adicionales generadas en código.
- Cobertura total del paquete: 31 plantillas/variantes técnicas del Manual.
- Los precios históricos del Manual NO se importan.
- Cada recurso se resuelve contra la Biblioteca Maestra NEXUS y sus precios vigentes/referenciales.
- Coeficientes, desperdicios, rendimientos, supuestos y advertencias quedan auditables.

## Familias integradas
- Excavación manual: tierra, tosca, grava, caliche y roca blanda.
- Paleo, bote/acarreo manual y rellenos/compactación.
- Mortero 1:3.
- Hormigones 160, 180 y 210 kg/cm².
- Ligado/vaciado con ligadora.
- Andamio de madera y amortización por usos.
- Mampostería de block 4, 6 y 8 pulgadas; variante reforzada de 8 pulgadas.
- Viga y losa de hormigón armado como plantillas base auditables.
- Pañete de pared y techo.
- Fino de techo, zabaleta y canto.
- Piso mosaico/granito y piso cerámico.
- Revestimiento cerámico en pared de baño.
- Piso frotado/rejón.
- Pintura acrílica.

## Reglas de seguridad técnica
1. Los precios del manual son históricos: nunca se usan para costear.
2. Los precios salen de Biblioteca NEXUS.
3. Datos dependientes de planos (cuantías, separaciones, espesores, resistencia, refuerzo) se marcan para revisión.
4. Cuando el Manual ofrece un rendimiento o consumo cuantitativo, se normaliza a la unidad técnica del APU.
5. No se inventan coeficientes para capítulos descriptivos sin análisis cuantitativo suficiente.
6. La migración de conocimiento incorpora estas reglas built-in sin borrar reglas personalizadas del usuario.

## Prueba recomendada
La validación ya no condiciona la integración. Probar una batería representativa después de instalar:
- Excavación manual en tosca
- Relleno compactado con caliche
- Hormigón 210 kg/cm²
- Muro de block 6 pulgadas
- Viga de hormigón armado
- Pañete de pared
- Piso de cerámica
- Pintura acrílica

Si una prueba falla, corregir el matcher/motor común, no volver a construir manualmente cada APU.
