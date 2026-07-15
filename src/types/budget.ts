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
  type: ResourceType;
  code?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  wastePercentage?: number;
}

export interface BudgetItem {
  id: string;
  chapterId: string;
  code?: string;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  resources: CostResource[];
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
  items: BudgetItem[];
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
  chapters: BudgetChapter[];
  adjustments: BudgetAdjustments;
  createdAt: string;
  updatedAt: string;
}