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

export type BudgetItemPriceSource =
  | "apu"
  | "manual";

export type BudgetCurrency =
  | "DOP"
  | "USD";

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

export type ResourcePriceStatus =
  | "confirmed"
  | "referential"
  | "manual"
  | "missing";

export interface CostResource {
  id: string;
  itemId: string;
  libraryResourceId?: string;
  type: ResourceType;
  code?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  priceStatus?: ResourcePriceStatus;
  priceSource?: string;
  priceSourceDate?: string;
  priceConfidence?: string;
  wastePercentage: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface ApuAdjustments {
  indirectCostsPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  taxPercentage: number;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  chapterId: string;
  code?: string;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  /** Volumen base sobre el que se construye el APU. */
  analysisVolume: number;
  /** Desperdicio/holgura de cantidad definido durante la revisión del plano. */
  planWastePercentage?: number;
  /** Incremento manual sobre el precio unitario técnico del APU. */
  manualPriceAdjustmentPercentage?: number;
  status: BudgetItemStatus;
  adjustments: ApuAdjustments;
  unitPrice: number;
  priceSource: BudgetItemPriceSource;
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

export interface BudgetAdjustments {
  generalExpensesPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  itbisPercentage: number;
}

export interface Budget {
  id: string;
  projectId: string;
  name: string;
  version: number;
  status: BudgetStatus;
  currency: BudgetCurrency;
  exchangeRate: number;
  adjustments: BudgetAdjustments;
  createdAt: string;
  updatedAt: string;
}