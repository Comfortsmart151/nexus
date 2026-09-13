export type ProjectPriceRegion = "santo-domingo" | "santiago-cibao" | "punta-cana";

export interface ConstrucostoRegionalPrice {
  region: string;
  price: number;
  period: string;
  supplier?: string;
  sourceUrl?: string;
}

export interface ConstrucostoRegionalCatalogEntry {
  resourceId: string;
  resourceCode: string;
  type: "material" | "labor" | "equipment" | "subcontract";
  name: string;
  displayName: string;
  unit: string;
  group: string;
  occurrence: number;
  prices: Partial<Record<ProjectPriceRegion, ConstrucostoRegionalPrice>>;
}

export interface ConstrucostoCostAnalysis {
  id: string;
  code: string;
  group: string;
  name: string;
  quantity: number;
  unit: string;
  source: string;
  period: string;
  prices: Partial<Record<ProjectPriceRegion, ConstrucostoRegionalPrice>>;
}

export type ConstrucostoDetailedResourceSection = "materials-equipment" | "labor";

export interface ConstrucostoDetailedApuResource {
  name: string;
  unit: string;
  sourceQuantity: number;
  normalizedQuantity: number;
  unitPrice: number;
  amount: number;
  section: ConstrucostoDetailedResourceSection;
  type: "material" | "labor" | "equipment" | "subcontract";
  libraryResourceId: string | null;
  libraryResourceCode: string | null;
  libraryResourceName: string | null;
  mappingMethod: string;
  mappingConfidence: number;
}

export interface ConstrucostoDetailedApuRegion {
  code: string;
  groupCode: string;
  groupName: string;
  name: string;
  subtitle: string;
  quantity: number;
  unit: string;
  listedUnitPrice: number;
  baseQuantity: number;
  baseUnit: string;
  yield: number | null;
  yieldUnit: string | null;
  totalAnalysisCost: number;
  publishedTotalRow: number;
  calculatedResourceTotal: number;
  calculatedUnitCost: number;
  sourceUnitCost: number;
  region: ProjectPriceRegion;
  regionLabel: string;
  period: string;
  sourceUrl: string;
  resources: ConstrucostoDetailedApuResource[];
  auditDifference: number;
  totalRowDifference: number;
  unitCostDifference: number;
}

export interface ConstrucostoDetailedApu {
  id: string;
  code: string;
  groupCode: string;
  groupName: string;
  name: string;
  unit: string;
  period: string;
  source: string;
  regions: Partial<Record<ProjectPriceRegion, ConstrucostoDetailedApuRegion>>;
}
