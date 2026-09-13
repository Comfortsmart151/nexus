# NEXUS V5.1 — Documentos comerciales

Base: V5.0.1b validada por usuario.

## Incorporado
- Emisión formal de presupuesto separada de exportación.
- Control previo: bloquea emisión con incidencias críticas.
- Emisión vinculada a revisión y código documental.
- Snapshot de identidad de empresa al emitir.
- Estado documental y vigencia.
- Logo cargable desde Configuración y vista previa.
- PDF Cliente con logo, código/estado, contacto, condiciones, vigencia y firmas.
- Excel Cliente/Técnico con contacto, código documental, vigencia, notas y responsable.
- Panel de emisión comercial dentro del Presupuesto.
- Historial persistente de documentos emitidos en `nexus-budget-documents`.

## Regla clave
Exportar sirve para borradores de trabajo. Emitir congela una revisión identificable. Cambios posteriores al proyecto no modifican la emisión ya registrada; deben originar una nueva revisión/emisión.
