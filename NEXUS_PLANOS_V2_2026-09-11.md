# NEXUS — Motor de Planos v2

Implementado sobre la versión FIX de Planos + Contratos.

## Flujo
Subir PDF → Analizar → extraer texto/cotas → mediciones → partidas propuestas → aceptar/rechazar → incorporar aceptadas a un capítulo del proyecto.

## Seguridad funcional
- Nunca incorpora una partida sin aprobación humana.
- Conserva el origen del plano en la descripción de la partida para evitar duplicados.
- La v2 NO afirma interpretar todavía geometría vectorial completa, símbolos o imágenes rasterizadas.
- PDF: lectura de texto y dimensiones rotuladas mediante pdfjs-dist.

## Siguiente capa
Visión/IA para geometría, símbolos, puertas, ventanas, muros y planos escaneados; calibración de escala y trazabilidad gráfica por elemento.
