import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import { ResourceService } from "@/services/resource.service";
import type {
  ApuAdjustments,
  ApuSummary,
  BudgetItem,
  BudgetItemPriceSource,
} from "@/types/budget";
import { generateItemId } from "@/utils/idGenerator";

const ITEMS_KEY = "nexus-items";
const ITEM_COUNTER_KEY = "nexus-item-counter";

const DEFAULT_APU_ADJUSTMENTS: ApuAdjustments = {
  indirectCostsPercentage: 0,
  contingencyPercentage: 0,
  profitPercentage: 0,
  taxPercentage: 0,
};

export interface CreateItemInput {
  projectId: string;
  chapterId: string;
  code?: string;
  name: string;
  description?: string;
  unit: string;
  quantity?: number;
  adjustments?: Partial<ApuAdjustments>;
}

export interface UpdateItemInput {
  chapterId?: string;
  code?: string;
  name?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  status?: BudgetItem["status"];
  adjustments?: Partial<ApuAdjustments>;
  unitPrice?: number;
  priceSource?: BudgetItemPriceSource;
}

export class ItemService {
  static findAll(): BudgetItem[] {
    const items =
      LocalStorageRepository.get<BudgetItem[]>(ITEMS_KEY) ?? [];

    return items.map((item) => ({
      ...item,
      quantity: ItemService.sanitizeNumber(item.quantity),
      unitPrice: ItemService.sanitizeNumber(item.unitPrice),
      priceSource: item.priceSource ?? "apu",
      adjustments: {
        indirectCostsPercentage: ItemService.sanitizeNumber(
          item.adjustments?.indirectCostsPercentage,
        ),
        contingencyPercentage: ItemService.sanitizeNumber(
          item.adjustments?.contingencyPercentage,
        ),
        profitPercentage: ItemService.sanitizeNumber(
          item.adjustments?.profitPercentage,
        ),
        taxPercentage: ItemService.sanitizeNumber(
          item.adjustments?.taxPercentage,
        ),
      },
    }));
  }

  static findByProject(projectId: string): BudgetItem[] {
    return ItemService.findAll().filter(
      (item) => item.projectId === projectId,
    );
  }

  static findByChapter(chapterId: string): BudgetItem[] {
    return ItemService.findAll()
      .filter((item) => item.chapterId === chapterId)
      .sort((a, b) =>
        (a.code ?? a.id).localeCompare(
          b.code ?? b.id,
          undefined,
          {
            numeric: true,
          },
        ),
      );
  }

  static findById(itemId: string): BudgetItem | null {
    return (
      ItemService.findAll().find(
        (item) => item.id === itemId,
      ) ?? null
    );
  }

  static create(input: CreateItemInput): BudgetItem {
    const items = ItemService.findAll();

    const currentCounter =
      LocalStorageRepository.get<number>(
        ITEM_COUNTER_KEY,
      ) ?? 0;

    const nextCounter = currentCounter + 1;
    const now = new Date().toISOString();

    const item: BudgetItem = {
      id: generateItemId(nextCounter),
      projectId: input.projectId,
      chapterId: input.chapterId,
      code: input.code?.trim() || undefined,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      unit: input.unit.trim(),
      quantity: ItemService.sanitizeNumber(
        input.quantity,
      ),
      status: "unpriced",
      adjustments: {
        indirectCostsPercentage:
          ItemService.sanitizeNumber(
            input.adjustments?.indirectCostsPercentage ??
              DEFAULT_APU_ADJUSTMENTS.indirectCostsPercentage,
          ),
        contingencyPercentage:
          ItemService.sanitizeNumber(
            input.adjustments?.contingencyPercentage ??
              DEFAULT_APU_ADJUSTMENTS.contingencyPercentage,
          ),
        profitPercentage:
          ItemService.sanitizeNumber(
            input.adjustments?.profitPercentage ??
              DEFAULT_APU_ADJUSTMENTS.profitPercentage,
          ),
        taxPercentage:
          ItemService.sanitizeNumber(
            input.adjustments?.taxPercentage ??
              DEFAULT_APU_ADJUSTMENTS.taxPercentage,
          ),
      },
      unitPrice: 0,
      priceSource: "apu",
      createdAt: now,
      updatedAt: now,
    };

    LocalStorageRepository.save(ITEMS_KEY, [
      ...items,
      item,
    ]);

    LocalStorageRepository.save(
      ITEM_COUNTER_KEY,
      nextCounter,
    );

    return item;
  }

  static update(
    itemId: string,
    input: UpdateItemInput,
  ): BudgetItem | null {
    const items = ItemService.findAll();

    const itemIndex = items.findIndex(
      (item) => item.id === itemId,
    );

    if (itemIndex === -1) {
      return null;
    }

    const currentItem = items[itemIndex];

    const updatedUnitPrice =
      input.unitPrice !== undefined
        ? ItemService.sanitizeNumber(input.unitPrice)
        : currentItem.unitPrice;

    const updatedPriceSource =
      input.priceSource ?? currentItem.priceSource;

    const updatedItem: BudgetItem = {
      ...currentItem,
      chapterId:
        input.chapterId ?? currentItem.chapterId,
      code:
        input.code !== undefined
          ? input.code.trim() || undefined
          : currentItem.code,
      name:
        input.name !== undefined
          ? input.name.trim()
          : currentItem.name,
      description:
        input.description !== undefined
          ? input.description.trim()
          : currentItem.description,
      unit:
        input.unit !== undefined
          ? input.unit.trim()
          : currentItem.unit,
      quantity:
        input.quantity !== undefined
          ? ItemService.sanitizeNumber(input.quantity)
          : currentItem.quantity,
      adjustments: {
        indirectCostsPercentage:
          ItemService.sanitizeNumber(
            input.adjustments
              ?.indirectCostsPercentage ??
              currentItem.adjustments
                .indirectCostsPercentage,
          ),
        contingencyPercentage:
          ItemService.sanitizeNumber(
            input.adjustments?.contingencyPercentage ??
              currentItem.adjustments
                .contingencyPercentage,
          ),
        profitPercentage:
          ItemService.sanitizeNumber(
            input.adjustments?.profitPercentage ??
              currentItem.adjustments.profitPercentage,
          ),
        taxPercentage:
          ItemService.sanitizeNumber(
            input.adjustments?.taxPercentage ??
              currentItem.adjustments.taxPercentage,
          ),
      },
      unitPrice: updatedUnitPrice,
      priceSource: updatedPriceSource,
      status:
        input.status ??
        ItemService.resolveStatus(updatedUnitPrice),
      updatedAt: new Date().toISOString(),
    };

    items[itemIndex] = updatedItem;

    LocalStorageRepository.save(ITEMS_KEY, items);

    return updatedItem;
  }

  static setManualPrice(
    itemId: string,
    unitPrice: number,
  ): BudgetItem | null {
    const safeUnitPrice =
      ItemService.sanitizeNumber(unitPrice);

    return ItemService.update(itemId, {
      unitPrice: safeUnitPrice,
      priceSource: "manual",
      status: ItemService.resolveStatus(safeUnitPrice),
    });
  }

  static useApuPrice(
    itemId: string,
  ): BudgetItem | null {
    const summary =
      ItemService.calculateApuSummary(itemId);

    if (!summary) {
      return null;
    }

    return ItemService.update(itemId, {
      unitPrice: summary.finalUnitPrice,
      priceSource: "apu",
      status: ItemService.resolveStatus(
        summary.finalUnitPrice,
      ),
    });
  }

  static moveToChapter(
    itemId: string,
    chapterId: string,
  ): BudgetItem | null {
    return ItemService.update(itemId, {
      chapterId,
    });
  }

  static delete(itemId: string): boolean {
    const items = ItemService.findAll();

    const filteredItems = items.filter(
      (item) => item.id !== itemId,
    );

    if (filteredItems.length === items.length) {
      return false;
    }

    LocalStorageRepository.save(
      ITEMS_KEY,
      filteredItems,
    );

    ResourceService.deleteByItem(itemId);

    return true;
  }

  static countByChapter(chapterId: string): number {
    return ItemService.findByChapter(chapterId).length;
  }

  static calculateApuSummary(
    itemId: string,
  ): ApuSummary | null {
    const item = ItemService.findById(itemId);

    if (!item) {
      return null;
    }

    const materialsSubtotal =
      ResourceService.calculateTypeTotal(
        itemId,
        "material",
      );

    const laborSubtotal =
      ResourceService.calculateTypeTotal(
        itemId,
        "labor",
      );

    const equipmentSubtotal =
      ResourceService.calculateTypeTotal(
        itemId,
        "equipment",
      );

    const subcontractSubtotal =
      ResourceService.calculateTypeTotal(
        itemId,
        "subcontract",
      );

    const directCost =
      materialsSubtotal +
      laborSubtotal +
      equipmentSubtotal +
      subcontractSubtotal;

    const indirectCostsAmount =
      directCost *
      (item.adjustments.indirectCostsPercentage /
        100);

    const contingencyAmount =
      directCost *
      (item.adjustments.contingencyPercentage /
        100);

    const costBeforeProfit =
      directCost +
      indirectCostsAmount +
      contingencyAmount;

    const profitAmount =
      costBeforeProfit *
      (item.adjustments.profitPercentage / 100);

    const unitPriceBeforeTax =
      costBeforeProfit + profitAmount;

    const taxAmount =
      unitPriceBeforeTax *
      (item.adjustments.taxPercentage / 100);

    const finalUnitPrice =
      unitPriceBeforeTax + taxAmount;

    return {
      materialsSubtotal,
      laborSubtotal,
      equipmentSubtotal,
      subcontractSubtotal,
      directCost,
      indirectCostsAmount,
      contingencyAmount,
      profitAmount,
      taxAmount,
      unitPriceBeforeTax,
      finalUnitPrice,
    };
  }

  static recalculateUnitPrice(
    itemId: string,
  ): BudgetItem | null {
    return ItemService.useApuPrice(itemId);
  }

  static calculateItemAmount(
    itemId: string,
  ): number {
    const item = ItemService.findById(itemId);

    if (!item) {
      return 0;
    }

    return item.quantity * item.unitPrice;
  }

  private static resolveStatus(
    unitPrice: number,
  ): BudgetItem["status"] {
    return unitPrice > 0
      ? "priced"
      : "unpriced";
  }

  private static sanitizeNumber(
    value: number | undefined,
  ): number {
    if (
      value === undefined ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return 0;
    }

    return value;
  }
}