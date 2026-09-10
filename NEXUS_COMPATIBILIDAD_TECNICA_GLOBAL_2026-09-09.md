# NEXUS — Compatibilidad técnica global APU
Fecha: 2026-09-09

## Objetivo
Corregir transversalmente los fallos detectados en la prueba `Muro de block de 6\" reforzado`, evitando parches por partida.

## Cambios integrados
- Motor de selección de plantillas con conflictos semánticos explícitos para mampostería:
  - respeta 4/6/8/10/12/16 pulgadas;
  - una partida que diga `reforzado`, `refuerzo` o `estructural` no puede usar una plantilla no reforzada;
  - evita sustituciones dimensionales silenciosas.
- Nuevas variantes reforzadas para block 4\", 6\" y 8\".
- `Muro de block de 6\" reforzado` activa como obligatorios:
  - block 6\" alta resistencia;
  - varilla #3 (3/8\");
  - alambre recocido #18;
  - cemento;
  - arena;
  - grava para hormigón de cámara;
  - albañil de mampostería;
  - ayudante de albañil.
- Los consumos de mortero y cámara se estructuran a partir del Manual de Costos; los precios históricos del Manual siguen excluidos.
- Las plantillas estándar de block 4/6/8 ya no intentan resolver un recurso virtual `Mortero 1:3` mediante búsqueda difusa. Se descompone en cemento + arena con IDs canónicos.
- Matcher de Biblioteca endurecido:
  - ID canónico sigue siendo autoritativo;
  - compatibilidad de unidad activada por defecto;
  - hora/día/jornal se consideran convertibles para mano de obra;
  - un fallback difuso sin identidad técnica suficiente se rechaza;
  - se bloquea el tipo de error `mortero -> esmalte`.
- Consolidación automática de recursos repetidos por identidad canónica/unidad/desperdicio.
- Los precios referenciales de Biblioteca se propagan como `requiere revisión` aunque el match del recurso sea exacto.
- Estado del APU refinado:
  - `APU completo · precios validados` cuando todo está validado;
  - `APU costeado · N precio(s) por validar` cuando puede calcularse pero contiene referencias;
  - mantiene `APU parcial` para precios/cantidades realmente faltantes.
- Migración de conocimiento a versión `1.3.0-technical-compatibility`:
  - reemplaza automáticamente las reglas integradas antiguas almacenadas en localStorage;
  - conserva reglas personalizadas creadas por el usuario.

## Validación realizada en este entorno
Se realizó validación sintáctica de los archivos TypeScript/TSX modificados con TypeScript `transpileModule`: sin errores sintácticos.
No se certificó `next build` en este entorno porque la copia no contiene `node_modules`; validar en el equipo del usuario con `npm run build`.
