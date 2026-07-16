import { INITIAL_LIBRARY_RESOURCES } from "@/data/librarySeed";
import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import type { ResourceType } from "@/types/budget";
import type {
  CreateLibraryResourceInput,
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
      (resource, index): LibraryResource => {
        const now = new Date().toISOString();
        const fallbackId = `LIB-${String(index + 1).padStart(
          6,
          "0",
        )}`;

        return {
          id: resource.id ?? fallbackId,
          code:
            resource.code ??
            LibraryService.generateCode(
              resource.type ?? "material",
              index + 1,
            ),
          type: resource.type ?? "material",
          name: resource.name?.trim() || "Recurso sin nombre",
          unit: resource.unit?.trim() || "ud",
          defaultUnitPrice: Math.max(
            0,
            resource.defaultUnitPrice ?? 0,
          ),
          description: resource.description?.trim() || "",
          supplier: resource.supplier?.trim() || "",
          isActive: resource.isActive ?? true,
          createdAt: resource.createdAt ?? now,
          updatedAt:
            resource.updatedAt ??
            resource.createdAt ??
            now,
        };
      },
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

    const resource: LibraryResource = {
      id: `LIB-${String(nextCounter).padStart(6, "0")}`,
      code:
        input.code?.trim() ||
        LibraryService.generateCode(
          input.type,
          nextCounter,
        ),
      type: input.type,
      name: input.name.trim(),
      unit: input.unit.trim(),
      defaultUnitPrice: Math.max(
        0,
        input.defaultUnitPrice,
      ),
      description: input.description?.trim() || "",
      supplier: input.supplier?.trim() || "",
      isActive: true,
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

    LocalStorageRepository.save(
      LIBRARY_SEEDED_KEY,
      true,
    );

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

    const updatedResource: LibraryResource = {
      ...currentResource,
      code:
        input.code?.trim() ??
        currentResource.code,
      name:
        input.name?.trim() ??
        currentResource.name,
      unit:
        input.unit?.trim() ??
        currentResource.unit,
      defaultUnitPrice:
        input.defaultUnitPrice !== undefined
          ? Math.max(0, input.defaultUnitPrice)
          : currentResource.defaultUnitPrice,
      description:
        input.description?.trim() ??
        currentResource.description,
      supplier:
        input.supplier?.trim() ??
        currentResource.supplier,
      isActive:
        input.isActive ??
        currentResource.isActive,
      updatedAt: new Date().toISOString(),
    };

    resources[resourceIndex] = updatedResource;

    LocalStorageRepository.save(
      LIBRARY_KEY,
      resources,
    );

    return updatedResource;
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
        resource.name.trim().toLowerCase() ===
          normalizedName,
    );
  }

  static resetInitialLibrary(): void {
    LocalStorageRepository.remove(LIBRARY_KEY);
    LocalStorageRepository.remove(
      LIBRARY_COUNTER_KEY,
    );
    LocalStorageRepository.remove(
      LIBRARY_SEEDED_KEY,
    );
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