import type { ResourceType } from "@/types/budget";
import type { LibraryResource } from "@/types/library";

export type NexusAiGenerationStatus =
  | "idle"
  | "analyzing"
  | "matching-resources"
  | "generating"
  | "completed"
  | "error";

export type NexusAiConfidenceLevel =
  | "low"
  | "medium"
  | "high";

export type NexusAiSuggestionSource =
  | "knowledge-base"
  | "library"
  | "rule-engine"
  | "ai-provider"
  | "manual";

export type NexusAiConstructionCategory =
  | "preliminaries"
  | "earthworks"
  | "concrete"
  | "reinforcement"
  | "masonry"
  | "plaster"
  | "finishes"
  | "painting"
  | "flooring"
  | "roofing"
  | "carpentry"
  | "metalwork"
  | "plumbing"
  | "electrical"
  | "hvac"
  | "equipment"
  | "landscaping"
  | "demolition"
  | "transport"
  | "cleaning"
  | "general";

export interface NexusAiGenerationRequest {
  description: string;
  unit?: string;
  quantity?: number;
  projectId?: string;
  chapterId?: string;
  countryCode?: string;
  currencyCode?: string;
  includeWaste?: boolean;
  includeTools?: boolean;
  includeTransportation?: boolean;
  preferredCategory?: NexusAiConstructionCategory;
}

export interface NexusAiParsedDescription {
  originalDescription: string;
  normalizedDescription: string;
  detectedCategory: NexusAiConstructionCategory;
  detectedUnit: string;
  detectedQuantity: number;
  keywords: string[];
  measurements: NexusAiDetectedMeasurement[];
  attributes: NexusAiDetectedAttribute[];
  confidence: number;
  confidenceLevel: NexusAiConfidenceLevel;
}

export interface NexusAiDetectedMeasurement {
  label: string;
  value: number;
  unit: string;
  sourceText: string;
}

export interface NexusAiDetectedAttribute {
  key: string;
  label: string;
  value: string;
  sourceText: string;
}

export interface NexusAiKnowledgeRule {
  id: string;
  code: string;
  name: string;
  category: NexusAiConstructionCategory;
  aliases: string[];
  keywords: string[];
  defaultUnit: string;
  description?: string;
  resourceRules: NexusAiResourceRule[];
  assumptions: string[];
  warnings: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NexusAiResourceRule {
  id: string;
  resourceType: ResourceType;
  resourceCode?: string;
  resourceName: string;
  aliases: string[];
  unit: string;
  coefficient: number;
  wastePercentage: number;
  productivity?: number;
  crewSize?: number;
  required: boolean;
  preferredCategory?: string;
  preferredSubcategory?: string;
  notes?: string;
}

export interface NexusAiResourceMatch {
  rule: NexusAiResourceRule;
  resource: LibraryResource | null;
  matchScore: number;
  matchReason: string;
  alternatives: NexusAiResourceAlternative[];
}

export interface NexusAiResourceAlternative {
  resource: LibraryResource;
  matchScore: number;
  matchReason: string;
}

export interface NexusAiApuResourceSuggestion {
  id: string;
  resourceId: string | null;
  resourceCode: string;
  resourceType: ResourceType;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  wastePercentage: number;
  wasteQuantity: number;
  finalQuantity: number;
  subtotal: number;
  source: NexusAiSuggestionSource;
  confidence: number;
  confidenceLevel: NexusAiConfidenceLevel;
  matchReason: string;
  notes?: string;
  requiresReview: boolean;
}

export interface NexusAiApuSummary {
  materialsCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractCost: number;
  directCost: number;
  suggestedUnitPrice: number;
  resourceCount: number;
  unresolvedResourceCount: number;
}

export interface NexusAiApuProposal {
  id: string;
  request: NexusAiGenerationRequest;
  parsedDescription: NexusAiParsedDescription;
  knowledgeRuleId: string | null;
  code: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  category: NexusAiConstructionCategory;
  resources: NexusAiApuResourceSuggestion[];
  assumptions: string[];
  warnings: string[];
  summary: NexusAiApuSummary;
  confidence: number;
  confidenceLevel: NexusAiConfidenceLevel;
  requiresReview: boolean;
  generatedAt: string;
}

export interface NexusAiGenerationError {
  code: string;
  message: string;
  field?: string;
  details?: string;
}

export interface NexusAiGenerationResult {
  success: boolean;
  status: NexusAiGenerationStatus;
  proposal: NexusAiApuProposal | null;
  errors: NexusAiGenerationError[];
  durationMs: number;
}

export interface NexusAiGenerationProgress {
  status: NexusAiGenerationStatus;
  percentage: number;
  message: string;
}

export interface NexusAiCategoryDefinition {
  value: NexusAiConstructionCategory;
  label: string;
  description: string;
}

export const NEXUS_AI_CATEGORY_DEFINITIONS: NexusAiCategoryDefinition[] =
  [
    {
      value: "preliminaries",
      label: "Preliminares",
      description:
        "Instalaciones provisionales, replanteo, movilización y trabajos iniciales.",
    },
    {
      value: "earthworks",
      label: "Movimiento de tierra",
      description:
        "Excavaciones, rellenos, nivelación, compactación y bote de material.",
    },
    {
      value: "concrete",
      label: "Hormigón",
      description:
        "Hormigón estructural, mezclas, vaciados y elementos de concreto.",
    },
    {
      value: "reinforcement",
      label: "Acero de refuerzo",
      description:
        "Suministro, corte, doblado, colocación y amarre de acero.",
    },
    {
      value: "masonry",
      label: "Mampostería",
      description:
        "Muros de bloques, ladrillos, morteros y elementos de mampostería.",
    },
    {
      value: "plaster",
      label: "Pañete y revestimientos",
      description:
        "Pañete, repello, revestimientos cementicios y preparación de superficies.",
    },
    {
      value: "finishes",
      label: "Terminaciones",
      description:
        "Terminaciones generales, detalles y trabajos de acabado.",
    },
    {
      value: "painting",
      label: "Pintura",
      description:
        "Preparación, sellado y aplicación de pinturas y recubrimientos.",
    },
    {
      value: "flooring",
      label: "Pisos",
      description:
        "Cerámicas, porcelanatos, pisos continuos, zócalos y adhesivos.",
    },
    {
      value: "roofing",
      label: "Techos",
      description:
        "Cubiertas, impermeabilización, aislantes y estructuras de techo.",
    },
    {
      value: "carpentry",
      label: "Carpintería",
      description:
        "Puertas, gabinetes, molduras y elementos de madera.",
    },
    {
      value: "metalwork",
      label: "Estructuras metálicas",
      description:
        "Perfiles, soldadura, herrería, barandas y estructuras metálicas.",
    },
    {
      value: "plumbing",
      label: "Instalaciones sanitarias",
      description:
        "Tuberías, piezas, aparatos y sistemas hidrosanitarios.",
    },
    {
      value: "electrical",
      label: "Instalaciones eléctricas",
      description:
        "Canalizaciones, cableado, tableros, salidas y dispositivos eléctricos.",
    },
    {
      value: "hvac",
      label: "Climatización",
      description:
        "Aire acondicionado, ventilación, ductos y equipos HVAC.",
    },
    {
      value: "equipment",
      label: "Equipos",
      description:
        "Instalación, operación o alquiler de equipos y maquinarias.",
    },
    {
      value: "landscaping",
      label: "Paisajismo",
      description:
        "Jardinería, áreas verdes, siembra, riego y mobiliario exterior.",
    },
    {
      value: "demolition",
      label: "Demolición",
      description:
        "Desmontajes, demoliciones, retiro y disposición de escombros.",
    },
    {
      value: "transport",
      label: "Transporte",
      description:
        "Acarreo, movilización y transporte de materiales o equipos.",
    },
    {
      value: "cleaning",
      label: "Limpieza",
      description:
        "Limpieza durante la obra, limpieza final y retiro de residuos.",
    },
    {
      value: "general",
      label: "General",
      description:
        "Partidas que todavía no han sido clasificadas en una categoría específica.",
    },
  ];

export function getNexusAiConfidenceLevel(
  confidence: number,
): NexusAiConfidenceLevel {
  if (confidence >= 0.8) {
    return "high";
  }

  if (confidence >= 0.5) {
    return "medium";
  }

  return "low";
}

export function createEmptyNexusAiApuSummary(): NexusAiApuSummary {
  return {
    materialsCost: 0,
    laborCost: 0,
    equipmentCost: 0,
    subcontractCost: 0,
    directCost: 0,
    suggestedUnitPrice: 0,
    resourceCount: 0,
    unresolvedResourceCount: 0,
  };
}