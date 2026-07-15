import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import type { BudgetItem } from "@/types/budget";
import { generateItemId } from "@/utils/idGenerator";

const ITEMS_KEY = "nexus-items";
const ITEM_COUNTER_KEY = "nexus-item-counter";

export interface CreateItemInput {
  projectId: string;
  chapterId: string;
  name: string;
  description?: string;
  unit: string;
  quantity?: number;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  status?: BudgetItem["status"];
}

export class ItemService {
  static findAll(): BudgetItem[] {
    return LocalStorageRepository.get<BudgetItem[]>(ITEMS_KEY) ?? [];
  }

  static findByProject(projectId: string): BudgetItem[] {
    return ItemService.findAll().filter(
      (item) => item.projectId === projectId,
    );
  }

  static findByChapter(chapterId: string): BudgetItem[] {
    return ItemService.findAll().filter(
      (item) => item.chapterId === chapterId,
    );
  }

  static findById(itemId: string): BudgetItem | null {
    return (
      ItemService.findAll().find((item) => item.id === itemId) ?? null
    );
  }

  static create(input: CreateItemInput): BudgetItem {
    const items = ItemService.findAll();

    const currentCounter =
      LocalStorageRepository.get<number>(ITEM_COUNTER_KEY) ?? 0;

    const nextCounter = currentCounter + 1;
    const now = new Date().toISOString();

    const item: BudgetItem = {
      id: generateItemId(nextCounter),
      projectId: input.projectId,
      chapterId: input.chapterId,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      unit: input.unit.trim(),
      quantity: input.quantity ?? 0,
      status: "unpriced",
      createdAt: now,
      updatedAt: now,
    };

    LocalStorageRepository.save(ITEMS_KEY, [...items, item]);
    LocalStorageRepository.save(ITEM_COUNTER_KEY, nextCounter);

    return item;
  }

  static update(
    itemId: string,
    input: UpdateItemInput,
  ): BudgetItem | null {
    const items = ItemService.findAll();

    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) return null;

    const currentItem = items[itemIndex];

    const updatedItem: BudgetItem = {
      ...currentItem,
      name: input.name?.trim() ?? currentItem.name,
      description:
        input.description?.trim() ?? currentItem.description,
      unit: input.unit?.trim() ?? currentItem.unit,
      quantity: input.quantity ?? currentItem.quantity,
      status: input.status ?? currentItem.status,
      updatedAt: new Date().toISOString(),
    };

    items[itemIndex] = updatedItem;

    LocalStorageRepository.save(ITEMS_KEY, items);

    return updatedItem;
  }

  static moveToChapter(
    itemId: string,
    chapterId: string,
  ): BudgetItem | null {
    const item = ItemService.findById(itemId);

    if (!item) return null;

    return ItemService.update(itemId, {
      ...item,
      status: item.status,
    });
  }

  static delete(itemId: string): boolean {
    const items = ItemService.findAll();

    const filteredItems = items.filter((item) => item.id !== itemId);

    if (filteredItems.length === items.length) return false;

    LocalStorageRepository.save(ITEMS_KEY, filteredItems);

    return true;
  }

  static countByChapter(chapterId: string): number {
    return ItemService.findByChapter(chapterId).length;
  }
}