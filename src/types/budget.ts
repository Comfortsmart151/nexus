export type BudgetStatus =
  | "draft"
  | "in-progress"
  | "ready"
  | "approved"
  | "archived";

export type ResourceType =
  | "material"
  | "labor"
  | "equipment"
  | "subcontract";

export type BudgetItemStatus =
  | "unpriced"
  | "in-progress"
  | "priced";

/**
 * Recurso perteneciente a la biblioteca general.
 *
 * Ejemplos:
 * - Cemento gris
 * - Maestro constructor
 * - Hormigonera
 * - Subcontrato de impermeabilización
 */
export interface LibraryResource {
  id: string;
  code: string;
  type: ResourceType;
  name: string;
  description?: string;
  unit: string;
  defaultUnitPrice: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recurso utilizado dentro del análisis de precio unitario
 * de una partida.
 */
export interface CostResource {
  id: string;
  itemId: string;

  /**
   * Referencia opcional al recurso original de la biblioteca.
   *
   * Se mantiene opcional para permitir agregar recursos
   * personalizados directamente dentro del APU.
   */
  libraryResourceId?: string;

  type: ResourceType;
  code?: string;
  name: string;
  unit: string;

  /**
   * Cantidad del recurso necesaria para producir
   * una unidad de la partida.
   *
   * Ejemplo:
   * 7.5 fundas de cemento por cada m³ de hormigón.
   */
  quantity: number;

  /**
   * Precio del recurso en el momento en que fue agregado al APU.
   *
   * El precio se guarda dentro del APU para evitar que un cambio
   * posterior en la biblioteca modifique presupuestos históricos.
   */
  unitPrice: number;

  /**
   * Porcentaje de desperdicio aplicado únicamente a este recurso.
   *
   * Ejemplo:
   * 5 representa un desperdicio de 5 %.
   */
  wastePercentage: number;

  /**
   * Orden visual del recurso dentro de su categoría.
   */
  order: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Resumen calculado del APU.
 *
 * Estos valores normalmente no necesitan guardarse en base de datos,
 * porque pueden calcularse a partir de los recursos y ajustes.
 */
export interface ApuSummary {
  materialsSubtotal: number;
  laborSubtotal: number;
  equipmentSubtotal: number;
  subcontractSubtotal: number;

  directCost: number;

  indirectCostsAmount: number;
  contingencyAmount: number;
  profitAmount: number;
  taxAmount: number;

  unitPriceBeforeTax: number;
  finalUnitPrice: number;
}

/**
 * Ajustes particulares de una partida o APU.
 */
export interface ApuAdjustments {
  indirectCostsPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  taxPercentage: number;
}

/**
 * Partida del presupuesto.
 *
 * Cada partida representa también su propio APU.
 */
export interface BudgetItem {
  id: string;
  projectId: string;
  chapterId: string;

  code?: string;
  name: string;
  description?: string;
  unit: string;

  /**
   * Cantidad total de la partida dentro del presupuesto.
   */
  quantity: number;

  status: BudgetItemStatus;

  /**
   * Ajustes específicos del APU.
   */
  adjustments: ApuAdjustments;

  /**
   * Precio unitario calculado del APU.
   *
   * Puede actualizarse cada vez que cambien los recursos.
   */
  unitPrice: number;

  createdAt: string;
  updatedAt: string;
}

export interface BudgetChapter {
  id: string;
  budgetId: string;
  code?: string;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ajustes generales del presupuesto.
 *
 * Estos valores pueden usarse como configuración predeterminada
 * para las nuevas partidas.
 */
export interface BudgetAdjustments {
  indirectCostsPercentage: number;
  profitPercentage: number;
  contingencyPercentage: number;
  taxPercentage: number;
}

export interface Budget {
  id: string;
  projectId: string;
  name: string;
  version: number;
  status: BudgetStatus;
  currency: "DOP" | "USD";
  adjustments: BudgetAdjustments;
  createdAt: string;
  updatedAt: string;
}