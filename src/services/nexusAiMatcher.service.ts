import { LibraryService } from "@/services/library.service";
import {
  normalizeNexusAiKnowledgeText,
  tokenizeNexusAiKnowledgeText,
} from "@/services/nexusAiKnowledge.service";

import type { ResourceType } from "@/types/budget";
import type { LibraryResource } from "@/types/library";
import type {
  NexusAiKnowledgeRule,
  NexusAiResourceAlternative,
  NexusAiResourceMatch,
  NexusAiResourceRule,
} from "@/types/nexus-ai";

const DEFAULT_MINIMUM_MATCH_SCORE = 35;
const DEFAULT_ALTERNATIVES_LIMIT = 3;

export interface NexusAiMatcherOptions {
  minimumScore?: number;
  alternativesLimit?: number;
  includeInactiveResources?: boolean;
  requireSameType?: boolean;
  requireCompatibleUnit?: boolean;
}

export interface NexusAiKnowledgeRuleMatchResult {
  knowledgeRule: NexusAiKnowledgeRule;
  matches: NexusAiResourceMatch[];
  matchedCount: number;
  unresolvedCount: number;
  requiredMatchedCount: number;
  requiredUnresolvedCount: number;
  averageScore: number;
  completenessPercentage: number;
  canGenerateApu: boolean;
}

export interface NexusAiMatcherStatistics {
  totalRules: number;
  matchedRules: number;
  unresolvedRules: number;
  requiredRules: number;
  requiredMatchedRules: number;
  requiredUnresolvedRules: number;
  averageScore: number;
  completenessPercentage: number;
}

interface ResourceScoreResult {
  resource: LibraryResource;
  score: number;
  reasons: string[];
}

interface UnitDefinition {
  canonical: string;
  aliases: string[];
}

const UNIT_DEFINITIONS: UnitDefinition[] = [
  {
    canonical: "ud",
    aliases: [
      "ud",
      "u",
      "unidad",
      "unidades",
      "und",
      "pieza",
      "piezas",
    ],
  },
  {
    canonical: "m",
    aliases: [
      "m",
      "metro",
      "metros",
      "ml",
      "metro lineal",
      "metros lineales",
    ],
  },
  {
    canonical: "m²",
    aliases: [
      "m2",
      "m²",
      "metro cuadrado",
      "metros cuadrados",
    ],
  },
  {
    canonical: "m³",
    aliases: [
      "m3",
      "m³",
      "metro cubico",
      "metros cubicos",
      "metro cúbico",
      "metros cúbicos",
    ],
  },
  {
    canonical: "kg",
    aliases: [
      "kg",
      "kgs",
      "kilogramo",
      "kilogramos",
      "kilo",
      "kilos",
    ],
  },
  {
    canonical: "lb",
    aliases: [
      "lb",
      "lbs",
      "libra",
      "libras",
    ],
  },
  {
    canonical: "ton",
    aliases: [
      "ton",
      "tonelada",
      "toneladas",
      "t",
    ],
  },
  {
    canonical: "gal",
    aliases: [
      "gal",
      "galon",
      "galones",
      "galón",
      "galón americano",
    ],
  },
  {
    canonical: "litro",
    aliases: [
      "l",
      "lt",
      "lts",
      "litro",
      "litros",
    ],
  },
  {
    canonical: "funda",
    aliases: [
      "funda",
      "fundas",
      "saco",
      "sacos",
      "bolsa",
      "bolsas",
    ],
  },
  {
    canonical: "rollo",
    aliases: [
      "rollo",
      "rollos",
    ],
  },
  {
    canonical: "día",
    aliases: [
      "dia",
      "día",
      "dias",
      "días",
      "jornada",
      "jornadas",
    ],
  },
  {
    canonical: "jornal",
    aliases: [
      "jornal",
      "jornales",
      "dia hombre",
      "día hombre",
    ],
  },
  {
    canonical: "hora",
    aliases: [
      "hora",
      "horas",
      "hr",
      "hrs",
    ],
  },
  {
    canonical: "global",
    aliases: [
      "global",
      "gl",
      "suma global",
      "lote",
    ],
  },
];

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

function round(
  value: number,
  decimals = 2,
): number {
  const factor = 10 ** decimals;

  return (
    Math.round(
      (value + Number.EPSILON) * factor,
    ) / factor
  );
}

function normalizeUnit(unit: string): string {
  const normalizedUnit =
    normalizeNexusAiKnowledgeText(unit);

  if (!normalizedUnit) {
    return "";
  }

  const definition = UNIT_DEFINITIONS.find(
    (candidate) =>
      candidate.aliases.some(
        (alias) =>
          normalizeNexusAiKnowledgeText(alias) ===
          normalizedUnit,
      ),
  );

  return definition?.canonical ?? normalizedUnit;
}

function areUnitsCompatible(
  firstUnit: string,
  secondUnit: string,
): boolean {
  const first = normalizeUnit(firstUnit);
  const second = normalizeUnit(secondUnit);

  if (!first || !second) {
    return true;
  }

  if (first === second) {
    return true;
  }

  const dayUnits = new Set([
    "día",
    "jornal",
  ]);

  if (
    dayUnits.has(first) &&
    dayUnits.has(second)
  ) {
    return true;
  }

  return false;
}

function normalizeCode(value: string): string {
  return normalizeNexusAiKnowledgeText(value)
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getResourceSearchText(
  resource: LibraryResource,
): string {
  return [
    resource.code,
    resource.name,
    resource.description,
    resource.category,
    resource.subcategory,
    resource.brand,
    resource.supplier,
    ...(resource.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function getRuleSearchTerms(
  rule: NexusAiResourceRule,
): string[] {
  return Array.from(
    new Set(
      [
        rule.resourceName,
        rule.resourceCode ?? "",
        ...rule.aliases,
        rule.preferredCategory ?? "",
        rule.preferredSubcategory ?? "",
      ]
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function calculateTokenCoverage(
  sourceTokens: string[],
  targetTokens: string[],
): {
  matches: string[];
  coverage: number;
} {
  if (
    sourceTokens.length === 0 ||
    targetTokens.length === 0
  ) {
    return {
      matches: [],
      coverage: 0,
    };
  }

  const targetSet = new Set(targetTokens);

  const matches = sourceTokens.filter(
    (token) => targetSet.has(token),
  );

  return {
    matches,
    coverage:
      matches.length / sourceTokens.length,
  };
}

function calculatePartialTokenCoverage(
  sourceTokens: string[],
  targetTokens: string[],
): number {
  if (
    sourceTokens.length === 0 ||
    targetTokens.length === 0
  ) {
    return 0;
  }

  let matchedCount = 0;

  sourceTokens.forEach((sourceToken) => {
    const matched = targetTokens.some(
      (targetToken) => {
        if (
          sourceToken.length < 4 ||
          targetToken.length < 4
        ) {
          return false;
        }

        return (
          sourceToken.includes(targetToken) ||
          targetToken.includes(sourceToken)
        );
      },
    );

    if (matched) {
      matchedCount += 1;
    }
  });

  return matchedCount / sourceTokens.length;
}

function scoreResource(
  rule: NexusAiResourceRule,
  resource: LibraryResource,
  requireSameType: boolean,
  requireCompatibleUnit: boolean,
): ResourceScoreResult {
  const reasons: string[] = [];
  let score = 0;

  if (resource.type !== rule.resourceType) {
    if (requireSameType) {
      return {
        resource,
        score: 0,
        reasons: [
          "El tipo del recurso no coincide.",
        ],
      };
    }

    score -= 30;
  } else {
    score += 15;
    reasons.push(
      "Coincide el tipo de recurso.",
    );
  }

  const compatibleUnit = areUnitsCompatible(
    rule.unit,
    resource.unit,
  );

  if (
    requireCompatibleUnit &&
    !compatibleUnit
  ) {
    return {
      resource,
      score: 0,
      reasons: [
        "La unidad del recurso no es compatible.",
      ],
    };
  }

  if (compatibleUnit) {
    score += 10;
    reasons.push("La unidad es compatible.");
  } else {
    score -= 8;
  }

  const normalizedRuleCode =
    normalizeCode(rule.resourceCode ?? "");

  const normalizedResourceCode =
    normalizeCode(resource.code);

  if (
    normalizedRuleCode &&
    normalizedResourceCode &&
    normalizedRuleCode ===
      normalizedResourceCode
  ) {
    score += 60;
    reasons.push(
      "Coincidencia exacta por código.",
    );
  }

  const normalizedRuleName =
    normalizeNexusAiKnowledgeText(
      rule.resourceName,
    );

  const normalizedResourceName =
    normalizeNexusAiKnowledgeText(
      resource.name,
    );

  if (
    normalizedRuleName &&
    normalizedRuleName ===
      normalizedResourceName
  ) {
    score += 55;
    reasons.push(
      "Coincidencia exacta por nombre.",
    );
  } else if (
    normalizedRuleName &&
    normalizedResourceName &&
    (
      normalizedRuleName.includes(
        normalizedResourceName,
      ) ||
      normalizedResourceName.includes(
        normalizedRuleName,
      )
    )
  ) {
    score += 35;
    reasons.push(
      "Coincidencia parcial por nombre.",
    );
  }

  const normalizedAliases =
    rule.aliases.map(
      normalizeNexusAiKnowledgeText,
    );

  const exactAlias =
    normalizedAliases.find(
      (alias) =>
        alias === normalizedResourceName,
    );

  if (exactAlias) {
    score += 48;
    reasons.push(
      "Coincidencia exacta con un alias.",
    );
  }

  const partialAlias =
    normalizedAliases.find(
      (alias) =>
        alias.length >= 3 &&
        (
          normalizedResourceName.includes(
            alias,
          ) ||
          alias.includes(
            normalizedResourceName,
          )
        ),
    );

  if (partialAlias && !exactAlias) {
    score += 28;
    reasons.push(
      "Coincidencia parcial con un alias.",
    );
  }

  const ruleTokens =
    tokenizeNexusAiKnowledgeText(
      getRuleSearchTerms(rule).join(" "),
    );

  const resourceTokens =
    tokenizeNexusAiKnowledgeText(
      getResourceSearchText(resource),
    );

  const tokenCoverage =
    calculateTokenCoverage(
      ruleTokens,
      resourceTokens,
    );

  if (tokenCoverage.coverage > 0) {
    score += tokenCoverage.coverage * 30;

    reasons.push(
      `Coincidencia de términos: ${tokenCoverage.matches.join(", ")}.`,
    );
  }

  const partialTokenCoverage =
    calculatePartialTokenCoverage(
      ruleTokens,
      resourceTokens,
    );

  if (partialTokenCoverage > 0) {
    score += partialTokenCoverage * 12;
    reasons.push(
      "Coincidencia parcial de palabras.",
    );
  }

  const preferredCategory =
    normalizeNexusAiKnowledgeText(
      rule.preferredCategory ?? "",
    );

  const resourceCategory =
    normalizeNexusAiKnowledgeText(
      resource.category ?? "",
    );

  if (
    preferredCategory &&
    resourceCategory &&
    preferredCategory === resourceCategory
  ) {
    score += 12;
    reasons.push(
      "Coincide la categoría preferida.",
    );
  } else if (
    preferredCategory &&
    resourceCategory &&
    (
      preferredCategory.includes(
        resourceCategory,
      ) ||
      resourceCategory.includes(
        preferredCategory,
      )
    )
  ) {
    score += 7;
    reasons.push(
      "La categoría es parcialmente compatible.",
    );
  }

  const preferredSubcategory =
    normalizeNexusAiKnowledgeText(
      rule.preferredSubcategory ?? "",
    );

  const resourceSubcategory =
    normalizeNexusAiKnowledgeText(
      resource.subcategory ?? "",
    );

  if (
    preferredSubcategory &&
    resourceSubcategory &&
    preferredSubcategory ===
      resourceSubcategory
  ) {
    score += 10;
    reasons.push(
      "Coincide la subcategoría preferida.",
    );
  } else if (
    preferredSubcategory &&
    resourceSubcategory &&
    (
      preferredSubcategory.includes(
        resourceSubcategory,
      ) ||
      resourceSubcategory.includes(
        preferredSubcategory,
      )
    )
  ) {
    score += 5;
    reasons.push(
      "La subcategoría es parcialmente compatible.",
    );
  }

  if (resource.isFavorite) {
    score += 2;
    reasons.push(
      "El recurso está marcado como favorito.",
    );
  }

  if (
    Number.isFinite(
      resource.defaultUnitPrice,
    ) &&
    resource.defaultUnitPrice > 0
  ) {
    score += 3;
    reasons.push(
      "El recurso tiene precio registrado.",
    );
  }

  return {
    resource,
    score: round(
      clamp(score, 0, 100),
    ),
    reasons: Array.from(
      new Set(reasons),
    ),
  };
}

function createAlternative(
  result: ResourceScoreResult,
): NexusAiResourceAlternative {
  return {
    resource: result.resource,
    matchScore: result.score,
    matchReason:
      result.reasons.length > 0
        ? result.reasons.join(" ")
        : "Coincidencia aproximada.",
  };
}

function createUnresolvedMatch(
  rule: NexusAiResourceRule,
  alternatives: NexusAiResourceAlternative[],
): NexusAiResourceMatch {
  return {
    rule,
    resource: null,
    matchScore: 0,
    matchReason: rule.required
      ? "No se encontró un recurso suficientemente compatible. Requiere revisión."
      : "No se encontró un recurso opcional suficientemente compatible.",
    alternatives,
  };
}

function getResources(
  includeInactiveResources: boolean,
): LibraryResource[] {
  return includeInactiveResources
    ? LibraryService.findAll()
    : LibraryService.findActive();
}

export class NexusAiMatcherService {
  static matchResourceRule(
    rule: NexusAiResourceRule,
    options: NexusAiMatcherOptions = {},
  ): NexusAiResourceMatch {
    const {
      minimumScore =
        DEFAULT_MINIMUM_MATCH_SCORE,
      alternativesLimit =
        DEFAULT_ALTERNATIVES_LIMIT,
      includeInactiveResources = false,
      requireSameType = true,
      requireCompatibleUnit = false,
    } = options;

    const resources = getResources(
      includeInactiveResources,
    );

    return this.matchResourceRuleAgainstResources(
      rule,
      resources,
      {
        minimumScore,
        alternativesLimit,
        includeInactiveResources,
        requireSameType,
        requireCompatibleUnit,
      },
    );
  }

  static matchResourceRuleAgainstResources(
    rule: NexusAiResourceRule,
    resources: LibraryResource[],
    options: NexusAiMatcherOptions = {},
  ): NexusAiResourceMatch {
    const {
      minimumScore =
        DEFAULT_MINIMUM_MATCH_SCORE,
      alternativesLimit =
        DEFAULT_ALTERNATIVES_LIMIT,
      requireSameType = true,
      requireCompatibleUnit = false,
    } = options;

    const scoredResources = resources
      .filter(
        (resource) =>
          !requireSameType ||
          resource.type === rule.resourceType,
      )
      .map((resource) =>
        scoreResource(
          rule,
          resource,
          requireSameType,
          requireCompatibleUnit,
        ),
      )
      .filter(
        (result) => result.score > 0,
      )
      .sort((first, second) => {
        if (
          second.score !== first.score
        ) {
          return second.score - first.score;
        }

        return first.resource.name.localeCompare(
          second.resource.name,
          "es",
          {
            sensitivity: "base",
          },
        );
      });

    const bestResult =
      scoredResources[0] ?? null;

    const alternativeResults =
      scoredResources
        .slice(
          bestResult ? 1 : 0,
          bestResult
            ? alternativesLimit + 1
            : alternativesLimit,
        )
        .map(createAlternative);

    if (
      !bestResult ||
      bestResult.score < minimumScore
    ) {
      const unresolvedAlternatives =
        scoredResources
          .slice(0, alternativesLimit)
          .map(createAlternative);

      return createUnresolvedMatch(
        rule,
        unresolvedAlternatives,
      );
    }

    return {
      rule,
      resource: bestResult.resource,
      matchScore: bestResult.score,
      matchReason:
        bestResult.reasons.length > 0
          ? bestResult.reasons.join(" ")
          : "Recurso compatible encontrado.",
      alternatives: alternativeResults,
    };
  }

  static matchKnowledgeRule(
    knowledgeRule: NexusAiKnowledgeRule,
    options: NexusAiMatcherOptions = {},
  ): NexusAiKnowledgeRuleMatchResult {
    const resources = getResources(
      options.includeInactiveResources ??
        false,
    );

    const matches =
      knowledgeRule.resourceRules.map(
        (resourceRule) =>
          this.matchResourceRuleAgainstResources(
            resourceRule,
            resources,
            options,
          ),
      );

    const statistics =
      this.getMatchStatistics(matches);

    return {
      knowledgeRule,
      matches,
      matchedCount:
        statistics.matchedRules,
      unresolvedCount:
        statistics.unresolvedRules,
      requiredMatchedCount:
        statistics.requiredMatchedRules,
      requiredUnresolvedCount:
        statistics.requiredUnresolvedRules,
      averageScore:
        statistics.averageScore,
      completenessPercentage:
        statistics.completenessPercentage,
      canGenerateApu:
        statistics.requiredUnresolvedRules ===
        0,
    };
  }

  static matchKnowledgeRules(
    knowledgeRules: NexusAiKnowledgeRule[],
    options: NexusAiMatcherOptions = {},
  ): NexusAiKnowledgeRuleMatchResult[] {
    return knowledgeRules.map(
      (knowledgeRule) =>
        this.matchKnowledgeRule(
          knowledgeRule,
          options,
        ),
    );
  }

  static findAlternatives(
    rule: NexusAiResourceRule,
    limit = DEFAULT_ALTERNATIVES_LIMIT,
    options: Omit<
      NexusAiMatcherOptions,
      "alternativesLimit"
    > = {},
  ): NexusAiResourceAlternative[] {
    const resources = getResources(
      options.includeInactiveResources ??
        false,
    );

    return resources
      .filter(
        (resource) =>
          options.requireSameType === false ||
          resource.type === rule.resourceType,
      )
      .map((resource) =>
        scoreResource(
          rule,
          resource,
          options.requireSameType ?? true,
          options.requireCompatibleUnit ??
            false,
        ),
      )
      .filter(
        (result) => result.score > 0,
      )
      .sort(
        (first, second) =>
          second.score - first.score,
      )
      .slice(0, Math.max(1, limit))
      .map(createAlternative);
  }

  static findSimilarLibraryResources(
    query: string,
    type?: ResourceType,
    limit = 10,
  ): LibraryResource[] {
    const normalizedQuery =
      normalizeNexusAiKnowledgeText(query);

    if (!normalizedQuery) {
      return [];
    }

    const queryTokens =
      tokenizeNexusAiKnowledgeText(query);

    const resources = type
      ? LibraryService.findByType(type)
      : LibraryService.findActive();

    return resources
      .map((resource) => {
        const normalizedResourceText =
          normalizeNexusAiKnowledgeText(
            getResourceSearchText(resource),
          );

        const resourceTokens =
          tokenizeNexusAiKnowledgeText(
            normalizedResourceText,
          );

        let score = 0;

        if (
          normalizeNexusAiKnowledgeText(
            resource.name,
          ) === normalizedQuery
        ) {
          score += 100;
        } else if (
          normalizedResourceText.includes(
            normalizedQuery,
          )
        ) {
          score += 55;
        }

        const coverage =
          calculateTokenCoverage(
            queryTokens,
            resourceTokens,
          );

        score += coverage.coverage * 40;

        const partialCoverage =
          calculatePartialTokenCoverage(
            queryTokens,
            resourceTokens,
          );

        score += partialCoverage * 20;

        return {
          resource,
          score,
        };
      })
      .filter(
        (result) => result.score > 0,
      )
      .sort(
        (first, second) =>
          second.score - first.score,
      )
      .slice(0, Math.max(1, limit))
      .map((result) => result.resource);
  }

  static getMatchStatistics(
    matches: NexusAiResourceMatch[],
  ): NexusAiMatcherStatistics {
    const totalRules = matches.length;

    const matchedRules =
      matches.filter(
        (match) => Boolean(match.resource),
      ).length;

    const unresolvedRules =
      totalRules - matchedRules;

    const requiredMatches =
      matches.filter(
        (match) => match.rule.required,
      );

    const requiredRules =
      requiredMatches.length;

    const requiredMatchedRules =
      requiredMatches.filter(
        (match) => Boolean(match.resource),
      ).length;

    const requiredUnresolvedRules =
      requiredRules -
      requiredMatchedRules;

    const matchedScores = matches
      .filter(
        (match) => Boolean(match.resource),
      )
      .map((match) => match.matchScore);

    const averageScore =
      matchedScores.length > 0
        ? round(
            matchedScores.reduce(
              (total, score) =>
                total + score,
              0,
            ) / matchedScores.length,
          )
        : 0;

    const completenessPercentage =
      totalRules > 0
        ? round(
            (matchedRules / totalRules) *
              100,
          )
        : 0;

    return {
      totalRules,
      matchedRules,
      unresolvedRules,
      requiredRules,
      requiredMatchedRules,
      requiredUnresolvedRules,
      averageScore,
      completenessPercentage,
    };
  }

  static hasMinimumRequiredMatches(
    matches: NexusAiResourceMatch[],
  ): boolean {
    return matches
      .filter(
        (match) => match.rule.required,
      )
      .every(
        (match) => Boolean(match.resource),
      );
  }
}