# NEXUS V5.2 — QA y pulido integral

Base: V5.1.4.

## Alcance ejecutado
- Navegación móvil real para todas las rutas de trabajo: barra superior, drawer, cierre por fondo, botón X y tecla Escape.
- Sidebar único conserva navegación contextual del proyecto también en móvil.
- Accesibilidad: enlace “Saltar al contenido”, `aria-current`, `aria-expanded`, foco visible y respeto a `prefers-reduced-motion`.
- Modo oscuro corregido transversalmente para superficies, texto, bordes, inputs, selects y textareas que antes mantenían colores claros fijos.
- Los temas corporativos continúan controlando el color primario sin alterar rojo/ámbar/verde semánticos.
- Ajustes responsive globales para evitar pérdida de navegación en pantallas pequeñas.
- Se mantiene intacto el motor de presupuestos, APU, Construcosto, planos, revisiones, emisiones y exportaciones.

## QA de regresión recomendado
1. Desktop: proyecto → planos → capítulos → APU → revisión → presupuesto → revisiones → contratos.
2. Móvil (<1024 px): abrir menú, navegar a todas las rutas, cerrar con X/fondo/Escape.
3. Configuración: alternar Claro/Oscuro y los temas preestablecidos; confirmar contraste en formularios y modales.
4. Documento: cambiar plantilla/branding y exportar PDF Cliente/Técnico.
5. Revisiones: comparar dos revisiones y verificar contraste en ambos modos.

## Nota de compilación
Esta entrega no declara `npm build` validado si las dependencias no están disponibles en el entorno de empaquetado. La validación final debe ejecutarse en la instalación local del proyecto.
