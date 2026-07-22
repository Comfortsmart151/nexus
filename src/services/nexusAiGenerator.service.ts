import {
  NexusAiKnowledgeService,
  normalizeNexusAiKnowledgeText,
  tokenizeNexusAiKnowledgeText,
} from "@/services/nexusAiKnowledge.service";

import {
  NexusAiMatcherService,
  type NexusAiKnowledgeRuleMatchResult,
  type NexusAiMatcherOptions,
} from "@/services/nexusAiMatcher.service";

import {
  createEmptyNexusAiApuSummary,
  getNexusAiConfidenceLevel,
} from "@/types/nexus-ai";

import type { ResourceType } from "@/types/budget";

import type {
  NexusAiApuProposal,
  NexusAiApuResourceSuggestion,
  NexusAiApuSummary,
  NexusAiConstructionCategory,
  NexusAiDetectedAttribute,
  NexusAiDetectedMeasurement,
  NexusAiGenerationError,
  NexusAiGenerationProgress,
  NexusAiGenerationRequest,
  NexusAiGenerationResult,
  NexusAiGenerationStatus,
  NexusAiKnowledgeRule,
  NexusAiParsedDescription,
  NexusAiResourceMatch,
} from "@/types/nexus-ai";

const DEFAULT_COUNTRY_CODE = "DO";
const DEFAULT_CURRENCY_CODE = "DOP";
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "ud";

const MINIMUM_DESCRIPTION_LENGTH = 3;
const MINIMUM_KNOWLEDGE_SCORE = 20;
const HIGH_KNOWLEDGE_SCORE = 100;
const MAXIMUM_GENERATION_CONFIDENCE = 0.98;

const CATEGORY_KEYWORDS: Record<
  NexusAiConstructionCategory,
  string[]
> = {
  preliminaries: [
    "preliminar",
    "replanteo",
    "movilizacion",
    "movilización",
    "campamento",
    "instalacion provisional",
    "instalación provisional",
  ],
  earthworks: [
    "excavacion",
    "excavación",
    "relleno",
    "compactacion",
    "compactación",
    "nivelacion",
    "nivelación",
    "movimiento de tierra",
    "bote",
  ],
  concrete: [
    "hormigon",
    "hormigón",
    "concreto",
    "vaciado",
    "mezcla",
    "3000 psi",
    "210 kg",
  ],
  reinforcement: [
    "acero",
    "varilla",
    "hierro",
    "refuerzo",
    "varillero",
    "armado",
  ],
  masonry: [
    "muro",
    "pared",
    "block",
    "bloque",
    "mamposteria",
    "mampostería",
    "ladrillo",
  ],
  plaster: [
    "pañete",
    "panete",
    "repello",
    "revoque",
    "estuco",
  ],
  finishes: [
    "terminacion",
    "terminación",
    "acabado",
    "revestimiento",
  ],
  painting: [
    "pintura",
    "pintar",
    "acrilica",
    "acrílica",
    "sellador",
    "esmalte",
  ],
  flooring: [
    "piso",
    "ceramica",
    "cerámica",
    "porcelanato",
    "baldosa",
    "zocalo",
    "zócalo",
  ],
  roofing: [
    "techo",
    "cubierta",
    "impermeabilizacion",
    "impermeabilización",
    "zinc",
    "aluzinc",
  ],
  carpentry: [
    "carpinteria",
    "carpintería",
    "madera",
    "puerta",
    "gabinete",
    "closet",
  ],
  metalwork: [
    "metalico",
    "metálico",
    "herrería",
    "herreria",
    "soldadura",
    "perfil",
    "baranda",
  ],
  plumbing: [
    "sanitario",
    "sanitaria",
    "plomeria",
    "plomería",
    "tuberia",
    "tubería",
    "desague",
    "desagüe",
    "agua potable",
  ],
  electrical: [
    "electrico",
    "eléctrico",
    "electrica",
    "eléctrica",
    "cable",
    "tomacorriente",
    "interruptor",
    "tablero",
    "luminaria",
  ],
  hvac: [
    "aire acondicionado",
    "climatizacion",
    "climatización",
    "ventilacion",
    "ventilación",
    "ducto",
    "hvac",
  ],
  equipment: [
    "equipo",
    "maquinaria",
    "alquiler",
    "operacion",
    "operación",
  ],
  landscaping: [
    "jardineria",
    "jardinería",
    "paisajismo",
    "grama",
    "siembra",
    "riego",
  ],
  demolition: [
    "demolicion",
    "demolición",
    "desmonte",
    "desmontaje",
    "retiro",
    "escombro",
  ],
  transport: [
    "transporte",
    "acarreo",
    "camion",
    "camión",
    "movilizacion",
    "movilización",
  ],
  cleaning: [
    "limpieza",
    "limpiar",
    "residuos",
    "desperdicios",
  ],
  general: [],
};

const UNIT_PATTERNS: Array<{
  unit: string;
  patterns: RegExp[];
}> = [
  {
    unit: "m²",
    patterns: [
      /\bm2\b/i,
      /\bm²\b/i,
      /\bmetro(?:s)?\s+cuadrado(?:s)?\b/i,
    ],
  },
  {
    unit: "m³",
    patterns: [
      /\bm3\b/i,
      /\bm³\b/i,
      /\bmetro(?:s)?\s+cubico(?:s)?\b/i,
      /\bmetro(?:s)?\s+cúbico(?:s)?\b/i,
    ],
  },
  {
    unit: "m",
    patterns: [
      /\bml\b/i,
      /\bmetro(?:s)?\s+lineal(?:es)?\b/i,
      /\bmetro(?:s)?\b/i,
    ],
  },
  {
    unit: "kg",
    patterns: [
      /\bkg\b/i,
      /\bkgs\b/i,
      /\bkilogramo(?:s)?\b/i,
    ],
  },
  {
    unit: "lb",
    patterns: [
      /\blb\b/i,
      /\blbs\b/i,
      /\blibra(?:s)?\b/i,
    ],
  },
  {
    unit: "ton",
    patterns: [
      /\bton\b/i,
      /\btonelada(?:s)?\b/i,
    ],
  },
  {
    unit: "gal",
    patterns: [
      /\bgal\b/i,
      /\bgalon(?:es)?\b/i,
      /\bgalón(?:es)?\b/i,
    ],
  },
  {
    unit: "litro",
    patterns: [
      /\blt\b/i,
      /\blts\b/i,
      /\blitro(?:s)?\b/i,
    ],
  },
  {
    unit: "funda",
    patterns: [
      /\bfunda(?:s)?\b/i,
      /\bsaco(?:s)?\b/i,
      /\bbolsa(?:s)?\b/i,
    ],
  },
  {
    unit: "ud",
    patterns: [
      /\bud\b/i,
      /\bund\b/i,
      /\bunidad(?:es)?\b/i,
      /\bpieza(?:s)?\b/i,
    ],
  },
  {
    unit: "día",
    patterns: [
      /\bdia(?:s)?\b/i,
      /\bdía(?:s)?\b/i,
      /\bjornada(?:s)?\b/i,
    ],
  },
  {
    unit: "hora",
    patterns: [
      /\bhora(?:s)?\b/i,
      /\bhr(?:s)?\b/i,
    ],
  },
];

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  material: "Material",
  labor: "Mano de obra",
  equipment: "Equipo",
  subcontract: "Subcontrato",
};

export interface NexusAiGeneratorOptions {
  matcherOptions?: NexusAiMatcherOptions;
  minimumKnowledgeScore?: number;
  allowIncompleteApu?: boolean;
  includeOptionalResources?: boolean;
  onProgress?: (
    progress: NexusAiGenerationProgress,
  ) => void;
}

interface ParsedMeasurementCandidate {
  label: string;
  value: number;
  unit: string;
  sourceText: string;
}

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function round(
  value: number,
  decimals = 4,
): number {
  const factor = 10 ** decimals;

  return (
    Math.round(
      (value + Number.EPSILON) * factor,
    ) / factor
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function emitProgress(
  callback:
    | NexusAiGeneratorOptions["onProgress"]
    | undefined,
  status: NexusAiGenerationStatus,
  percentage: number,
  message: string,
): void {
  callback?.({
    status,
    percentage,
    message,
  });
}

function parseNumber(value: string): number {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function detectQuantity(
  description: string,
  explicitQuantity?: number,
): number {
  if (
    explicitQuantity !== undefined &&
    Number.isFinite(explicitQuantity) &&
    explicitQuantity > 0
  ) {
    return explicitQuantity;
  }

  const quantityPatterns = [
    /(?:cantidad|cant\.?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i,
    /(\d+(?:[.,]\d+)?)\s*(?:m²|m2|m³|m3|kg|lb|ton|gal|litros?|uds?|und|unidades?|metros?\s+cuadrados?|metros?\s+cubicos?|metros?\s+cúbicos?)/i,
  ];

  for (const pattern of quantityPatterns) {
    const match = description.match(pattern);

    if (match?.[1]) {
      const quantity = parseNumber(match[1]);

      if (quantity > 0) {
        return quantity;
      }
    }
  }

  return DEFAULT_QUANTITY;
}

function detectUnit(
  description: string,
  explicitUnit?: string,
  knowledgeRule?: NexusAiKnowledgeRule | null,
): string {
  const cleanExplicitUnit =
    explicitUnit?.trim();

  if (cleanExplicitUnit) {
    return cleanExplicitUnit;
  }

  for (const definition of UNIT_PATTERNS) {
    const matched = definition.patterns.some(
      (pattern) => pattern.test(description),
    );

    if (matched) {
      return definition.unit;
    }
  }

  if (knowledgeRule?.defaultUnit) {
    return knowledgeRule.defaultUnit;
  }

  return DEFAULT_UNIT;
}

function detectCategory(
  description: string,
  preferredCategory?: NexusAiConstructionCategory,
): NexusAiConstructionCategory {
  if (preferredCategory) {
    return preferredCategory;
  }

  const normalizedDescription =
    normalizeNexusAiKnowledgeText(description);

  let bestCategory: NexusAiConstructionCategory =
    "general";

  let bestScore = 0;

  (
    Object.entries(CATEGORY_KEYWORDS) as Array<
      [
        NexusAiConstructionCategory,
        string[],
      ]
    >
  ).forEach(([category, keywords]) => {
    const score = keywords.reduce(
      (total, keyword) => {
        const normalizedKeyword =
          normalizeNexusAiKnowledgeText(keyword);

        if (
          normalizedKeyword &&
          normalizedDescription.includes(
            normalizedKeyword,
          )
        ) {
          return (
            total +
            Math.max(
              1,
              normalizedKeyword.split(" ").length,
            )
          );
        }

        return total;
      },
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  });

  return bestCategory;
}

function extractMeasurements(
  description: string,
): NexusAiDetectedMeasurement[] {
  const candidates: ParsedMeasurementCandidate[] =
    [];

  const addCandidate = (
    label: string,
    valueText: string,
    unit: string,
    sourceText: string,
  ) => {
    const value = parseNumber(valueText);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    candidates.push({
      label,
      value,
      unit,
      sourceText,
    });
  };

  const areaRegex =
    /(\d+(?:[.,]\d+)?)\s*(m²|m2|metros?\s+cuadrados?)/gi;

  for (
    const match of description.matchAll(areaRegex)
  ) {
    addCandidate(
      "Área",
      match[1],
      "m²",
      match[0],
    );
  }

  const volumeRegex =
    /(\d+(?:[.,]\d+)?)\s*(m³|m3|metros?\s+c[uú]bicos?)/gi;

  for (
    const match of description.matchAll(volumeRegex)
  ) {
    addCandidate(
      "Volumen",
      match[1],
      "m³",
      match[0],
    );
  }

  const lengthRegex =
    /(\d+(?:[.,]\d+)?)\s*(ml|metros?\s+lineales?)/gi;

  for (
    const match of description.matchAll(lengthRegex)
  ) {
    addCandidate(
      "Longitud",
      match[1],
      "m",
      match[0],
    );
  }

  const thicknessRegex =
    /(?:espesor|grosor)\s*(?:de|:)?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m|pulgadas?|")/gi;

  for (
    const match of description.matchAll(
      thicknessRegex,
    )
  ) {
    addCandidate(
      "Espesor",
      match[1],
      match[2],
      match[0],
    );
  }

  const resistanceRegex =
    /(\d+(?:[.,]\d+)?)\s*(psi|kg\/cm²|kg\/cm2|mpa)/gi;

  for (
    const match of description.matchAll(
      resistanceRegex,
    )
  ) {
    addCandidate(
      "Resistencia",
      match[1],
      match[2],
      match[0],
    );
  }

  const blockSizeRegex =
    /(?:block|bloque)(?:s)?\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(pulgadas?|")/gi;

  for (
    const match of description.matchAll(
      blockSizeRegex,
    )
  ) {
    addCandidate(
      "Espesor del bloque",
      match[1],
      match[2],
      match[0],
    );
  }

  const unique = new Map<
    string,
    NexusAiDetectedMeasurement
  >();

  candidates.forEach((candidate) => {
    const key = [
      candidate.label,
      candidate.value,
      candidate.unit,
    ].join("-");

    if (!unique.has(key)) {
      unique.set(key, candidate);
    }
  });

  return Array.from(unique.values());
}

function extractAttributes(
  description: string,
): NexusAiDetectedAttribute[] {
  const normalized =
    normalizeNexusAiKnowledgeText(description);

  const attributes: NexusAiDetectedAttribute[] =
    [];

  const addAttribute = (
    key: string,
    label: string,
    value: string,
    sourceText: string,
  ) => {
    if (
      attributes.some(
        (attribute) =>
          attribute.key === key &&
          attribute.value === value,
      )
    ) {
      return;
    }

    attributes.push({
      key,
      label,
      value,
      sourceText,
    });
  };

  if (normalized.includes("interior")) {
    addAttribute(
      "location",
      "Ubicación",
      "Interior",
      "interior",
    );
  }

  if (normalized.includes("exterior")) {
    addAttribute(
      "location",
      "Ubicación",
      "Exterior",
      "exterior",
    );
  }

  if (
    normalized.includes("estructural")
  ) {
    addAttribute(
      "purpose",
      "Uso",
      "Estructural",
      "estructural",
    );
  }

  if (
    normalized.includes("divisorio") ||
    normalized.includes("division")
  ) {
    addAttribute(
      "purpose",
      "Uso",
      "Divisorio",
      "divisorio",
    );
  }

  if (
    normalized.includes("dos manos") ||
    normalized.includes("2 manos")
  ) {
    addAttribute(
      "coats",
      "Número de manos",
      "2",
      "dos manos",
    );
  }

  if (
    normalized.includes("una mano") ||
    normalized.includes("1 mano")
  ) {
    addAttribute(
      "coats",
      "Número de manos",
      "1",
      "una mano",
    );
  }

  const colors = [
    "blanco",
    "negro",
    "gris",
    "azul",
    "verde",
    "rojo",
    "amarillo",
    "beige",
  ];

  colors.forEach((color) => {
    if (normalized.includes(color)) {
      addAttribute(
        "color",
        "Color",
        color,
        color,
      );
    }
  });

  return attributes;
}

function calculateParsingConfidence(
  description: string,
  category: NexusAiConstructionCategory,
  unit: string,
  measurements: NexusAiDetectedMeasurement[],
  knowledgeScore: number,
): number {
  let confidence = 0.25;

  if (description.trim().length >= 10) {
    confidence += 0.1;
  }

  if (
    tokenizeNexusAiKnowledgeText(description)
      .length >= 3
  ) {
    confidence += 0.1;
  }

  if (category !== "general") {
    confidence += 0.12;
  }

  if (unit !== DEFAULT_UNIT) {
    confidence += 0.08;
  }

  if (measurements.length > 0) {
    confidence += 0.08;
  }

  confidence +=
    clamp(
      knowledgeScore / HIGH_KNOWLEDGE_SCORE,
      0,
      1,
    ) * 0.27;

  return round(
    clamp(
      confidence,
      0.1,
      MAXIMUM_GENERATION_CONFIDENCE,
    ),
    2,
  );
}

function createParsedDescription(
  request: NexusAiGenerationRequest,
  knowledgeRule: NexusAiKnowledgeRule | null,
  knowledgeScore: number,
): NexusAiParsedDescription {
  const normalizedDescription =
    normalizeNexusAiKnowledgeText(
      request.description,
    );

  const measurements =
    extractMeasurements(request.description);

  const attributes =
    extractAttributes(request.description);

  const category = detectCategory(
    request.description,
    request.preferredCategory ??
      knowledgeRule?.category,
  );

  const unit = detectUnit(
    request.description,
    request.unit,
    knowledgeRule,
  );

  const quantity = detectQuantity(
    request.description,
    request.quantity,
  );

  const confidence =
    calculateParsingConfidence(
      request.description,
      category,
      unit,
      measurements,
      knowledgeScore,
    );

  return {
    originalDescription:
      request.description.trim(),
    normalizedDescription,
    detectedCategory: category,
    detectedUnit: unit,
    detectedQuantity: quantity,
    keywords:
      tokenizeNexusAiKnowledgeText(
        request.description,
      ),
    measurements,
    attributes,
    confidence,
    confidenceLevel:
      getNexusAiConfidenceLevel(confidence),
  };
}

function calculateResourceQuantity(
  coefficient: number,
  wastePercentage: number,
  includeWaste: boolean,
): {
  baseQuantity: number;
  wasteQuantity: number;
  finalQuantity: number;
} {
  const baseQuantity = round(
    Math.max(0, coefficient),
    6,
  );

  const wasteQuantity = includeWaste
    ? round(
        baseQuantity *
          (Math.max(0, wastePercentage) /
            100),
        6,
      )
    : 0;

  const finalQuantity = round(
    baseQuantity + wasteQuantity,
    6,
  );

  return {
    baseQuantity,
    wasteQuantity,
    finalQuantity,
  };
}

function calculateSuggestionConfidence(
  match: NexusAiResourceMatch,
): number {
  if (!match.resource) {
    return 0.2;
  }

  return round(
    clamp(
      match.matchScore / 100,
      0.25,
      0.98,
    ),
    2,
  );
}

function shouldIncludeMatch(
  match: NexusAiResourceMatch,
  request: NexusAiGenerationRequest,
  includeOptionalResources: boolean,
): boolean {
  if (match.rule.required) {
    return true;
  }

  if (!includeOptionalResources) {
    return false;
  }

  if (
    match.rule.resourceType === "equipment" &&
    request.includeTools === false
  ) {
    return false;
  }

  const normalizedName =
    normalizeNexusAiKnowledgeText(
      match.rule.resourceName,
    );

  if (
    normalizedName.includes("transporte") &&
    request.includeTransportation === false
  ) {
    return false;
  }

  return true;
}

function createResourceSuggestion(
  match: NexusAiResourceMatch,
  request: NexusAiGenerationRequest,
): NexusAiApuResourceSuggestion {
  const includeWaste =
    request.includeWaste !== false;

  const quantities =
    calculateResourceQuantity(
      match.rule.coefficient,
      match.rule.wastePercentage,
      includeWaste,
    );

  const unitPrice =
    match.resource?.defaultUnitPrice ?? 0;

  const subtotal = round(
    quantities.finalQuantity * unitPrice,
    2,
  );

  const confidence =
    calculateSuggestionConfidence(match);

  return {
    id: createId("nexus-ai-resource"),
    resourceId:
      match.resource?.id ?? null,
    resourceCode:
      match.resource?.code ??
      match.rule.resourceCode ??
      "",
    resourceType:
      match.rule.resourceType,
    name:
      match.resource?.name ??
      match.rule.resourceName,
    unit:
      match.resource?.unit ??
      match.rule.unit,
    quantity: quantities.baseQuantity,
    unitPrice: round(unitPrice, 2),
    wastePercentage: includeWaste
      ? match.rule.wastePercentage
      : 0,
    wasteQuantity:
      quantities.wasteQuantity,
    finalQuantity:
      quantities.finalQuantity,
    subtotal,
    source: match.resource
      ? "library"
      : "knowledge-base",
    confidence,
    confidenceLevel:
      getNexusAiConfidenceLevel(
        confidence,
      ),
    matchReason: match.matchReason,
    notes: match.rule.notes,
    requiresReview:
      !match.resource ||
      match.matchScore < 70 ||
      unitPrice <= 0,
  };
}

function calculateApuSummary(
  resources: NexusAiApuResourceSuggestion[],
): NexusAiApuSummary {
  if (resources.length === 0) {
    return createEmptyNexusAiApuSummary();
  }

  const summary =
    createEmptyNexusAiApuSummary();

  resources.forEach((resource) => {
    switch (resource.resourceType) {
      case "material":
        summary.materialsCost +=
          resource.subtotal;
        break;

      case "labor":
        summary.laborCost +=
          resource.subtotal;
        break;

      case "equipment":
        summary.equipmentCost +=
          resource.subtotal;
        break;

      case "subcontract":
        summary.subcontractCost +=
          resource.subtotal;
        break;
    }

    if (!resource.resourceId) {
      summary.unresolvedResourceCount += 1;
    }
  });

  summary.materialsCost = round(
    summary.materialsCost,
    2,
  );

  summary.laborCost = round(
    summary.laborCost,
    2,
  );

  summary.equipmentCost = round(
    summary.equipmentCost,
    2,
  );

  summary.subcontractCost = round(
    summary.subcontractCost,
    2,
  );

  summary.directCost = round(
    summary.materialsCost +
      summary.laborCost +
      summary.equipmentCost +
      summary.subcontractCost,
    2,
  );

  summary.suggestedUnitPrice =
    summary.directCost;

  summary.resourceCount =
    resources.length;

  return summary;
}

function calculateProposalConfidence(
  parsedDescription: NexusAiParsedDescription,
  knowledgeScore: number,
  matchResult: NexusAiKnowledgeRuleMatchResult,
  resources: NexusAiApuResourceSuggestion[],
): number {
  const knowledgeConfidence = clamp(
    knowledgeScore / HIGH_KNOWLEDGE_SCORE,
    0,
    1,
  );

  const matcherConfidence =
    clamp(
      matchResult.averageScore / 100,
      0,
      1,
    );

  const completenessConfidence =
    clamp(
      matchResult.completenessPercentage /
        100,
      0,
      1,
    );

  const pricedResources =
    resources.filter(
      (resource) =>
        resource.unitPrice > 0 &&
        resource.resourceId,
    ).length;

  const priceConfidence =
    resources.length > 0
      ? pricedResources / resources.length
      : 0;

  const confidence =
    parsedDescription.confidence * 0.2 +
    knowledgeConfidence * 0.3 +
    matcherConfidence * 0.2 +
    completenessConfidence * 0.2 +
    priceConfidence * 0.1;

  return round(
    clamp(
      confidence,
      0.1,
      MAXIMUM_GENERATION_CONFIDENCE,
    ),
    2,
  );
}

function createWarnings(
  knowledgeRule: NexusAiKnowledgeRule,
  matchResult: NexusAiKnowledgeRuleMatchResult,
  resources: NexusAiApuResourceSuggestion[],
): string[] {
  const warnings = [
    ...knowledgeRule.warnings,
  ];

  if (
    matchResult.requiredUnresolvedCount >
    0
  ) {
    warnings.push(
      `${matchResult.requiredUnresolvedCount} recurso(s) obligatorio(s) no fueron encontrados en la biblioteca.`,
    );
  }

  const resourcesWithoutPrice =
    resources.filter(
      (resource) =>
        resource.resourceId &&
        resource.unitPrice <= 0,
    );

  if (resourcesWithoutPrice.length > 0) {
    warnings.push(
      `${resourcesWithoutPrice.length} recurso(s) coincidente(s) no tienen precio registrado.`,
    );
  }

  const lowConfidenceResources =
    resources.filter(
      (resource) =>
        resource.confidence < 0.7,
    );

  if (
    lowConfidenceResources.length > 0
  ) {
    warnings.push(
      `${lowConfidenceResources.length} recurso(s) requieren validación manual por baja confianza.`,
    );
  }

  return Array.from(
    new Set(warnings),
  );
}

function createAssumptions(
  knowledgeRule: NexusAiKnowledgeRule,
  request: NexusAiGenerationRequest,
): string[] {
  const assumptions = [
    ...knowledgeRule.assumptions,
  ];

  assumptions.push(
    "Los coeficientes corresponden al consumo por una unidad de la partida.",
  );

  if (request.includeWaste === false) {
    assumptions.push(
      "Los desperdicios fueron excluidos por solicitud del usuario.",
    );
  }

  if (
    request.includeTools === false
  ) {
    assumptions.push(
      "Las herramientas y equipos opcionales fueron excluidos.",
    );
  }

  if (
    request.includeTransportation ===
    false
  ) {
    assumptions.push(
      "El transporte fue excluido de la propuesta.",
    );
  }

  return Array.from(
    new Set(assumptions),
  );
}

function createProposalCode(
  knowledgeRule: NexusAiKnowledgeRule,
): string {
  return `${knowledgeRule.code}-AI`;
}

function createProposalName(
  request: NexusAiGenerationRequest,
  knowledgeRule: NexusAiKnowledgeRule,
): string {
  const description =
    request.description.trim();

  if (
    description.length >= 5 &&
    description.length <= 100
  ) {
    return description
      .charAt(0)
      .toUpperCase() +
      description.slice(1);
  }

  return knowledgeRule.name;
}

function validateRequest(
  request: NexusAiGenerationRequest,
): NexusAiGenerationError[] {
  const errors: NexusAiGenerationError[] =
    [];

  if (!request.description?.trim()) {
    errors.push({
      code: "DESCRIPTION_REQUIRED",
      field: "description",
      message:
        "Debes escribir una descripción de la partida.",
    });

    return errors;
  }

  if (
    request.description.trim().length <
    MINIMUM_DESCRIPTION_LENGTH
  ) {
    errors.push({
      code: "DESCRIPTION_TOO_SHORT",
      field: "description",
      message:
        "La descripción de la partida es demasiado corta.",
    });
  }

  if (
    request.quantity !== undefined &&
    (
      !Number.isFinite(request.quantity) ||
      request.quantity <= 0
    )
  ) {
    errors.push({
      code: "INVALID_QUANTITY",
      field: "quantity",
      message:
        "La cantidad debe ser mayor que cero.",
    });
  }

  return errors;
}

function createFailedResult(
  startedAt: number,
  errors: NexusAiGenerationError[],
): NexusAiGenerationResult {
  return {
    success: false,
    status: "error",
    proposal: null,
    errors,
    durationMs:
      Date.now() - startedAt,
  };
}

export class NexusAiGeneratorService {
  static parseDescription(
    request: NexusAiGenerationRequest,
  ): NexusAiParsedDescription {
    const knowledgeMatch =
      NexusAiKnowledgeService.findBestMatch(
        request.description,
        {
          category:
            request.preferredCategory,
          activeOnly: true,
          minimumScore: 0,
        },
      );

    return createParsedDescription(
      request,
      knowledgeMatch?.rule ?? null,
      knowledgeMatch?.score ?? 0,
    );
  }

  static generate(
    request: NexusAiGenerationRequest,
    options: NexusAiGeneratorOptions = {},
  ): NexusAiGenerationResult {
    const startedAt = Date.now();

    emitProgress(
      options.onProgress,
      "analyzing",
      10,
      "Analizando la descripción de la partida...",
    );

    const validationErrors =
      validateRequest(request);

    if (validationErrors.length > 0) {
      emitProgress(
        options.onProgress,
        "error",
        100,
        validationErrors[0].message,
      );

      return createFailedResult(
        startedAt,
        validationErrors,
      );
    }

    const minimumKnowledgeScore =
      options.minimumKnowledgeScore ??
      MINIMUM_KNOWLEDGE_SCORE;

    const knowledgeMatch =
      NexusAiKnowledgeService.findBestMatch(
        request.description,
        {
          category:
            request.preferredCategory,
          activeOnly: true,
          minimumScore: 0,
        },
      );

    if (
      !knowledgeMatch ||
      knowledgeMatch.score <
        minimumKnowledgeScore
    ) {
      const error: NexusAiGenerationError =
        {
          code:
            "KNOWLEDGE_RULE_NOT_FOUND",
          field: "description",
          message:
            "NEXUS todavía no tiene una regla constructiva suficientemente compatible con esta partida.",
          details:
            knowledgeMatch
              ? `La mejor coincidencia fue "${knowledgeMatch.rule.name}" con una puntuación de ${knowledgeMatch.score}.`
              : "No se encontraron reglas de conocimiento compatibles.",
        };

      emitProgress(
        options.onProgress,
        "error",
        100,
        error.message,
      );

      return createFailedResult(
        startedAt,
        [error],
      );
    }

    const knowledgeRule =
      knowledgeMatch.rule;

    const parsedDescription =
      createParsedDescription(
        request,
        knowledgeRule,
        knowledgeMatch.score,
      );

    emitProgress(
      options.onProgress,
      "matching-resources",
      40,
      "Buscando materiales, mano de obra y equipos en la biblioteca...",
    );

    const matchResult =
      NexusAiMatcherService.matchKnowledgeRule(
        knowledgeRule,
        options.matcherOptions,
      );

    if (
      !matchResult.canGenerateApu &&
      options.allowIncompleteApu !== true
    ) {
      const missingRequiredResources =
        matchResult.matches
          .filter(
            (match) =>
              match.rule.required &&
              !match.resource,
          )
          .map(
            (match) =>
              match.rule.resourceName,
          );

      const error: NexusAiGenerationError =
        {
          code:
            "REQUIRED_RESOURCES_NOT_FOUND",
          message:
            "No se encontraron todos los recursos obligatorios para generar el APU.",
          details:
            missingRequiredResources.length >
            0
              ? `Recursos pendientes: ${missingRequiredResources.join(", ")}.`
              : undefined,
        };

      emitProgress(
        options.onProgress,
        "error",
        100,
        error.message,
      );

      return createFailedResult(
        startedAt,
        [error],
      );
    }

    emitProgress(
      options.onProgress,
      "generating",
      70,
      "Calculando coeficientes, desperdicios y costos...",
    );

    const includeOptionalResources =
      options.includeOptionalResources !==
      false;

    const resources =
      matchResult.matches
        .filter((match) =>
          shouldIncludeMatch(
            match,
            request,
            includeOptionalResources,
          ),
        )
        .map((match) =>
          createResourceSuggestion(
            match,
            request,
          ),
        );

    const summary =
      calculateApuSummary(resources);

    const confidence =
      calculateProposalConfidence(
        parsedDescription,
        knowledgeMatch.score,
        matchResult,
        resources,
      );

    const warnings = createWarnings(
      knowledgeRule,
      matchResult,
      resources,
    );

    if (
      summary.directCost <= 0
    ) {
      warnings.push(
        "El costo directo es cero porque los recursos encontrados no tienen precios válidos.",
      );
    }

    const proposal: NexusAiApuProposal = {
      id: createId("nexus-ai-apu"),
      request: {
        ...request,
        description:
          request.description.trim(),
        quantity:
          parsedDescription.detectedQuantity,
        unit:
          parsedDescription.detectedUnit,
        countryCode:
          request.countryCode ??
          DEFAULT_COUNTRY_CODE,
        currencyCode:
          request.currencyCode ??
          DEFAULT_CURRENCY_CODE,
        includeWaste:
          request.includeWaste !== false,
        includeTools:
          request.includeTools !== false,
        includeTransportation:
          request.includeTransportation !==
          false,
      },
      parsedDescription,
      knowledgeRuleId:
        knowledgeRule.id,
      code:
        createProposalCode(
          knowledgeRule,
        ),
      name: createProposalName(
        request,
        knowledgeRule,
      ),
      description:
        knowledgeRule.description ??
        request.description.trim(),
      unit:
        parsedDescription.detectedUnit,
      quantity:
        parsedDescription.detectedQuantity,
      category:
        parsedDescription.detectedCategory,
      resources,
      assumptions:
        createAssumptions(
          knowledgeRule,
          request,
        ),
      warnings: Array.from(
        new Set(warnings),
      ),
      summary,
      confidence,
      confidenceLevel:
        getNexusAiConfidenceLevel(
          confidence,
        ),
      requiresReview:
        matchResult.requiredUnresolvedCount >
          0 ||
        resources.some(
          (resource) =>
            resource.requiresReview,
        ) ||
        summary.directCost <= 0,
      generatedAt:
        new Date().toISOString(),
    };

    emitProgress(
      options.onProgress,
      "completed",
      100,
      "APU generado correctamente.",
    );

    return {
      success: true,
      status: "completed",
      proposal,
      errors: [],
      durationMs:
        Date.now() - startedAt,
    };
  }

  static generatePreview(
    description: string,
    unit?: string,
    quantity?: number,
  ): NexusAiGenerationResult {
    return this.generate(
      {
        description,
        unit,
        quantity,
        countryCode:
          DEFAULT_COUNTRY_CODE,
        currencyCode:
          DEFAULT_CURRENCY_CODE,
        includeWaste: true,
        includeTools: true,
        includeTransportation: true,
      },
      {
        allowIncompleteApu: true,
        includeOptionalResources: true,
      },
    );
  }

  static canGenerate(
    description: string,
    minimumScore =
      MINIMUM_KNOWLEDGE_SCORE,
  ): {
    canGenerate: boolean;
    score: number;
    rule: NexusAiKnowledgeRule | null;
    reason: string;
  } {
    const match =
      NexusAiKnowledgeService.findBestMatch(
        description,
        {
          activeOnly: true,
          minimumScore: 0,
        },
      );

    if (!match) {
      return {
        canGenerate: false,
        score: 0,
        rule: null,
        reason:
          "No se encontraron reglas compatibles.",
      };
    }

    if (match.score < minimumScore) {
      return {
        canGenerate: false,
        score: match.score,
        rule: match.rule,
        reason:
          "La coincidencia encontrada no alcanza la confianza mínima.",
      };
    }

    return {
      canGenerate: true,
      score: match.score,
      rule: match.rule,
      reason:
        "Existe una regla constructiva compatible.",
    };
  }

  static explainProposal(
    proposal: NexusAiApuProposal,
  ): string[] {
    const explanation: string[] = [];

    explanation.push(
      `NEXUS identificó la partida como "${proposal.name}".`,
    );

    explanation.push(
      `Categoría detectada: ${proposal.category}.`,
    );

    explanation.push(
      `Unidad de análisis: ${proposal.unit}.`,
    );

    explanation.push(
      `Se incluyeron ${proposal.summary.resourceCount} recursos.`,
    );

    explanation.push(
      `Costo directo unitario sugerido: ${proposal.summary.suggestedUnitPrice.toFixed(2)} ${proposal.request.currencyCode ?? DEFAULT_CURRENCY_CODE}.`,
    );

    explanation.push(
      `Nivel de confianza: ${Math.round(proposal.confidence * 100)}%.`,
    );

    if (
      proposal.summary.unresolvedResourceCount >
      0
    ) {
      explanation.push(
        `${proposal.summary.unresolvedResourceCount} recurso(s) no fueron vinculados con la biblioteca.`,
      );
    }

    if (proposal.requiresReview) {
      explanation.push(
        "La propuesta requiere revisión antes de incorporarse definitivamente al presupuesto.",
      );
    } else {
      explanation.push(
        "Todos los recursos principales fueron encontrados y tienen información suficiente.",
      );
    }

    return explanation;
  }

  static getResourceTypeLabel(
    type: ResourceType,
  ): string {
    return RESOURCE_TYPE_LABELS[type];
  }
}