import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import type {
  CostResource,
  ResourceType,
} from "@/types/budget";
import { generateResourceId } from "@/utils/idGenerator";

const RESOURCES_KEY = "nexus-resources";
const RESOURCE_COUNTER_KEY = "nexus-resource-counter";

export interface CreateResourceInput {
  itemId: string;
  libraryResourceId?: string;
  type: ResourceType;
  code?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  wastePercentage?: number;
  order?: number;
}

export interface UpdateResourceInput {
  libraryResourceId?: string;
  code?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  wastePercentage?: number;
  order?: number;
}

export class ResourceService {
  static findAll(): CostResource[] {
    const resources =
      LocalStorageRepository.get<CostResource[]>(
        RESOURCES_KEY,
      ) ?? [];

    /*
     * Normaliza recursos creados con versiones anteriores
     * de NEXUS, cuando wastePercentage y order todavía
     * no eran obligatorios.
     */
    return resources.map((resource, index) => ({
      ...resource,
      wastePercentage: Math.max(
        0,
        resource.wastePercentage ?? 0,
      ),
      order: resource.order ?? index,
    }));
  }

  static findByItem(itemId: string): CostResource[] {
    return ResourceService.findAll()
      .filter((resource) => resource.itemId === itemId)
      .sort((a, b) => a.order - b.order);
  }

  static findByItemAndType(
    itemId: string,
    type: ResourceType,
  ): CostResource[] {
    return ResourceService.findByItem(itemId)
      .filter((resource) => resource.type === type)
      .sort((a, b) => a.order - b.order);
  }

  static findById(resourceId: string): CostResource | null {
    return (
      ResourceService.findAll().find(
        (resource) => resource.id === resourceId,
      ) ?? null
    );
  }

  static create(input: CreateResourceInput): CostResource {
    const resources = ResourceService.findAll();

    const currentCounter =
      LocalStorageRepository.get<number>(
        RESOURCE_COUNTER_KEY,
      ) ?? 0;

    const nextCounter = currentCounter + 1;
    const now = new Date().toISOString();

    const resourcesOfSameType =
      ResourceService.findByItemAndType(
        input.itemId,
        input.type,
      );

    const nextOrder =
      resourcesOfSameType.length > 0
        ? Math.max(
            ...resourcesOfSameType.map(
              (resource) => resource.order,
            ),
          ) + 1
        : 0;

    const resource: CostResource = {
      id: generateResourceId(nextCounter),
      itemId: input.itemId,
      libraryResourceId: input.libraryResourceId,
      type: input.type,
      code: input.code?.trim() || undefined,
      name: input.name.trim(),
      unit: input.unit.trim(),
      quantity: Math.max(0, input.quantity),
      unitPrice: Math.max(0, input.unitPrice),
      wastePercentage: Math.max(
        0,
        input.wastePercentage ?? 0,
      ),
      order: Math.max(0, input.order ?? nextOrder),
      createdAt: now,
      updatedAt: now,
    };

    LocalStorageRepository.save(RESOURCES_KEY, [
      ...resources,
      resource,
    ]);

    LocalStorageRepository.save(
      RESOURCE_COUNTER_KEY,
      nextCounter,
    );

    return resource;
  }

  static update(
    resourceId: string,
    input: UpdateResourceInput,
  ): CostResource | null {
    const resources = ResourceService.findAll();

    const resourceIndex = resources.findIndex(
      (resource) => resource.id === resourceId,
    );

    if (resourceIndex === -1) {
      return null;
    }

    const currentResource = resources[resourceIndex];

    const updatedResource: CostResource = {
      ...currentResource,
      libraryResourceId:
        input.libraryResourceId ??
        currentResource.libraryResourceId,
      code:
        input.code !== undefined
          ? input.code.trim() || undefined
          : currentResource.code,
      name:
        input.name !== undefined
          ? input.name.trim()
          : currentResource.name,
      unit:
        input.unit !== undefined
          ? input.unit.trim()
          : currentResource.unit,
      quantity:
        input.quantity !== undefined
          ? Math.max(0, input.quantity)
          : currentResource.quantity,
      unitPrice:
        input.unitPrice !== undefined
          ? Math.max(0, input.unitPrice)
          : currentResource.unitPrice,
      wastePercentage:
        input.wastePercentage !== undefined
          ? Math.max(0, input.wastePercentage)
          : currentResource.wastePercentage,
      order:
        input.order !== undefined
          ? Math.max(0, input.order)
          : currentResource.order,
      updatedAt: new Date().toISOString(),
    };

    resources[resourceIndex] = updatedResource;

    LocalStorageRepository.save(
      RESOURCES_KEY,
      resources,
    );

    return updatedResource;
  }

  static delete(resourceId: string): boolean {
    const resources = ResourceService.findAll();

    const filteredResources = resources.filter(
      (resource) => resource.id !== resourceId,
    );

    if (filteredResources.length === resources.length) {
      return false;
    }

    LocalStorageRepository.save(
      RESOURCES_KEY,
      filteredResources,
    );

    return true;
  }

  static deleteByItem(itemId: string): number {
    const resources = ResourceService.findAll();

    const filteredResources = resources.filter(
      (resource) => resource.itemId !== itemId,
    );

    const deletedCount =
      resources.length - filteredResources.length;

    if (deletedCount > 0) {
      LocalStorageRepository.save(
        RESOURCES_KEY,
        filteredResources,
      );
    }

    return deletedCount;
  }

  static calculateResourceBaseTotal(
    resource: CostResource,
  ): number {
    return resource.quantity * resource.unitPrice;
  }

  static calculateWasteAmount(
    resource: CostResource,
  ): number {
    const baseTotal =
      ResourceService.calculateResourceBaseTotal(resource);

    return (
      baseTotal *
      ((resource.wastePercentage ?? 0) / 100)
    );
  }

  static calculateResourceTotal(
    resource: CostResource,
  ): number {
    return (
      ResourceService.calculateResourceBaseTotal(resource) +
      ResourceService.calculateWasteAmount(resource)
    );
  }

  static calculateTypeTotal(
    itemId: string,
    type: ResourceType,
  ): number {
    return ResourceService.findByItemAndType(
      itemId,
      type,
    ).reduce(
      (total, resource) =>
        total +
        ResourceService.calculateResourceTotal(resource),
      0,
    );
  }

  static calculateItemTotal(itemId: string): number {
    return ResourceService.findByItem(itemId).reduce(
      (total, resource) =>
        total +
        ResourceService.calculateResourceTotal(resource),
      0,
    );
  }
}