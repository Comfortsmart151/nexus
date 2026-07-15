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

export interface CostResource {
  id: string;
  itemId: string;
  type: ResourceType;
  code?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  wastePercentage?: number;
  createdAt: string;
  updatedAt: string;
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
  status: "unpriced" | "in-progress" | "priced";
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