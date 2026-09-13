# NEXUS V5.1.1 — Fix PDF Cliente + Historial de emisiones

- Corrige `ReferenceError: company is not defined` en `BudgetExportService.exportClientPdf`.
- `exportClientPdf` ahora recibe explícitamente `company` desde `pdfBase`.
- El Centro de Emisión Comercial ahora muestra un historial persistente de todos los presupuestos emitidos del proyecto, no solo la última emisión.
- El historial muestra código documental, revisión, fecha/hora, total y estado.
- Las emisiones existentes en `nexus-budget-documents` se conservan; no es necesario reemitir documentos previos para que aparezcan.
