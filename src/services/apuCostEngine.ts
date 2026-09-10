export type ApuResourceType =
  | "material"
  | "labor"
  | "equipment"
  | "subcontract"
  | "service";

export interface ApuComponentInput {
  resourceId: string;
  type: ApuResourceType;
  quantityPerApu: number | null;
  unitPrice: number | null;
  wastePercentage?: number | null;
}

export interface ApuCostResult {
  isCostable: boolean;
  missingQuantityResourceIds: string[];
  missingPriceResourceIds: string[];
  componentCosts: Array<{
    resourceId: string;
    baseQuantity: number;
    adjustedQuantity: number;
    unitPrice: number;
    total: number;
  }>;
  materials: number;
  labor: number;
  equipment: number;
  subcontract: number;
  service: number;
  directCost: number;
}

export function calculateApuDirectCost(
  components: ApuComponentInput[],
): ApuCostResult {
  const missingQuantityResourceIds = components
    .filter((c) => c.quantityPerApu == null || c.quantityPerApu < 0)
    .map((c) => c.resourceId);

  const missingPriceResourceIds = components
    .filter((c) => c.unitPrice == null || c.unitPrice <= 0)
    .map((c) => c.resourceId);

  const valid = components.filter(
    (c) =>
      c.quantityPerApu != null &&
      c.quantityPerApu >= 0 &&
      c.unitPrice != null &&
      c.unitPrice > 0,
  );

  const componentCosts = valid.map((c) => {
    const waste = Math.max(0, c.wastePercentage ?? 0) / 100;
    const adjustedQuantity = c.quantityPerApu! * (1 + waste);
    return {
      resourceId: c.resourceId,
      baseQuantity: c.quantityPerApu!,
      adjustedQuantity,
      unitPrice: c.unitPrice!,
      total: adjustedQuantity * c.unitPrice!,
    };
  });

  const typeByResource = new Map(components.map((c)=>[c.resourceId,c.type]));
  const bucket = (type:ApuResourceType) =>
    componentCosts
      .filter((c)=>typeByResource.get(c.resourceId)===type)
      .reduce((s,c)=>s+c.total,0);

  const materials=bucket("material");
  const labor=bucket("labor");
  const equipment=bucket("equipment");
  const subcontract=bucket("subcontract");
  const service=bucket("service");
  const directCost=materials+labor+equipment+subcontract+service;

  return {
    isCostable:
      missingQuantityResourceIds.length===0 &&
      missingPriceResourceIds.length===0,
    missingQuantityResourceIds,
    missingPriceResourceIds,
    componentCosts,
    materials,
    labor,
    equipment,
    subcontract,
    service,
    directCost,
  };
}

/**
 * Converts productivity into labor/equipment coefficient when measured.
 * No default productivity is fabricated.
 */
export function hoursPerOutputUnit(
  outputPerHour: number | null,
): number | null {
  if (outputPerHour == null || outputPerHour <= 0) return null;
  return 1 / outputPerHour;
}
