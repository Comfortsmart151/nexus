# NEXUS — Motor de Planos v3: interpretación geométrica

## Objetivo
Superar la limitación del motor v2, que dependía principalmente de dimensiones escritas como `A x B m`.

## Implementado
- Extracción de texto con posición X/Y y rotación desde `pdfjs-dist`.
- Detección automática de la lámina con mayor probabilidad de ser `PLANTA DIMENSIONADA`.
- Clasificación de cotas horizontales y verticales.
- Detección de cotas maestras de largo/ancho.
- Reconstrucción de cadenas de tramos interiores por alineación espacial.
- Detección del ancho libre repetido.
- Reconocimiento de espacios rotulados (oficinas, recepción, sala de reuniones, baños, etc.).
- Detección de altura útil repetida en elevaciones.
- Cálculo defendible de:
  - área bruta de huella;
  - área útil interior;
  - perímetro exterior;
  - longitud base de divisiones interiores;
  - área bruta de cerramientos exteriores.
- Propuestas de partidas sujetas a revisión humana.
- Nueva UI `Geometría interpretada` con trazabilidad de las mediciones.

## Seguridad técnica
- No se asume todavía geometría completa de líneas/polilíneas o bloques CAD.
- No se descuentan automáticamente huecos de puertas/ventanas hasta incorporar detección gráfica/vectorial.
- Las superficies de muro se marcan como brutas.
- Toda partida sigue requiriendo aceptación humana antes de incorporarse.

## Stress test
Diseñado específicamente para resolver planos CAD exportados a PDF donde las cotas aparecen como números independientes alrededor de la planta, como `10.12.25 Oficinas Contenedor - CG.pdf`.
