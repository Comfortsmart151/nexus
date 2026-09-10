# NEXUS — corrección de almacenamiento de Biblioteca

## Problema corregido
`QuotaExceededError` al intentar guardar la Biblioteca Maestra completa en `localStorage`.

## Nueva arquitectura local
- Los 4,665 recursos maestros permanecen en `src/data/nexusMasterLibrary.json`.
- `localStorage` guarda únicamente recursos creados por el usuario y overrides/cambios locales.
- La vista de Biblioteca combina en memoria: Maestro + overrides + recursos locales.
- La migración compacta automáticamente instalaciones anteriores sin tocar proyectos ni APU.
- Los precios del nuevo maestro prevalecen durante la migración; favoritos/estado local se conservan.
- Editar, desactivar, fusionar o crear recursos ya no obliga a reescribir los 4,665 registros.

## Validación esperada
Al abrir `/library`, no debe aparecer `QuotaExceededError` y la Biblioteca debe cargar los precios del dataset completo.
