# NEXUS V5.2.1 — Build fix

- Corrige el error TypeScript de Vercel en `BudgetService.normalize()`.
- `settings` ahora se obtiene mediante `SettingsService.get()` dentro del alcance del método antes de aplicar los valores por defecto del presupuesto.
- No modifica la lógica funcional de V5.2; es una corrección de compilación.
- La ejecución local de `npm ci && npm run build` no concluyó dentro del límite del entorno de empaquetado, por lo que Vercel sigue siendo la validación final del build completo.
