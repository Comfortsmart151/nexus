import { ItemService } from "@/services/item.service";
import { calculateApuDirectCost } from "@/services/apuCostEngine";
import { ResourceService } from "@/services/resource.service";
import type {
  ApuSummary,
  BudgetItem,
  CostResource,
  ResourceType,
} from "@/types/budget";

export interface ApuCalculation extends ApuSummary {
  itemId: string;
  itemQuantity: number;
  analysisVolume: number;
  resourcesCount: number;
  pricedResourcesCount: number;
  missingPriceCount: number;
  missingPriceResourceIds: string[];
  referentialPriceCount: number;
  invalidQuantityCount: number;
  invalidQuantityResourceIds: string[];
  itemTotal: number;
  isCalculated: boolean;
  isCostable: boolean;
}

export class ApuService {
  /**
   * Devuelve todos los recursos pertenecientes al APU.
   */
  static getResources(itemId: string): CostResource[] {
    return ResourceService.findByItem(itemId);
  }

  /**
   * Devuelve los recursos de una categoría específica.
   */
  static getResourcesByType(
    itemId: string,
    type: ResourceType,
  ): CostResource[] {
    return ResourceService.findByItemAndType(
      itemId,
      type,
    );
  }

  /**
   * Calcula el costo base de un recurso:
   *
   * cantidad × precio unitario
   */
  static calculateResourceBase(
    resource: CostResource,
  ): number {
    return ResourceService.calculateResourceBaseTotal(
      resource,
    );
  }

  /**
   * Calcula el importe correspondiente al desperdicio.
   */
  static calculateResourceWaste(
    resource: CostResource,
  ): number {
    return ResourceService.calculateWasteAmount(resource);
  }

  /**
   * Calcula el importe final del recurso incluyendo desperdicio.
   */
  static calculateResourceTotal(
    resource: CostResource,
  ): number {
    return ResourceService.calculateResourceTotal(resource);
  }

  /**
   * Calcula el subtotal de una categoría.
   */
  static calculateTypeTotal(
    itemId: string,
    type: ResourceType,
  ): number {
    return ResourceService.calculateTypeTotal(
      itemId,
      type,
    );
  }

  /**
   * Realiza el cálculo completo de un APU.
   */
  static calculate(
    itemId: string,
  ): ApuCalculation | null {
    const item = ItemService.findById(itemId);

    if (!item) {
      return null;
    }

    const resources = ApuService.getResources(itemId);
    const costResult = calculateApuDirectCost(
      resources.map((resource) => ({
        resourceId: resource.id,
        type: resource.type,
        quantityPerApu: resource.quantity,
        unitPrice: resource.unitPrice,
        wastePercentage: resource.wastePercentage,
      })),
    );

    const materialsSubtotal = costResult.materials;
    const laborSubtotal = costResult.labor;
    const equipmentSubtotal = costResult.equipment;
    const subcontractSubtotal = costResult.subcontract;
    const directCost = costResult.directCost;

    // Revenue MVP: el APU contiene solo costos directos.
    // Los ajustes comerciales se aplican una sola vez en el presupuesto.
    const indirectCostsAmount = 0;
    const contingencyAmount = 0;
    const profitAmount = 0;
    const taxAmount = 0;
    const analysisVolume =
      Number.isFinite(item.analysisVolume) && item.analysisVolume > 0
        ? item.analysisVolume
        : 1;

    const unitPriceBeforeTax = directCost / analysisVolume;
    const manualPriceAdjustmentPercentage = Math.max(0, item.manualPriceAdjustmentPercentage ?? 0);
    const finalUnitPrice = unitPriceBeforeTax * (1 + manualPriceAdjustmentPercentage / 100);
    const itemTotal = finalUnitPrice * item.quantity;
    const pricedResourcesCount = resources.filter(
      (resource) => Number.isFinite(resource.unitPrice) && resource.unitPrice > 0,
    ).length;
    const referentialPriceCount = resources.filter(
      (resource) => resource.priceStatus === "referential",
    ).length;

    return {
      itemId,
      itemQuantity: item.quantity,
      analysisVolume,
      resourcesCount: resources.length,
      pricedResourcesCount,
      missingPriceCount: costResult.missingPriceResourceIds.length,
      missingPriceResourceIds: costResult.missingPriceResourceIds,
      referentialPriceCount,
      invalidQuantityCount: costResult.missingQuantityResourceIds.length,
      invalidQuantityResourceIds: costResult.missingQuantityResourceIds,

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
      itemTotal,
      isCalculated: resources.length > 0,
      isCostable: resources.length > 0 && costResult.isCostable,
    };
  }

  /**
   * Calcula y guarda el precio unitario de la partida.
   */
  static recalculate(
    itemId: string,
  ): BudgetItem | null {
    const calculation = ApuService.calculate(itemId);

    if (!calculation) {
      return null;
    }

    return ItemService.update(itemId, {
      unitPrice: calculation.finalUnitPrice,
      status:
        calculation.isCostable
          ? "priced"
          : calculation.resourcesCount > 0
            ? "in-progress"
            : "unpriced",
    });
  }

  /**
   * Agrega un recurso y recalcula automáticamente el APU.
   */
  static addResource(
    input: Parameters<typeof ResourceService.create>[0],
  ): CostResource {
    const resource = ResourceService.create(input);

    ApuService.recalculate(input.itemId);

    return resource;
  }

  /**
   * Actualiza un recurso y recalcula automáticamente el APU.
   */
  static updateResource(
    resourceId: string,
    input: Parameters<typeof ResourceService.update>[1],
  ): CostResource | null {
    const currentResource =
      ResourceService.findById(resourceId);

    if (!currentResource) {
      return null;
    }

    const updatedResource = ResourceService.update(
      resourceId,
      input,
    );

    if (updatedResource) {
      ApuService.recalculate(currentResource.itemId);
    }

    return updatedResource;
  }

  /**
   * Elimina un recurso y recalcula automáticamente el APU.
   */
  static deleteResource(
    resourceId: string,
  ): boolean {
    const resource =
      ResourceService.findById(resourceId);

    if (!resource) {
      return false;
    }

    const deleted =
      ResourceService.delete(resourceId);

    if (deleted) {
      ApuService.recalculate(resource.itemId);
    }

    return deleted;
  }

}