import { INITIAL_LIBRARY_RESOURCES } from "@/data/librarySeed";
import { LocalStorageRepository } from "@/repositories/localStorage.repository";

import type { ResourceType } from "@/types/budget";
import type {
  CreateLibraryResourceInput,
  LibraryPriceHistoryEntry,
  LibraryResource,
  UpdateLibraryResourceInput,
} from "@/types/library";

const LIBRARY_KEY = "nexus-library-resources";
const LIBRARY_COUNTER_KEY = "nexus-library-counter";
const LIBRARY_SEEDED_KEY = "nexus-library-seeded";

export class LibraryService {
  static findAll(): LibraryResource[] {
    const storedResources =
      LocalStorageRepository.get<Partial<LibraryResource>[]>(
        LIBRARY_KEY,
      ) ?? [];

    const normalizedResources = storedResources.map(
      (resource, index): LibraryResource =>
        LibraryService.normalizeResource(resource, index),
    );

    if (storedResources.length > 0) {
      LocalStorageRepository.save(
        LIBRARY_KEY,
        normalizedResources,
      );
    }

    return normalizedResources;
  }

  static findActive(): LibraryResource[] {
    return LibraryService.findAll().filter(
      (resource) => resource.isActive !== false,
    );
  }

  static findFavorites(): LibraryResource[] {
    return LibraryService.findActive()
      .filter((resource) => resource.isFavorite)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  static findById(resourceId: string): LibraryResource | null {
    return (
      LibraryService.findAll().find(
        (resource) => resource.id === resourceId,
      ) ?? null
    );
  }

  static findByType(type: ResourceType): LibraryResource[] {
    return LibraryService.findActive()
      .filter((resource) => resource.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  static findByCategory(category: string): LibraryResource[] {
    const normalizedCategory = category.trim().toLowerCase();

    return LibraryService.findActive()
      .filter(
        (resource) =>
          resource.category?.trim().toLowerCase() ===
          normalizedCategory,
      )
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  static getCategories(type?: ResourceType): string[] {
    const resources = type
      ? LibraryService.findByType(type)
      : LibraryService.findActive();

    return Array.from(
      new Set(
        resources
          .map((resource) => resource.category?.trim() ?? "")
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }

  static getSubcategories(
    category?: string,
    type?: ResourceType,
  ): string[] {
    let resources = type
      ? LibraryService.findByType(type)
      : LibraryService.findActive();

    if (category?.trim()) {
      const normalizedCategory = category.trim().toLowerCase();

      resources = resources.filter(
        (resource) =>
          resource.category?.trim().toLowerCase() ===
          normalizedCategory,
      );
    }

    return Array.from(
      new Set(
        resources
          .map((resource) => resource.subcategory?.trim() ?? "")
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }

  static search(
    query: string,
    type?: ResourceType,
  ): LibraryResource[] {
    const normalizedQuery = query.trim().toLowerCase();

    const resources = type
      ? LibraryService.findByType(type)
      : LibraryService.findActive();

    if (!normalizedQuery) {
      return resources;
    }

    return resources.filter((resource) => {
      const searchableText = [
        resource.code,
        resource.name,
        resource.description ?? "",
        resource.supplier ?? "",
        resource.unit,
        resource.category ?? "",
        resource.subcategory ?? "",
        resource.brand ?? "",
        resource.observations ?? "",
        ...resource.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }

  static create(
    input: CreateLibraryResourceInput,
  ): LibraryResource {
    const resources = LibraryService.findAll();

    const storedCounter =
      LocalStorageRepository.get<number>(
        LIBRARY_COUNTER_KEY,
      ) ?? 0;

    const inferredCounter =
      LibraryService.getHighestResourceNumber(resources);

    const nextCounter =
      Math.max(storedCounter, inferredCounter) + 1;

    const now = new Date().toISOString();
    const price = LibraryService.sanitizeNumber(
      input.defaultUnitPrice,
    );

    const resourceId = `LIB-${String(nextCounter).padStart(
      6,
      "0",
    )}`;

    const resource: LibraryResource = {
      id: resourceId,
      code:
        input.code?.trim() ||
        LibraryService.generateCode(input.type, nextCounter),
      type: input.type,
      name: input.name.trim(),
      unit: input.unit.trim(),
      defaultUnitPrice: price,

      description: input.description?.trim() || "",
      supplier: input.supplier?.trim() || "",

      category: input.category?.trim() || "",
      subcategory: input.subcategory?.trim() || "",
      brand: input.brand?.trim() || "",
      tags: LibraryService.normalizeTags(input.tags ?? []),
      observations: input.observations?.trim() || "",

      isFavorite: input.isFavorite ?? false,
      isActive: true,

      priceUpdatedAt: input.priceUpdatedAt ?? now,
      priceHistory: [
        LibraryService.createPriceHistoryEntry(
          resourceId,
          price,
          input.supplier,
          now,
        ),
      ],

      createdAt: now,
      updatedAt: now,
    };

    LocalStorageRepository.save(LIBRARY_KEY, [
      ...resources,
      resource,
    ]);

    LocalStorageRepository.save(
      LIBRARY_COUNTER_KEY,
      nextCounter,
    );

    return resource;
  }

  static seedInitialLibrary(): number {
    const currentResources = LibraryService.findAll();
    let createdCount = 0;

    INITIAL_LIBRARY_RESOURCES.forEach((input) => {
      const alreadyExists = currentResources.some(
        (resource) =>
          resource.type === input.type &&
          resource.name.trim().toLowerCase() ===
            input.name.trim().toLowerCase(),
      );

      if (!alreadyExists) {
        LibraryService.create(input);
        createdCount += 1;
      }
    });

    LocalStorageRepository.save(LIBRARY_SEEDED_KEY, true);

    return createdCount;
  }

  static update(
    resourceId: string,
    input: UpdateLibraryResourceInput,
  ): LibraryResource | null {
    const resources = LibraryService.findAll();

    const resourceIndex = resources.findIndex(
      (resource) => resource.id === resourceId,
    );

    if (resourceIndex === -1) {
      return null;
    }

    const currentResource = resources[resourceIndex];
    const now = new Date().toISOString();

    const nextPrice =
      input.defaultUnitPrice !== undefined
        ? LibraryService.sanitizeNumber(
            input.defaultUnitPrice,
          )
        : currentResource.defaultUnitPrice;

    const priceChanged =
      input.defaultUnitPrice !== undefined &&
      nextPrice !== currentResource.defaultUnitPrice;

    const nextSupplier =
      input.supplier !== undefined
        ? input.supplier.trim()
        : currentResource.supplier;

    const nextPriceHistory = priceChanged
      ? [
          ...currentResource.priceHistory,
          LibraryService.createPriceHistoryEntry(
            currentResource.id,
            nextPrice,
            nextSupplier,
            now,
          ),
        ]
      : currentResource.priceHistory;

    const updatedResource: LibraryResource = {
      ...currentResource,

      code:
        input.code !== undefined
          ? input.code.trim() || currentResource.code
          : currentResource.code,

      name:
        input.name !== undefined
          ? input.name.trim() || currentResource.name
          : currentResource.name,

      unit:
        input.unit !== undefined
          ? input.unit.trim() || currentResource.unit
          : currentResource.unit,

      defaultUnitPrice: nextPrice,

      description:
        input.description !== undefined
          ? input.description.trim()
          : currentResource.description,

      supplier: nextSupplier,

      category:
        input.category !== undefined
          ? input.category.trim()
          : currentResource.category,

      subcategory:
        input.subcategory !== undefined
          ? input.subcategory.trim()
          : currentResource.subcategory,

      brand:
        input.brand !== undefined
          ? input.brand.trim()
          : currentResource.brand,

      tags:
        input.tags !== undefined
          ? LibraryService.normalizeTags(input.tags)
          : currentResource.tags,

      observations:
        input.observations !== undefined
          ? input.observations.trim()
          : currentResource.observations,

      isFavorite:
        input.isFavorite ?? currentResource.isFavorite,

      isActive: input.isActive ?? currentResource.isActive,

      priceUpdatedAt:
        input.priceUpdatedAt ??
        (priceChanged
          ? now
          : currentResource.priceUpdatedAt),

      priceHistory: nextPriceHistory,
      updatedAt: now,
    };

    resources[resourceIndex] = updatedResource;

    LocalStorageRepository.save(LIBRARY_KEY, resources);

    return updatedResource;
  }

  static toggleFavorite(
    resourceId: string,
  ): LibraryResource | null {
    const resource = LibraryService.findById(resourceId);

    if (!resource) {
      return null;
    }

    return LibraryService.update(resourceId, {
      isFavorite: !resource.isFavorite,
    });
  }

  static activate(resourceId: string): boolean {
    return Boolean(
      LibraryService.update(resourceId, {
        isActive: true,
      }),
    );
  }

  static deactivate(resourceId: string): boolean {
    return Boolean(
      LibraryService.update(resourceId, {
        isActive: false,
      }),
    );
  }

  static delete(resourceId: string): boolean {
    const resources = LibraryService.findAll();

    const filteredResources = resources.filter(
      (resource) => resource.id !== resourceId,
    );

    if (filteredResources.length === resources.length) {
      return false;
    }

    LocalStorageRepository.save(
      LIBRARY_KEY,
      filteredResources,
    );

    return true;
  }

  static existsByName(
    name: string,
    type: ResourceType,
  ): boolean {
    const normalizedName = name.trim().toLowerCase();

    return LibraryService.findAll().some(
      (resource) =>
        resource.type === type &&
        resource.name.trim().toLowerCase() === normalizedName,
    );
  }

  static resetInitialLibrary(): void {
    LocalStorageRepository.remove(LIBRARY_KEY);
    LocalStorageRepository.remove(LIBRARY_COUNTER_KEY);
    LocalStorageRepository.remove(LIBRARY_SEEDED_KEY);
  }

  private static normalizeResource(
    resource: Partial<LibraryResource>,
    index: number,
  ): LibraryResource {
    const now = new Date().toISOString();

    const fallbackId = `LIB-${String(index + 1).padStart(
      6,
      "0",
    )}`;

    const id = resource.id ?? fallbackId;
    const price = LibraryService.sanitizeNumber(
      resource.defaultUnitPrice ?? 0,
    );

    const createdAt = resource.createdAt ?? now;
    const updatedAt = resource.updatedAt ?? createdAt;
    const priceUpdatedAt =
      resource.priceUpdatedAt ?? updatedAt;

    const priceHistory =
      resource.priceHistory &&
      resource.priceHistory.length > 0
        ? resource.priceHistory.map((entry, historyIndex) => ({
            id:
              entry.id ??
              `${id}-PRICE-${String(historyIndex + 1).padStart(
                4,
                "0",
              )}`,
            price: LibraryService.sanitizeNumber(entry.price),
            supplier: entry.supplier?.trim() || "",
            registeredAt:
              entry.registeredAt ?? priceUpdatedAt,
          }))
        : [
            LibraryService.createPriceHistoryEntry(
              id,
              price,
              resource.supplier,
              priceUpdatedAt,
            ),
          ];

    return {
      id,

      code:
        resource.code ??
        LibraryService.generateCode(
          resource.type ?? "material",
          index + 1,
        ),

      type: resource.type ?? "material",
      name: resource.name?.trim() || "Recurso sin nombre",
      unit: resource.unit?.trim() || "ud",
      defaultUnitPrice: price,

      description: resource.description?.trim() || "",
      supplier: resource.supplier?.trim() || "",

      category: resource.category?.trim() || "",
      subcategory: resource.subcategory?.trim() || "",
      brand: resource.brand?.trim() || "",
      tags: LibraryService.normalizeTags(resource.tags ?? []),
      observations: resource.observations?.trim() || "",

      isFavorite: resource.isFavorite ?? false,
      isActive: resource.isActive ?? true,

      priceUpdatedAt,
      priceHistory,

      createdAt,
      updatedAt,
    };
  }

  private static createPriceHistoryEntry(
    resourceId: string,
    price: number,
    supplier?: string,
    registeredAt?: string,
  ): LibraryPriceHistoryEntry {
    return {
      id: `${resourceId}-PRICE-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      price: LibraryService.sanitizeNumber(price),
      supplier: supplier?.trim() || "",
      registeredAt:
        registeredAt ?? new Date().toISOString(),
    };
  }

  private static normalizeTags(tags: string[]): string[] {
    return Array.from(
      new Set(
        tags
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => tag.toLowerCase()),
      ),
    );
  }

  private static sanitizeNumber(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }

    return value;
  }

  private static generateCode(
    type: ResourceType,
    number: number,
  ): string {
    const prefixes: Record<ResourceType, string> = {
      material: "MAT",
      labor: "LAB",
      equipment: "EQU",
      subcontract: "SUB",
    };

    return `${prefixes[type]}-${String(number).padStart(
      5,
      "0",
    )}`;
  }

  private static getHighestResourceNumber(
    resources: LibraryResource[],
  ): number {
    return resources.reduce((highest, resource) => {
      const match = resource.id.match(/^LIB-(\d+)$/);

      if (!match) {
        return highest;
      }

      return Math.max(highest, Number(match[1]));
    }, 0);
  }
}