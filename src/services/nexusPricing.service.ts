import PRICE_OBSERVATIONS_JSON from "@/data/nexusPriceObservations.json";
import {
  recommendResourcePrice,
  type NexusPriceObservation,
  type PriceRecommendation,
  type PriceRecommendationOptions,
  type PriceSourceClass,
} from "@/services/priceRecommendationEngine";

interface StoredPriceObservation {
  id?: string;
  resourceId?: string;
  price?: number;
  displayedPrice?: number;
  supplier?: string;
  source?: string;
  sourceUrl?: string;
  region?: string;
  registeredAt?: string;
  verificationStatus?: string;
  mappingConfidence?: "HIGH" | "MEDIUM" | "LOW" | "UNMAPPED";
}

function sourceClass(observation: StoredPriceObservation): PriceSourceClass {
  const verification = (observation.verificationStatus ?? "").toUpperCase();
  const supplier = (observation.supplier ?? "").toLowerCase();
  if (verification.includes("OFICIAL") || supplier.includes("sidip")) return "OFFICIAL_REFERENCE";
  if (verification.includes("COMUNIDAD") || supplier.includes("controlobra") || supplier.includes("preciosobra")) return "COMMUNITY_REFERENCE";
  if (verification.includes("WEB") || supplier.includes("ferreter")) return "SUPPLIER_LISTED";
  return "OTHER";
}

const OBSERVATIONS: NexusPriceObservation[] =
  (PRICE_OBSERVATIONS_JSON as unknown as StoredPriceObservation[])
    .filter((item) => Boolean(item.resourceId) && Number(item.price) > 0)
    .map((item, index) => ({
      id: item.id ?? `NEXUS-PRICE-${index + 1}`,
      resourceId: item.resourceId!,
      normalizedBasePrice: Number(item.price),
      displayedPrice: item.displayedPrice,
      currency: "DOP",
      region: item.region,
      sourceName: item.supplier,
      sourceUrl: item.sourceUrl ?? (item.source?.startsWith("http") ? item.source : undefined),
      sourceClass: sourceClass(item),
      mappingConfidence: item.mappingConfidence ?? "MEDIUM",
      observedAt: item.registeredAt ?? "2026-09-07",
      verificationStatus: item.verificationStatus,
    }));

export class NexusPricingService {
  static observations(resourceId?: string): NexusPriceObservation[] {
    return resourceId ? OBSERVATIONS.filter((item) => item.resourceId === resourceId) : [...OBSERVATIONS];
  }

  static recommend(resourceId: string, options: PriceRecommendationOptions = {}): PriceRecommendation {
    return recommendResourcePrice(resourceId, OBSERVATIONS, options);
  }
}
