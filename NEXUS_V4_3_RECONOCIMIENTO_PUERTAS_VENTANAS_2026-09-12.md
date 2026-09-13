# NEXUS V4.3 — Reconocimiento de puertas, ventanas y huecos

Base: NEXUS V4.2.2.

## Implementado
- Nuevo modelo `PlanArchitecturalElement` para puertas y ventanas detectadas.
- Detección conservadora desde evidencia textual/vectorial del PDF: rótulos ACCESO, cotas repetidas de ancho/alto y elevaciones.
- Panel de revisión humana con cantidad, ancho y alto editables y casilla de confirmación.
- Cálculo de área de huecos y área neta de cerramiento exterior.
- El área neta se recalcula al corregir cantidades/dimensiones.
- Nuevas propuestas PLN-005 (puertas) y PLN-006 (ventanas).
- Las partidas de puertas/ventanas siguen requiriendo aceptación humana antes de incorporarse.
- NEXUS no inventa elementos que no estén sustentados por el PDF; los elementos visibles no acotados quedan para confirmación manual.

## Caso de prueba Oficinas Contenedor
El plano dimensionado contiene dos rótulos ACCESO y cotas de 1.000 m; las elevaciones aportan altura candidata de puerta. Las elevaciones laterales contienen ventanas explícitamente acotadas aproximadamente 1.20 x 1.50 m. V4.3 utiliza esa evidencia y permite al usuario corregir el conteo si existen otras ventanas visibles no acotadas.

## Validación
Se ejecutó TypeScript sin dependencias instaladas. El entorno reporta los errores esperados por ausencia de Next/React/lucide y JSX types; no aparecieron errores TypeScript específicos nuevos en `planAnalysis.service.ts` o `types/planAnalysis.ts`. No se marca `npm build` como validado.
