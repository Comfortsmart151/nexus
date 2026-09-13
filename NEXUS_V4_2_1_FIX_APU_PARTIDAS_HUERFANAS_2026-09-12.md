# NEXUS V4.2.1 — Fix APU y partidas huérfanas

- Corrige el caso en que el Centro de APU intentaba abrir una partida cuyo `chapterId` apuntaba a un capítulo eliminado/inexistente.
- El Centro de APU ahora detecta y cuenta partidas sin capítulo.
- Una partida huérfana ya no genera un enlace roto: permite reasignarla explícitamente a uno de los capítulos existentes.
- Tras reasignar, el APU se abre por la ruta válida normal.
- La pantalla de error del APU ya no devuelve al Dashboard: regresa al Centro de análisis del proyecto.
- No se reasignan partidas automáticamente para evitar mover datos a un capítulo incorrecto.
