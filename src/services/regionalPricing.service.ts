import REGIONAL_CATALOG_JSON from "@/data/construcostoRegionalCatalog.json";
import COST_ANALYSES_JSON from "@/data/construcostoCostAnalyses.json";
import DETAILED_APU_JSON from "@/data/construcostoDetailedApu.json";
import DETAILED_APU_AUDIT_JSON from "@/data/construcostoDetailedApuAudit.json";
import type { LibraryResource } from "@/types/library";
import { LibraryService } from "@/services/library.service";
import { ResourceService } from "@/services/resource.service";
import { ItemService } from "@/services/item.service";
import type {
  ConstrucostoCostAnalysis,
  ConstrucostoDetailedApu,
  ConstrucostoDetailedApuRegion,
  ConstrucostoRegionalCatalogEntry,
  ProjectPriceRegion,
} from "@/types/construcosto";

export const PRICE_REGIONS: { value: ProjectPriceRegion; label: string }[] = [
  { value: "santo-domingo", label: "Santo Domingo" },
  { value: "santiago-cibao", label: "Santiago–Cibao" },
  { value: "punta-cana", label: "Punta Cana" },
];

const REGIONAL_CATALOG = REGIONAL_CATALOG_JSON as ConstrucostoRegionalCatalogEntry[];
const COST_ANALYSES = COST_ANALYSES_JSON as ConstrucostoCostAnalysis[];
const DETAILED_APUS = DETAILED_APU_JSON as ConstrucostoDetailedApu[];
const DETAILED_AUDIT = DETAILED_APU_AUDIT_JSON as { resourceLines?: number; mappedLines?: number; unmappedLines?: number };
const BY_RESOURCE = new Map(REGIONAL_CATALOG.map((entry) => [entry.resourceId, entry]));

export class RegionalPricingService {
  static getCatalog(): ConstrucostoRegionalCatalogEntry[] {
    return REGIONAL_CATALOG;
  }

  static getRegionalEntry(resourceId: string): ConstrucostoRegionalCatalogEntry | null {
    return BY_RESOURCE.get(resourceId) ?? null;
  }

  static getPrice(resourceId: string, region: ProjectPriceRegion): number | null {
    const value = BY_RESOURCE.get(resourceId)?.prices?.[region]?.price;
    return Number.isFinite(value) && (value ?? 0) > 0 ? Number(value) : null;
  }

  static resolveResourcePrice(resource: LibraryResource, region?: ProjectPriceRegion): number {
    if (!region) return resource.defaultUnitPrice;
    return this.getPrice(resource.id, region) ?? resource.defaultUnitPrice;
  }

  static getRegionLabel(region?: ProjectPriceRegion): string {
    return PRICE_REGIONS.find((item) => item.value === region)?.label ?? "Santiago–Cibao";
  }

  static findBestCostAnalysis(description: string): { analysis: ConstrucostoCostAnalysis; score: number; matchedTerms: string[] } | null {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9ñ]+/g, " ").trim();
    const query = normalize(description);
    if (!query) return null;
    const stop = new Set(["de", "del", "la", "el", "y", "en", "con", "para", "por", "un", "una"]);
    const queryTokens = query.split(/\s+/).filter((token) => token.length >= 3 && !stop.has(token));
    let best: { analysis: ConstrucostoCostAnalysis; score: number; matchedTerms: string[] } | null = null;

    for (const analysis of COST_ANALYSES) {
      const target = normalize(`${analysis.code} ${analysis.name}`);
      const name = normalize(analysis.name);
      const targetTokens = new Set(target.split(/\s+/));
      const matchedTerms = queryTokens.filter((token) => targetTokens.has(token));
      let score = 0;
      if (query === name || query === normalize(analysis.code)) score = 140;
      else if (name.includes(query) && query.length >= 5) score = 115;
      else if (query.includes(name) && name.length >= 5) score = 110;
      else if (queryTokens.length > 0) {
        const coverage = matchedTerms.length / queryTokens.length;
        const specificity = matchedTerms.length / Math.max(1, targetTokens.size);
        score = Math.round(coverage * 85 + specificity * 25);
      }
      if (matchedTerms.some((term) => term.length >= 8)) score += 10;
      if (!best || score > best.score) best = { analysis, score, matchedTerms };
    }
    return best && best.score >= 95 ? best : null;
  }

  static getDetailedApu(code: string, name: string, region: ProjectPriceRegion): ConstrucostoDetailedApuRegion | null {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9ñ]+/g, " ").trim();
    const targetName = normalize(name);
    const match = DETAILED_APUS.find((item) => item.code === code && normalize(item.name) === targetName)
      ?? DETAILED_APUS.find((item) => item.code === code && normalize(item.name).includes(targetName))
      ?? null;
    return match?.regions?.[region] ?? null;
  }

  static hasDetailedApu(code: string, name: string): boolean {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9ñ]+/g, " ").trim();
    return DETAILED_APUS.some((item) => item.code === code && normalize(item.name) === normalize(name));
  }

  static getCostAnalyses(region: ProjectPriceRegion, search = ""): Array<ConstrucostoCostAnalysis & { regionalPrice: number; hasDetailedApu: boolean }> {
    const term = search.trim().toLocaleLowerCase("es");
    return COST_ANALYSES
      .filter((item) => !term || `${item.code} ${item.group} ${item.name}`.toLocaleLowerCase("es").includes(term))
      .map((item) => ({ ...item, regionalPrice: item.prices?.[region]?.price ?? 0, hasDetailedApu: this.hasDetailedApu(item.code, item.name) }));
  }

  static repriceProject(projectId: string, region: ProjectPriceRegion): number {
    const items = ItemService.findByProject(projectId);
    let updated = 0;
    items.forEach((item) => {
      ResourceService.findByItem(item.id).forEach((costResource) => {
        if (!costResource.libraryResourceId) return;
        const libraryResource = LibraryService.findById(costResource.libraryResourceId);
        if (!libraryResource) return;
        const regional = this.getRegionalEntry(libraryResource.id)?.prices?.[region];
        if (!regional || !Number.isFinite(regional.price) || regional.price <= 0) return;
        ResourceService.update(costResource.id, {
          unitPrice: regional.price,
          priceStatus: "confirmed",
          priceSource: `Construcosto.do — ${regional.region}`,
          priceSourceDate: "2026-08-31",
          priceConfidence: "SOURCE_NATIVE",
        });
        updated += 1;
      });
      ItemService.recalculateUnitPrice(item.id);
    });
    return updated;
  }

  static getStats() {
    return {
      canonicalResources: REGIONAL_CATALOG.length,
      costAnalyses: COST_ANALYSES.length,
      detailedAnalyses: DETAILED_APUS.length,
      detailedResourceLines: DETAILED_AUDIT.resourceLines ?? 0,
      mappedDetailedLines: DETAILED_AUDIT.mappedLines ?? 0,
      unmappedDetailedLines: DETAILED_AUDIT.unmappedLines ?? 0,
      materials: REGIONAL_CATALOG.filter((entry) => entry.type === "material").length,
      labor: REGIONAL_CATALOG.filter((entry) => entry.type === "labor").length,
      equipment: REGIONAL_CATALOG.filter((entry) => entry.type === "equipment").length,
    };
  }
}
