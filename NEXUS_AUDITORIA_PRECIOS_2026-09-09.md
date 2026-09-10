# NEXUS — Auditoría de precios 2026-09-09

## Resultado
- Biblioteca auditada: 4,666 recursos.
- Recursos con valor: 4,666.
- Precios de baja confianza: 3,585.
- Referencias masivas clonadas detectadas: 3,402.
- Fallbacks genéricos tipo+unidad aún identificados: 2,695.
- Outliers evidentes de equipo menor con RD$4,377/h: 0 después de la corrección.

## Correcciones inmediatas
- Agua para construcción: RD$1.71/gal, coincidencia directa en ControlObra / PreciosObra para “Para hormigones y morteros, agua” en Cibao Norte. Se conserva como precio referencial web, no cotización formal.
- Mezcladora de hormigón tipo trompo 1 saco: RD$275/h, referencia paramétrica de baja confianza, por confirmar.
- Mezcladora de hormigón 9 ft³: RD$275/h, referencia paramétrica de baja confianza, por confirmar.
- Vibrador de inmersión 1.5 in: RD$125/h, referencia paramétrica de baja confianza, por confirmar.
- Vibrador de inmersión 2 in: RD$125/h, referencia paramétrica de baja confianza, por confirmar.
- También se corrigieron seis equipos menores que heredaban el mismo RD$4,377/h de maquinaria pesada: mezcladora de mortero, taladro magnético, sierra circular, sierra de mesa, taladro/atornillador y pulidora de piso.

## Control de calidad agregado
- `scripts/audit-reference-prices.mjs` permite repetir la auditoría completa.
- `src/data/nexusPriceAudit.json` contiene la auditoría recurso por recurso.
- Los precios LOW repetidos masivamente quedan etiquetados `precio-referencial-masivo-revisar` y con observación explícita de revisión contractual.
- No se eliminó ningún precio ni se volvió a RD$0.00; se mantiene el criterio de cobertura total para la demo.

## Impacto esperado en el APU de hormigón 210
Con las mismas cantidades de la prueba anterior, la corrección de agua y equipos reduce el costo directo aproximado desde RD$16,834.32/m³ a ~RD$10.1 mil/m³, antes de cualquier ajuste adicional de desperdicio o cotización. El objetivo es acercar el resultado a una escala de mercado defendible sin tratar precios paramétricos como confirmados.
