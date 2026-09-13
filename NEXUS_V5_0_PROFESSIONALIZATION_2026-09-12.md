# NEXUS V5.0 — Professionalization Core

Base: NEXUS V4.3.1.

## Implementado en este corte

### Project Hub profesional
- Métricas de capítulos, partidas y APU valorizados.
- Indicador de calidad del proyecto.
- Presupuesto actual estimado visible desde el resumen.
- Accesos directos a revisión, revisiones históricas, duplicado y presupuesto.
- El último paso del flujo conduce primero al control de calidad.

### Revisión automática del proyecto
Ruta: `/projects/[id]/review`
- Detecta proyecto sin capítulos o sin partidas.
- Partidas sin capítulo válido.
- Cantidades en cero.
- APU pendientes o sin precio.
- Recursos sin precio.
- Precios referenciales.
- Confianza baja de precios/mapeos.
- Ajustes manuales en partidas.
- Propuestas de planos sin decidir.
- Puertas/ventanas detectadas sin confirmar.
- Acciones "Corregir" llevan al punto correspondiente.
- Puntaje de preparación, críticos, advertencias y validaciones superadas.

### Configuración de empresa y documentos
Ruta: `/settings`
- Nombre comercial y razón social.
- RNC, teléfono, correo y dirección.
- Responsable y cargo.
- Porcentajes predeterminados de gastos generales, imprevistos, beneficio e ITBIS.
- Vigencia, moneda y notas predeterminadas.
- Nuevos presupuestos adoptan estos valores predeterminados.

### Presupuesto y exportación
- PDF/Excel usan la identidad configurada de la empresa.
- Encabezado comercial incluye RNC/teléfono/correo cuando existen.
- Acceso directo a revisión de calidad e historial desde Presupuesto.
- Se conserva exportación Cliente y Técnica.

### Revisiones del presupuesto
Ruta: `/projects/[id]/revisions`
- Crear Rev. 0, Rev. 1, etc.
- Captura costo directo, total y estado de APU en el momento de la revisión.
- Compara variación porcentual con la revisión anterior.

### Duplicar proyecto
- Duplica proyecto, capítulos, partidas y recursos/APU.
- Genera nuevos identificadores y conserva el proyecto original.

### Trazabilidad APU
- Cada recurso muestra estado de precio, fuente, fecha y confianza disponibles.

### Pulido técnico
- Metadata real de NEXUS.
- Idioma del documento HTML en español.
- `data-scroll-behavior="smooth"` para eliminar el warning de Next en navegación.
- `turbopack.root` configurado al directorio actual del proyecto para evitar que Next tome el `package-lock.json` del Escritorio como raíz.

## Pendiente para completar toda la visión V5
- Sistema global de toast/autoguardado en todos los módulos.
- Homologación final de estados vacíos/modales/tablas en todas las pantallas heredadas.
- Portada visual avanzada del PDF con logo cargable.
- Comparador de revisiones a nivel de partida/recurso, no sólo total económico.
- Auditoría histórica persistente de cada edición individual.

## Validación del entorno
No se marca `npm build` como validado: `npm ci` volvió a exceder el tiempo disponible en el entorno de generación. La estructura y rutas fueron verificadas en el paquete, pero la validación final debe hacerse localmente con las dependencias instaladas.
