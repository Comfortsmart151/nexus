# NEXUS — Motor dimensional + compatibilidad de hormigón
Fecha: 2026-09-09

## Correcciones integradas

- Conversión dimensional centralizada para recursos APU: día/jornal ↔ hora, funda ↔ kg mediante peso comercial detectado en el nombre, kg ↔ lb, kg ↔ ton y gal ↔ litro.
- La cantidad se convierte a la unidad real del recurso antes de multiplicar por su precio. Esto evita errores como interpretar 10 fundas de cemento como 10 kg.
- Equipos con precio por hora pueden recibir coeficientes definidos en día; jornada técnica base = 8 h.
- Filtros semánticos duros impiden sustituciones incompatibles: agua de mezcla → pintura/esmalte, mezcladora de hormigón → grifería mezcladora y hormigonero/operador de mezcladora → operador de bomba cuando no hay bombeo.
- Plantilla de hormigón estructural 210 actualizada con la dosificación de referencia del Manual de Costos: 10 fundas de cemento, 0.45 m³ de arena, 0.88 m³ de grava y 60 gal de agua por m³, antes de desperdicios seleccionados por el usuario.
- Recursos canónicos fijados para hormigón 210: cemento MAT-03-000026, arena MAT-03-000029, grava MAT-03-000033, hormigonero MO-03-000015, ayudante MO-04-000020, mezcladora EQ-03-000012 y vibrador EQ-03-000014.
- Nuevo recurso maestro: MAT-03-003488 Agua para construcción.
- Precio referencial del agua: RD$0.11/gal, derivado de la tarifa industrial adicional CAASD de RD$28.00/m³ y marcado POR CONFIRMAR. La localidad/modalidad de suministro debe validarse por proyecto.
- Versión de Biblioteca y versión del conocimiento IA incrementadas para que el navegador reciba la actualización sin borrar proyectos/APU.

## Resultado esperado en la prueba

Para `Hormigón estructural f'c=210 kg/cm² en columna`, volumen APU = 1 m³:

- No debe aparecer Esmalte base agua.
- Cemento debe expresarse en kg cuando se vincula con el recurso canónico de 42.5 kg; 10 fundas equivalen a 425 kg antes de desperdicio.
- Agua debe aparecer como `Agua para construcción`, no como pintura.
- La mano de obra de preparación debe usar `Hormigonero`, no operador de bomba.
- Mezcladora y vibrador deben resolverse contra equipos canónicos y convertir día → hora si corresponde.
- Los precios referenciales continúan marcados para revisión; el APU puede calcularse sin confundir referencia con precio validado.
