# NEXUS V4.0 — Construcosto Regional · Agosto 2026

## Fuente integrada
- 7,488 registros suministrados por el usuario.
- 3 regiones: Santo Domingo, Santiago–Cibao y Punta Cana.
- 4 bloques de información: materiales e insumos, mano de obra, análisis de costos, equipos/movimiento de tierra.

## Resultado de integración
- Biblioteca NEXUS anterior: **5,840** recursos.
- Recursos canónicos Construcosto con precios regionales: **2,056**.
  - 1,377 materiales.
  - 643 mano de obra.
  - 36 equipos/movimiento de tierra.
- Coincidencias seguras contra biblioteca existente: **812**.
- Recursos nuevos agregados: **1,244**.
- Biblioteca NEXUS final: **7,084 recursos**.
- Análisis de costos incorporados como banco de referencia: **440**.
- Coincidencias ambiguas protegidas: **68**; no se sobrescribieron automáticamente.

## Arquitectura regional
Cada recurso Construcosto mantiene hasta tres precios regionales, conservando fuente, periodo, proveedor y URL. Para compatibilidad con proyectos existentes, el precio base del maestro usa Santiago–Cibao. Los proyectos nuevos permiten seleccionar la región de precios y los APU usan esa selección cuando existe precio regional.

Al cambiar la región de un proyecto, NEXUS actualiza los recursos APU vinculados a la biblioteca y recalcula el precio unitario de las partidas afectadas.

## Interfaz
- Biblioteca: selector de región visible y precio mostrado según región.
- Proyectos nuevos: selección de región de precios junto a la ubicación.
- Proyecto existente: región editable desde el encabezado.
- Biblioteca > Análisis Construcosto: nuevo banco consultable de 440 análisis de costos, con búsqueda y selector regional.
- Generador NEXUS IA: al generar APU para un proyecto usa el precio regional del recurso en lugar del precio base genérico.

## Política de deduplicación
Se actualizaron recursos existentes únicamente cuando la coincidencia nombre + unidad era única tanto en la fuente como en NEXUS. Cuando el mismo nombre/unidad tenía significados o precios distintos por grupo (por ejemplo, suministro vs todo costo), se creó un registro independiente con calificador de grupo para evitar mezclar conceptos técnicamente diferentes.

## Archivos de datos nuevos
- `src/data/construcostoRegionalCatalog.json`
- `src/data/construcostoCostAnalyses.json`
- `src/data/construcostoIntegrationReport.json`

## Nota de validación
Se ejecutó comprobación estructural y TypeScript hasta el punto permitido por el entorno. El build completo no pudo ejecutarse aquí porque las dependencias npm no están instaladas y la instalación agotó el tiempo disponible. Debe ejecutarse `npm install` y `npm run build` en el equipo de desarrollo antes del siguiente commit estable.
