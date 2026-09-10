export type PriceSourceClass =
  | "QUOTE"
  | "SUPPLIER_LISTED"
  | "OFFICIAL_REFERENCE"
  | "COMMUNITY_REFERENCE"
  | "OTHER";

export type MappingConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNMAPPED";

export interface NexusPriceObservation {
  id: string;
  resourceId: string;
  normalizedBasePrice: number;
  displayedPrice?: number;
  currency: string;
  region?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceClass: PriceSourceClass;
  mappingConfidence: MappingConfidence;
  observedAt: string;
  verificationStatus?: string;
}

export interface PriceRecommendationOptions {
  targetRegion?: string;
  now?: Date;
  maxAgeDays?: number;
}

export interface PriceRecommendation {
  resourceId: string;
  recommendedPrice: number | null;
  confidenceScore: number;
  confidenceBand: "HIGH" | "MEDIUM" | "LOW" | "NO_PRICE";
  observationCount: number;
  distinctSources: number;
  minPrice: number | null;
  maxPrice: number | null;
  medianPrice: number | null;
  latestObservedAt: string | null;
  selectedObservationId: string | null;
  rationale: string[];
}

const SOURCE_WEIGHT: Record<PriceSourceClass, number> = {
  QUOTE: 1.00,
  SUPPLIER_LISTED: 0.92,
  OFFICIAL_REFERENCE: 0.88,
  COMMUNITY_REFERENCE: 0.72,
  OTHER: 0.55,
};

const MAPPING_WEIGHT: Record<MappingConfidence, number> = {
  HIGH: 1.00,
  MEDIUM: 0.82,
  LOW: 0.55,
  UNMAPPED: 0,
};

export function recommendResourcePrice(
  resourceId: string,
  observations: NexusPriceObservation[],
  options: PriceRecommendationOptions = {},
): PriceRecommendation {
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 540;
  const targetRegion = normalize(options.targetRegion);

  const usable = observations
    .filter((o) => o.resourceId === resourceId)
    .filter((o) => Number.isFinite(o.normalizedBasePrice) && o.normalizedBasePrice > 0)
    .filter((o) => o.mappingConfidence !== "UNMAPPED")
    .map((o) => {
      const ageDays = Math.max(
        0,
        (now.getTime() - new Date(o.observedAt).getTime()) / 86400000,
      );
      const freshness = Math.max(0.35, 1 - ageDays / maxAgeDays);
      const region = normalize(o.region);
      const regionWeight =
        !targetRegion || !region ? 0.90 : region === targetRegion ? 1.00 : 0.78;
      const weight =
        SOURCE_WEIGHT[o.sourceClass] *
        MAPPING_WEIGHT[o.mappingConfidence] *
        freshness *
        regionWeight;

      return { observation: o, weight, ageDays };
    })
    .filter((x) => x.weight > 0);

  if (usable.length === 0) {
    return {
      resourceId,
      recommendedPrice: null,
      confidenceScore: 0,
      confidenceBand: "NO_PRICE",
      observationCount: 0,
      distinctSources: 0,
      minPrice: null,
      maxPrice: null,
      medianPrice: null,
      latestObservedAt: null,
      selectedObservationId: null,
      rationale: ["No existe observación utilizable. No se inventa precio."],
    };
  }

  const prices = usable.map((x) => x.observation.normalizedBasePrice).sort((a,b)=>a-b);
  const median = medianOf(prices);

  // Reduce the impact of extreme observations around the median.
  const robust = usable.map((x) => {
    const ratio = x.observation.normalizedBasePrice / median;
    const outlierPenalty = ratio < 0.55 || ratio > 1.80 ? 0.35 :
      ratio < 0.75 || ratio > 1.35 ? 0.72 : 1;
    return { ...x, adjustedWeight: x.weight * outlierPenalty };
  });

  const sumW = robust.reduce((s,x)=>s+x.adjustedWeight,0);
  const weighted = robust.reduce(
    (s,x)=>s+x.observation.normalizedBasePrice*x.adjustedWeight,0
  ) / sumW;

  const sourceSet = new Set(
    usable.map((x) => normalize(x.observation.sourceName || x.observation.sourceUrl))
      .filter(Boolean),
  );

  const recencyScore = Math.max(...usable.map((x)=>Math.max(0,1-x.ageDays/maxAgeDays)));
  const mappingScore = Math.max(...usable.map((x)=>MAPPING_WEIGHT[x.observation.mappingConfidence]));
  const sourceScore = Math.max(...usable.map((x)=>SOURCE_WEIGHT[x.observation.sourceClass]));
  const multiSourceBonus = Math.min(1, sourceSet.size / 3);

  const confidenceScore = clamp(
    100 * (
      0.35 * sourceScore +
      0.25 * mappingScore +
      0.20 * recencyScore +
      0.20 * multiSourceBonus
    ),
    0, 100
  );

  const selected = robust
    .slice()
    .sort((a,b)=>b.adjustedWeight-a.adjustedWeight)[0].observation;

  return {
    resourceId,
    recommendedPrice: round6(weighted),
    confidenceScore: Math.round(confidenceScore),
    confidenceBand:
      confidenceScore >= 82 ? "HIGH" :
      confidenceScore >= 62 ? "MEDIUM" : "LOW",
    observationCount: usable.length,
    distinctSources: sourceSet.size,
    minPrice: prices[0],
    maxPrice: prices[prices.length-1],
    medianPrice: round6(median),
    latestObservedAt: usable
      .map((x)=>x.observation.observedAt)
      .sort()
      .at(-1) ?? null,
    selectedObservationId: selected.id,
    rationale: [
      "Precio recomendado calculado sobre observaciones normalizadas a unidad base.",
      "Pondera fuente, confianza de mapeo, antigüedad y región.",
      "Aplica penalización a posibles outliers; nunca rellena recursos sin evidencia.",
    ],
  };
}

function medianOf(values: number[]): number {
  const n = values.length;
  const mid = Math.floor(n/2);
  return n % 2 ? values[mid] : (values[mid-1] + values[mid]) / 2;
}
function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}
function clamp(value:number,min:number,max:number){ return Math.max(min,Math.min(max,value)); }
function round6(value:number){ return Math.round(value*1_000_000)/1_000_000; }
