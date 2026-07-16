import { ItemService } from "@/services/item.service";
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
  resourcesCount: number;
  itemTotal: number;
  isCalculated: boolean;
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

    const materialsSubtotal =
      ApuService.calculateTypeTotal(
        itemId,
        "material",
      );

    const laborSubtotal =
      ApuService.calculateTypeTotal(
        itemId,
        "labor",
      );

    const equipmentSubtotal =
      ApuService.calculateTypeTotal(
        itemId,
        "equipment",
      );

    const subcontractSubtotal =
      ApuService.calculateTypeTotal(
        itemId,
        "subcontract",
      );

    const directCost =
      materialsSubtotal +
      laborSubtotal +
      equipmentSubtotal +
      subcontractSubtotal;

    const indirectCostsAmount =
      ApuService.calculatePercentage(
        directCost,
        item.adjustments.indirectCostsPercentage,
      );

    const contingencyAmount =
      ApuService.calculatePercentage(
        directCost,
        item.adjustments.contingencyPercentage,
      );

    const costBeforeProfit =
      directCost +
      indirectCostsAmount +
      contingencyAmount;

    const profitAmount =
      ApuService.calculatePercentage(
        costBeforeProfit,
        item.adjustments.profitPercentage,
      );

    const unitPriceBeforeTax =
      costBeforeProfit + profitAmount;

    const taxAmount =
      ApuService.calculatePercentage(
        unitPriceBeforeTax,
        item.adjustments.taxPercentage,
      );

    const finalUnitPrice =
      unitPriceBeforeTax + taxAmount;

    const itemTotal =
      finalUnitPrice * item.quantity;

    return {
      itemId,
      itemQuantity: item.quantity,
      resourcesCount: resources.length,

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
        calculation.resourcesCount > 0
          ? "priced"
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

  /**
   * Actualiza los porcentajes del APU y recalcula su precio.
   */
  static updateAdjustments(
    itemId: string,
    adjustments: Partial<
      BudgetItem["adjustments"]
    >,
  ): BudgetItem | null {
    const updatedItem = ItemService.update(itemId, {
      adjustments,
    });

    if (!updatedItem) {
      return null;
    }

    return ApuService.recalculate(itemId);
  }

  private static calculatePercentage(
    baseAmount: number,
    percentage: number,
  ): number {
    const safeBase = Math.max(0, baseAmount);
    const safePercentage = Math.max(0, percentage);

    return safeBase * (safePercentage / 100);
  }
}