import { LocalStorageRepository } from "@/repositories/localStorage.repository";

import type {
  Budget,
  BudgetAdjustments,
  BudgetCurrency,
  BudgetStatus,
} from "@/types/budget";

const BUDGETS_KEY = "nexus-budgets";
const BUDGET_COUNTER_KEY = "nexus-budget-counter";

const DEFAULT_ADJUSTMENTS: BudgetAdjustments = {
  generalExpensesPercentage: 10,
  contingencyPercentage: 5,
  profitPercentage: 10,
  itbisPercentage: 18,
};

export interface CreateBudgetInput {
  projectId: string;
  name?: string;
  version?: number;
  status?: BudgetStatus;
  currency?: BudgetCurrency;
  exchangeRate?: number;
  adjustments?: Partial<BudgetAdjustments>;
}

export interface UpdateBudgetInput {
  name?: string;
  version?: number;
  status?: BudgetStatus;
  currency?: BudgetCurrency;
  exchangeRate?: number;
  adjustments?: Partial<BudgetAdjustments>;
}

export class BudgetService {
  static findAll(): Budget[] {
    const budgets =
      LocalStorageRepository.get<Budget[]>(
        BUDGETS_KEY,
      ) ?? [];

    return budgets.map((budget) =>
      BudgetService.normalize(budget),
    );
  }

  static findById(
    budgetId: string,
  ): Budget | null {
    return (
      BudgetService.findAll().find(
        (budget) => budget.id === budgetId,
      ) ?? null
    );
  }

  static findByProject(
    projectId: string,
  ): Budget | null {
    const projectBudgets =
      BudgetService.findAll()
        .filter(
          (budget) =>
            budget.projectId === projectId,
        )
        .sort(
          (a, b) =>
            b.version - a.version,
        );

    return projectBudgets[0] ?? null;
  }

  static findAllByProject(
    projectId: string,
  ): Budget[] {
    return BudgetService.findAll()
      .filter(
        (budget) =>
          budget.projectId === projectId,
      )
      .sort(
        (a, b) =>
          b.version - a.version,
      );
  }

  static findOrCreateByProject(
    projectId: string,
    projectName?: string,
  ): Budget {
    const existingBudget =
      BudgetService.findByProject(projectId);

    if (existingBudget) {
      return existingBudget;
    }

    return BudgetService.create({
      projectId,
      name: projectName
        ? `Presupuesto - ${projectName}`
        : "Presupuesto principal",
      version: 1,
      status: "in-progress",
      currency: "DOP",
      exchangeRate: 60,
    });
  }

  static create(
    input: CreateBudgetInput,
  ): Budget {
    const budgets =
      BudgetService.findAll();

    const currentCounter =
      LocalStorageRepository.get<number>(
        BUDGET_COUNTER_KEY,
      ) ?? 0;

    const nextCounter =
      currentCounter + 1;

    const now =
      new Date().toISOString();

    const budget: Budget = {
      id: `BUD-${String(
        nextCounter,
      ).padStart(5, "0")}`,
      projectId: input.projectId,
      name:
        input.name?.trim() ||
        "Presupuesto principal",
      version: Math.max(
        1,
        input.version ?? 1,
      ),
      status:
        input.status ??
        "in-progress",
      currency:
        input.currency ??
        "DOP",
      exchangeRate:
        BudgetService.sanitizeNumber(
          input.exchangeRate ?? 60,
        ),
      adjustments: {
        generalExpensesPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.generalExpensesPercentage ??
              DEFAULT_ADJUSTMENTS
                .generalExpensesPercentage,
          ),
        contingencyPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.contingencyPercentage ??
              DEFAULT_ADJUSTMENTS
                .contingencyPercentage,
          ),
        profitPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.profitPercentage ??
              DEFAULT_ADJUSTMENTS
                .profitPercentage,
          ),
        itbisPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.itbisPercentage ??
              DEFAULT_ADJUSTMENTS
                .itbisPercentage,
          ),
      },
      createdAt: now,
      updatedAt: now,
    };

    LocalStorageRepository.save(
      BUDGETS_KEY,
      [...budgets, budget],
    );

    LocalStorageRepository.save(
      BUDGET_COUNTER_KEY,
      nextCounter,
    );

    return budget;
  }

  static update(
    budgetId: string,
    input: UpdateBudgetInput,
  ): Budget | null {
    const budgets =
      BudgetService.findAll();

    const budgetIndex =
      budgets.findIndex(
        (budget) =>
          budget.id === budgetId,
      );

    if (budgetIndex === -1) {
      return null;
    }

    const currentBudget =
      budgets[budgetIndex];

    const updatedBudget: Budget = {
      ...currentBudget,
      name:
        input.name !== undefined
          ? input.name.trim() ||
            currentBudget.name
          : currentBudget.name,
      version:
        input.version !== undefined
          ? Math.max(
              1,
              input.version,
            )
          : currentBudget.version,
      status:
        input.status ??
        currentBudget.status,
      currency:
        input.currency ??
        currentBudget.currency,
      exchangeRate:
        input.exchangeRate !== undefined
          ? BudgetService.sanitizeNumber(
              input.exchangeRate,
            )
          : currentBudget.exchangeRate,
      adjustments: {
        generalExpensesPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.generalExpensesPercentage ??
              currentBudget.adjustments
                .generalExpensesPercentage,
          ),
        contingencyPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.contingencyPercentage ??
              currentBudget.adjustments
                .contingencyPercentage,
          ),
        profitPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.profitPercentage ??
              currentBudget.adjustments
                .profitPercentage,
          ),
        itbisPercentage:
          BudgetService.sanitizeNumber(
            input.adjustments
              ?.itbisPercentage ??
              currentBudget.adjustments
                .itbisPercentage,
          ),
      },
      updatedAt:
        new Date().toISOString(),
    };

    budgets[budgetIndex] =
      updatedBudget;

    LocalStorageRepository.save(
      BUDGETS_KEY,
      budgets,
    );

    return updatedBudget;
  }

  static updateAdjustments(
    budgetId: string,
    adjustments: Partial<BudgetAdjustments>,
  ): Budget | null {
    return BudgetService.update(
      budgetId,
      {
        adjustments,
      },
    );
  }

  static updateExchangeRate(
    budgetId: string,
    exchangeRate: number,
  ): Budget | null {
    return BudgetService.update(
      budgetId,
      {
        exchangeRate,
      },
    );
  }

  static delete(
    budgetId: string,
  ): boolean {
    const budgets =
      BudgetService.findAll();

    const filteredBudgets =
      budgets.filter(
        (budget) =>
          budget.id !== budgetId,
      );

    if (
      filteredBudgets.length ===
      budgets.length
    ) {
      return false;
    }

    LocalStorageRepository.save(
      BUDGETS_KEY,
      filteredBudgets,
    );

    return true;
  }

  private static normalize(
    budget: Budget,
  ): Budget {
    return {
      ...budget,
      version: Math.max(
        1,
        budget.version ?? 1,
      ),
      status:
        budget.status ??
        "in-progress",
      currency:
        budget.currency ??
        "DOP",
      exchangeRate:
        BudgetService.sanitizeNumber(
          budget.exchangeRate ?? 60,
        ),
      adjustments: {
        generalExpensesPercentage:
          BudgetService.sanitizeNumber(
            budget.adjustments
              ?.generalExpensesPercentage ??
              DEFAULT_ADJUSTMENTS
                .generalExpensesPercentage,
          ),
        contingencyPercentage:
          BudgetService.sanitizeNumber(
            budget.adjustments
              ?.contingencyPercentage ??
              DEFAULT_ADJUSTMENTS
                .contingencyPercentage,
          ),
        profitPercentage:
          BudgetService.sanitizeNumber(
            budget.adjustments
              ?.profitPercentage ??
              DEFAULT_ADJUSTMENTS
                .profitPercentage,
          ),
        itbisPercentage:
          BudgetService.sanitizeNumber(
            budget.adjustments
              ?.itbisPercentage ??
              DEFAULT_ADJUSTMENTS
                .itbisPercentage,
          ),
      },
    };
  }

  private static sanitizeNumber(
    value: number,
  ): number {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return 0;
    }

    return value;
  }
}