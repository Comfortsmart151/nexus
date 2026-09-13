# NEXUS V4.1 — Construcosto APU detallado · Agosto 2026

## Fuentes integradas

- Análisis de Costos — Santo Domingo — agosto 2026.
- Análisis de Costos — Santiago–Cibao — agosto 2026.
- Análisis de Costos — Punta Cana — agosto 2026.
- Mano de Obra — Santiago–Cibao — agosto 2026.
- Equipos y Movimientos de Tierra — Santiago–Cibao — agosto 2026.

Los archivos HTML fueron suministrados por el usuario desde páginas a las que tiene acceso autorizado. NEXUS conserva únicamente la estructura necesaria para consulta y cálculo interno.

## Integración principal

- 440 análisis de costos con desglose interno capturado en las tres regiones.
- 438 análisis por región pasan la auditoría automática y pueden generar APU desglosado directamente.
- 2 análisis por región presentan inconsistencia entre las líneas visibles y el precio publicado; NEXUS conserva el precio compuesto y los marca para revisión en lugar de aplicar un desglose incorrecto.
- 1,320 variantes regionales de APU (440 × 3).
- 8,547 líneas regionales de recursos extraídas.
- Cada análisis conserva volumen base, unidad, rendimiento cuando existe, recursos, cantidades fuente, precios, importes y total publicado.
- Cada línea se normaliza a coeficiente por una unidad de partida.
- Las líneas porcentuales y ajustes especiales se normalizan usando el importe publicado para conservar el costo real del APU.
- 4,329 líneas pudieron vincularse de forma segura con la Biblioteca Maestra; 4,218 permanecen con nomenclatura y precio de fuente, sin forzar coincidencias dudosas.

## Motor NEXUS IA

Antes de las reglas genéricas, NEXUS busca una coincidencia fuerte en el banco Construcosto. Cuando existe APU detallado para la región del proyecto:

1. Selecciona la variante regional.
2. Usa el volumen base publicado.
3. Normaliza todos los recursos a una unidad de partida.
4. Genera materiales, mano de obra, equipos y subcontratos como líneas reales de APU.
5. Conserva el precio unitario de fuente de cada recurso.
6. Vincula a Biblioteca Maestra cuando la coincidencia es segura.
7. Conserva recursos no vinculados como recursos de fuente, en lugar de inventar un equivalente.
8. Audita diferencias entre suma de líneas, total del análisis y precio unitario publicado.

Ejemplo validado: `100.02 REPLANTEO Y CHARRANCHA` usa volumen fuente de 242 m² y genera 10 líneas de recursos. El costo recalculado por m² coincide con el precio publicado en cada región dentro del redondeo de fuente.

## Banco Construcosto en interfaz

La vista `/library/construcosto` ahora permite expandir cada análisis y consultar:

- volumen base;
- rendimiento publicado;
- recursos;
- cantidad fuente;
- coeficiente normalizado;
- precio unitario;
- subtotal unitario;
- vínculo con Biblioteca Maestra cuando existe.

## Fuentes auxiliares Santiago–Cibao

- Equipos y movimientos de tierra: 36 registros.
- Mano de obra: 7 jornales diarios + 636 análisis/rendimientos = 643 registros.

## Auditoría

La auditoría detectó 6 variantes regionales con diferencia material respecto al precio publicado, correspondientes a 2 análisis repetidos en las tres regiones. NEXUS no usa automáticamente esos desgloses y conserva el precio regional compuesto como fallback seguro.

La instalación de dependencias no pudo completarse en el entorno de generación por límite de tiempo. Se ejecutó validación estática con TypeScript global; los errores observados corresponden a módulos React/Next no instalados en este entorno, sin errores específicos detectados en el nuevo servicio regional ni en el motor generador V4.1.
