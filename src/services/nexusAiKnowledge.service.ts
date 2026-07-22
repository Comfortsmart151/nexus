import {
  INITIAL_NEXUS_AI_KNOWLEDGE_RULES,
} from "@/data/nexus-ai/initialKnowledgeRules";

import type {
  NexusAiConstructionCategory,
  NexusAiKnowledgeRule,
} from "@/types/nexus-ai";

const NEXUS_AI_KNOWLEDGE_STORAGE_KEY =
  "nexus_ai_knowledge_rules";

const NEXUS_AI_KNOWLEDGE_VERSION_KEY =
  "nexus_ai_knowledge_version";

const NEXUS_AI_KNOWLEDGE_VERSION = "1.0.0";

export interface NexusAiKnowledgeSearchOptions {
  category?: NexusAiConstructionCategory;
  activeOnly?: boolean;
  limit?: number;
  minimumScore?: number;
}

export interface NexusAiKnowledgeSearchResult {
  rule: NexusAiKnowledgeRule;
  score: number;
  matchReason: string;
  matchedTerms: string[];
}

export interface CreateNexusAiKnowledgeRuleInput {
  code: string;
  name: string;
  category: NexusAiConstructionCategory;
  aliases?: string[];
  keywords?: string[];
  defaultUnit: string;
  description?: string;
  resourceRules?: NexusAiKnowledgeRule["resourceRules"];
  assumptions?: string[];
  warnings?: string[];
  isActive?: boolean;
}

export interface UpdateNexusAiKnowledgeRuleInput {
  code?: string;
  name?: string;
  category?: NexusAiConstructionCategory;
  aliases?: string[];
  keywords?: string[];
  defaultUnit?: string;
  description?: string;
  resourceRules?: NexusAiKnowledgeRule["resourceRules"];
  assumptions?: string[];
  warnings?: string[];
  isActive?: boolean;
}

export interface NexusAiKnowledgeImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function cloneRule(
  rule: NexusAiKnowledgeRule,
): NexusAiKnowledgeRule {
  return {
    ...rule,
    aliases: [...rule.aliases],
    keywords: [...rule.keywords],
    assumptions: [...rule.assumptions],
    warnings: [...rule.warnings],
    resourceRules: rule.resourceRules.map(
      (resourceRule) => ({
        ...resourceRule,
        aliases: [...resourceRule.aliases],
      }),
    ),
  };
}

function cloneRules(
  rules: NexusAiKnowledgeRule[],
): NexusAiKnowledgeRule[] {
  return rules.map(cloneRule);
}

function generateId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  const timestamp = Date.now().toString(36);
  const random = Math.random()
    .toString(36)
    .slice(2, 10);

  return `${prefix}-${timestamp}-${random}`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function removeAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeNexusAiKnowledgeText(
  value: string,
): string {
  return normalizeWhitespace(
    removeAccents(value)
      .toLowerCase()
      .replace(/[“”„‟]/g, '"')
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[^\p{L}\p{N}"'\s./-]/gu, " ")
      .replace(/\bblocks\b/g, "bloques")
      .replace(/\bblock\b/g, "bloque")
      .replace(/\bhormigon\b/g, "concreto")
      .replace(/\bpañete\b/g, "panete")
      .replace(/\bacrilica\b/g, "acrilico"),
  );
}

export function tokenizeNexusAiKnowledgeText(
  value: string,
): string[] {
  const normalized =
    normalizeNexusAiKnowledgeText(value);

  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set(
      normalized
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2),
    ),
  );
}

function sanitizeStringArray(
  values: string[] | undefined,
): string[] {
  if (!values) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const cleanValue = normalizeWhitespace(value);

    if (!cleanValue) {
      return;
    }

    const normalized =
      normalizeNexusAiKnowledgeText(cleanValue);

    if (seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(cleanValue);
  });

  return result;
}

function sanitizeRule(
  rule: NexusAiKnowledgeRule,
): NexusAiKnowledgeRule {
  return {
    ...rule,
    code: normalizeWhitespace(rule.code),
    name: normalizeWhitespace(rule.name),
    defaultUnit: normalizeWhitespace(rule.defaultUnit),
    description: rule.description
      ? normalizeWhitespace(rule.description)
      : undefined,
    aliases: sanitizeStringArray(rule.aliases),
    keywords: sanitizeStringArray(rule.keywords),
    assumptions: sanitizeStringArray(
      rule.assumptions,
    ),
    warnings: sanitizeStringArray(rule.warnings),
    resourceRules: rule.resourceRules.map(
      (resourceRule) => ({
        ...resourceRule,
        resourceCode: resourceRule.resourceCode
          ? normalizeWhitespace(
              resourceRule.resourceCode,
            )
          : undefined,
        resourceName: normalizeWhitespace(
          resourceRule.resourceName,
        ),
        aliases: sanitizeStringArray(
          resourceRule.aliases,
        ),
        unit: normalizeWhitespace(resourceRule.unit),
        preferredCategory:
          resourceRule.preferredCategory
            ? normalizeWhitespace(
                resourceRule.preferredCategory,
              )
            : undefined,
        preferredSubcategory:
          resourceRule.preferredSubcategory
            ? normalizeWhitespace(
                resourceRule.preferredSubcategory,
              )
            : undefined,
        notes: resourceRule.notes
          ? normalizeWhitespace(resourceRule.notes)
          : undefined,
      }),
    ),
  };
}

function validateRule(
  rule: NexusAiKnowledgeRule,
): string[] {
  const errors: string[] = [];

  if (!rule.id.trim()) {
    errors.push("La regla no tiene un ID válido.");
  }

  if (!rule.code.trim()) {
    errors.push(
      "La regla debe tener un código.",
    );
  }

  if (!rule.name.trim()) {
    errors.push(
      "La regla debe tener un nombre.",
    );
  }

  if (!rule.category) {
    errors.push(
      "La regla debe tener una categoría.",
    );
  }

  if (!rule.defaultUnit.trim()) {
    errors.push(
      "La regla debe tener una unidad predeterminada.",
    );
  }

  if (!Array.isArray(rule.resourceRules)) {
    errors.push(
      "La regla debe contener una lista de recursos.",
    );
  }

  rule.resourceRules.forEach(
    (resourceRule, index) => {
      if (!resourceRule.id.trim()) {
        errors.push(
          `El recurso ${index + 1} no tiene ID.`,
        );
      }

      if (!resourceRule.resourceName.trim()) {
        errors.push(
          `El recurso ${index + 1} no tiene nombre.`,
        );
      }

      if (!resourceRule.unit.trim()) {
        errors.push(
          `El recurso ${index + 1} no tiene unidad.`,
        );
      }

      if (
        !Number.isFinite(
          resourceRule.coefficient,
        ) ||
        resourceRule.coefficient < 0
      ) {
        errors.push(
          `El recurso ${index + 1} tiene un coeficiente inválido.`,
        );
      }

      if (
        !Number.isFinite(
          resourceRule.wastePercentage,
        ) ||
        resourceRule.wastePercentage < 0
      ) {
        errors.push(
          `El recurso ${index + 1} tiene un desperdicio inválido.`,
        );
      }
    },
  );

  return errors;
}

function calculateTokenCoverage(
  queryTokens: string[],
  candidateTokens: string[],
): {
  matches: string[];
  coverage: number;
} {
  if (
    queryTokens.length === 0 ||
    candidateTokens.length === 0
  ) {
    return {
      matches: [],
      coverage: 0,
    };
  }

  const candidateSet = new Set(candidateTokens);

  const matches = queryTokens.filter((token) =>
    candidateSet.has(token),
  );

  return {
    matches,
    coverage: matches.length / queryTokens.length,
  };
}

function calculateRuleSearchScore(
  query: string,
  rule: NexusAiKnowledgeRule,
): NexusAiKnowledgeSearchResult {
  const normalizedQuery =
    normalizeNexusAiKnowledgeText(query);

  const queryTokens =
    tokenizeNexusAiKnowledgeText(query);

  const normalizedName =
    normalizeNexusAiKnowledgeText(rule.name);

  const normalizedCode =
    normalizeNexusAiKnowledgeText(rule.code);

  const normalizedDescription =
    normalizeNexusAiKnowledgeText(
      rule.description ?? "",
    );

  const normalizedAliases = rule.aliases.map(
    normalizeNexusAiKnowledgeText,
  );

  const normalizedKeywords = rule.keywords.map(
    normalizeNexusAiKnowledgeText,
  );

  let score = 0;
  const reasons: string[] = [];
  const matchedTerms = new Set<string>();

  if (!normalizedQuery) {
    return {
      rule,
      score: 0,
      matchReason: "Consulta vacía.",
      matchedTerms: [],
    };
  }

  if (normalizedCode === normalizedQuery) {
    score += 100;
    reasons.push("Coincidencia exacta por código.");
  }

  if (normalizedName === normalizedQuery) {
    score += 95;
    reasons.push("Coincidencia exacta por nombre.");
  }

  const exactAlias = normalizedAliases.find(
    (alias) => alias === normalizedQuery,
  );

  if (exactAlias) {
    score += 90;
    reasons.push("Coincidencia exacta por alias.");
  }

  if (
    normalizedName.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedName)
  ) {
    score += 55;
    reasons.push("Coincidencia parcial por nombre.");
  }

  normalizedAliases.forEach((alias) => {
    if (
      alias.includes(normalizedQuery) ||
      normalizedQuery.includes(alias)
    ) {
      score += 38;
      reasons.push(
        "Coincidencia parcial por alias.",
      );
    }
  });

  normalizedKeywords.forEach((keyword) => {
    if (
      normalizedQuery.includes(keyword) ||
      keyword.includes(normalizedQuery)
    ) {
      score += 18;
      matchedTerms.add(keyword);
    }
  });

  const nameCoverage = calculateTokenCoverage(
    queryTokens,
    tokenizeNexusAiKnowledgeText(rule.name),
  );

  if (nameCoverage.matches.length > 0) {
    score += nameCoverage.coverage * 35;
    reasons.push(
      "Coincidencia de palabras con el nombre.",
    );

    nameCoverage.matches.forEach((term) =>
      matchedTerms.add(term),
    );
  }

  const aliasTokens = tokenizeNexusAiKnowledgeText(
    rule.aliases.join(" "),
  );

  const aliasCoverage = calculateTokenCoverage(
    queryTokens,
    aliasTokens,
  );

  if (aliasCoverage.matches.length > 0) {
    score += aliasCoverage.coverage * 30;
    reasons.push(
      "Coincidencia de palabras con los alias.",
    );

    aliasCoverage.matches.forEach((term) =>
      matchedTerms.add(term),
    );
  }

  const keywordTokens =
    tokenizeNexusAiKnowledgeText(
      rule.keywords.join(" "),
    );

  const keywordCoverage =
    calculateTokenCoverage(
      queryTokens,
      keywordTokens,
    );

  if (keywordCoverage.matches.length > 0) {
    score += keywordCoverage.coverage * 28;
    reasons.push(
      "Coincidencia de palabras clave.",
    );

    keywordCoverage.matches.forEach((term) =>
      matchedTerms.add(term),
    );
  }

  const descriptionCoverage =
    calculateTokenCoverage(
      queryTokens,
      tokenizeNexusAiKnowledgeText(
        normalizedDescription,
      ),
    );

  if (
    descriptionCoverage.matches.length > 0
  ) {
    score += descriptionCoverage.coverage * 12;
    reasons.push(
      "Coincidencia con la descripción.",
    );

    descriptionCoverage.matches.forEach(
      (term) => matchedTerms.add(term),
    );
  }

  const measurementTerms = [
    '6"',
    '8"',
    "6 pulgadas",
    "8 pulgadas",
    "210",
    "3000 psi",
  ];

  measurementTerms.forEach((term) => {
    const normalizedTerm =
      normalizeNexusAiKnowledgeText(term);

    if (
      normalizedQuery.includes(normalizedTerm) &&
      [
        normalizedName,
        ...normalizedAliases,
        ...normalizedKeywords,
        normalizedDescription,
      ].some((candidate) =>
        candidate.includes(normalizedTerm),
      )
    ) {
      score += 25;
      matchedTerms.add(term);
      reasons.push(
        `Coincidencia de especificación: ${term}.`,
      );
    }
  });

  const uniqueReasons = Array.from(
    new Set(reasons),
  );

  return {
    rule,
    score: Number(score.toFixed(2)),
    matchReason:
      uniqueReasons.length > 0
        ? uniqueReasons.join(" ")
        : "Sin coincidencias relevantes.",
    matchedTerms: Array.from(matchedTerms),
  };
}

export class NexusAiKnowledgeService {
  private static memoryRules:
    | NexusAiKnowledgeRule[]
    | null = null;

  private static readStoredRules():
    | NexusAiKnowledgeRule[]
    | null {
    if (!isBrowser()) {
      return this.memoryRules
        ? cloneRules(this.memoryRules)
        : null;
    }

    const storedValue =
      window.localStorage.getItem(
        NEXUS_AI_KNOWLEDGE_STORAGE_KEY,
      );

    if (!storedValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(
        storedValue,
      ) as unknown;

      if (!Array.isArray(parsedValue)) {
        return null;
      }

      const rules = parsedValue
        .filter(
          (
            item,
          ): item is NexusAiKnowledgeRule =>
            Boolean(
              item &&
                typeof item === "object",
            ),
        )
        .map(sanitizeRule);

      return rules;
    } catch {
      return null;
    }
  }

  private static writeRules(
    rules: NexusAiKnowledgeRule[],
  ): void {
    const sanitizedRules =
      rules.map(sanitizeRule);

    this.memoryRules = cloneRules(
      sanitizedRules,
    );

    if (!isBrowser()) {
      return;
    }

    window.localStorage.setItem(
      NEXUS_AI_KNOWLEDGE_STORAGE_KEY,
      JSON.stringify(sanitizedRules),
    );

    window.localStorage.setItem(
      NEXUS_AI_KNOWLEDGE_VERSION_KEY,
      NEXUS_AI_KNOWLEDGE_VERSION,
    );
  }

  private static ensureInitialized(): void {
    const storedRules =
      this.readStoredRules();

    if (
      storedRules &&
      storedRules.length > 0
    ) {
      this.memoryRules =
        cloneRules(storedRules);

      return;
    }

    this.writeRules(
      cloneRules(
        INITIAL_NEXUS_AI_KNOWLEDGE_RULES,
      ),
    );
  }

  private static getMutableRules():
    NexusAiKnowledgeRule[] {
    this.ensureInitialized();

    return (
      this.readStoredRules() ??
      cloneRules(
        INITIAL_NEXUS_AI_KNOWLEDGE_RULES,
      )
    );
  }

  static initialize():
    NexusAiKnowledgeRule[] {
    this.ensureInitialized();
    return this.findAll();
  }

  static seed():
    NexusAiKnowledgeRule[] {
    const currentRules =
      this.readStoredRules() ?? [];

    if (currentRules.length === 0) {
      this.writeRules(
        cloneRules(
          INITIAL_NEXUS_AI_KNOWLEDGE_RULES,
        ),
      );

      return this.findAll();
    }

    const currentCodes = new Set(
      currentRules.map((rule) =>
        normalizeNexusAiKnowledgeText(
          rule.code,
        ),
      ),
    );

    const missingInitialRules =
      INITIAL_NEXUS_AI_KNOWLEDGE_RULES.filter(
        (rule) =>
          !currentCodes.has(
            normalizeNexusAiKnowledgeText(
              rule.code,
            ),
          ),
      );

    if (missingInitialRules.length > 0) {
      this.writeRules([
        ...currentRules,
        ...cloneRules(missingInitialRules),
      ]);
    }

    return this.findAll();
  }

  static findAll(
    activeOnly = false,
  ): NexusAiKnowledgeRule[] {
    const rules = this.getMutableRules();

    return cloneRules(
      rules
        .filter(
          (rule) =>
            !activeOnly || rule.isActive,
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "es",
            {
              sensitivity: "base",
            },
          ),
        ),
    );
  }

  static findActive():
    NexusAiKnowledgeRule[] {
    return this.findAll(true);
  }

  static findById(
    id: string,
  ): NexusAiKnowledgeRule | null {
    const normalizedId = id.trim();

    const rule = this.getMutableRules().find(
      (candidate) =>
        candidate.id === normalizedId,
    );

    return rule ? cloneRule(rule) : null;
  }

  static findByCode(
    code: string,
  ): NexusAiKnowledgeRule | null {
    const normalizedCode =
      normalizeNexusAiKnowledgeText(code);

    const rule = this.getMutableRules().find(
      (candidate) =>
        normalizeNexusAiKnowledgeText(
          candidate.code,
        ) === normalizedCode,
    );

    return rule ? cloneRule(rule) : null;
  }

  static findByCategory(
    category: NexusAiConstructionCategory,
    activeOnly = true,
  ): NexusAiKnowledgeRule[] {
    return cloneRules(
      this.getMutableRules()
        .filter(
          (rule) =>
            rule.category === category &&
            (!activeOnly || rule.isActive),
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "es",
            {
              sensitivity: "base",
            },
          ),
        ),
    );
  }

  static search(
    query: string,
    options: NexusAiKnowledgeSearchOptions = {},
  ): NexusAiKnowledgeSearchResult[] {
    const {
      category,
      activeOnly = true,
      limit = 10,
      minimumScore = 1,
    } = options;

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return [];
    }

    const results = this.getMutableRules()
      .filter(
        (rule) =>
          (!activeOnly || rule.isActive) &&
          (!category ||
            rule.category === category),
      )
      .map((rule) =>
        calculateRuleSearchScore(
          cleanQuery,
          rule,
        ),
      )
      .filter(
        (result) =>
          result.score >= minimumScore,
      )
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.rule.name.localeCompare(
          b.rule.name,
          "es",
          {
            sensitivity: "base",
          },
        );
      })
      .slice(0, Math.max(1, limit));

    return results.map((result) => ({
      ...result,
      rule: cloneRule(result.rule),
      matchedTerms: [
        ...result.matchedTerms,
      ],
    }));
  }

  static findBestMatch(
    query: string,
    options: Omit<
      NexusAiKnowledgeSearchOptions,
      "limit"
    > = {},
  ): NexusAiKnowledgeSearchResult | null {
    const [result] = this.search(query, {
      ...options,
      limit: 1,
    });

    return result ?? null;
  }

  static create(
    input: CreateNexusAiKnowledgeRuleInput,
  ): NexusAiKnowledgeRule {
    const rules = this.getMutableRules();

    const normalizedCode =
      normalizeNexusAiKnowledgeText(
        input.code,
      );

    const duplicatedCode = rules.some(
      (rule) =>
        normalizeNexusAiKnowledgeText(
          rule.code,
        ) === normalizedCode,
    );

    if (duplicatedCode) {
      throw new Error(
        `Ya existe una regla con el código ${input.code}.`,
      );
    }

    const now = new Date().toISOString();

    const rule = sanitizeRule({
      id: generateId("nexus-rule"),
      code: input.code,
      name: input.name,
      category: input.category,
      aliases: input.aliases ?? [],
      keywords: input.keywords ?? [],
      defaultUnit: input.defaultUnit,
      description: input.description,
      resourceRules: (
        input.resourceRules ?? []
      ).map((resourceRule) => ({
        ...resourceRule,
        id:
          resourceRule.id ||
          generateId(
            "nexus-resource-rule",
          ),
        aliases: [
          ...resourceRule.aliases,
        ],
      })),
      assumptions:
        input.assumptions ?? [],
      warnings: input.warnings ?? [],
      isActive: input.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    const errors = validateRule(rule);

    if (errors.length > 0) {
      throw new Error(errors.join(" "));
    }

    this.writeRules([...rules, rule]);

    return cloneRule(rule);
  }

  static update(
    id: string,
    input: UpdateNexusAiKnowledgeRuleInput,
  ): NexusAiKnowledgeRule {
    const rules = this.getMutableRules();

    const index = rules.findIndex(
      (rule) => rule.id === id,
    );

    if (index < 0) {
      throw new Error(
        "La regla de conocimiento no existe.",
      );
    }

    const currentRule = rules[index];

    const nextCode =
      input.code ?? currentRule.code;

    const normalizedNextCode =
      normalizeNexusAiKnowledgeText(
        nextCode,
      );

    const duplicatedCode = rules.some(
      (rule, ruleIndex) =>
        ruleIndex !== index &&
        normalizeNexusAiKnowledgeText(
          rule.code,
        ) === normalizedNextCode,
    );

    if (duplicatedCode) {
      throw new Error(
        `Ya existe una regla con el código ${nextCode}.`,
      );
    }

    const updatedRule = sanitizeRule({
      ...currentRule,
      ...input,
      aliases:
        input.aliases !== undefined
          ? [...input.aliases]
          : [...currentRule.aliases],
      keywords:
        input.keywords !== undefined
          ? [...input.keywords]
          : [...currentRule.keywords],
      assumptions:
        input.assumptions !== undefined
          ? [...input.assumptions]
          : [...currentRule.assumptions],
      warnings:
        input.warnings !== undefined
          ? [...input.warnings]
          : [...currentRule.warnings],
      resourceRules:
        input.resourceRules !== undefined
          ? input.resourceRules.map(
              (resourceRule) => ({
                ...resourceRule,
                id:
                  resourceRule.id ||
                  generateId(
                    "nexus-resource-rule",
                  ),
                aliases: [
                  ...resourceRule.aliases,
                ],
              }),
            )
          : currentRule.resourceRules.map(
              (resourceRule) => ({
                ...resourceRule,
                aliases: [
                  ...resourceRule.aliases,
                ],
              }),
            ),
      updatedAt: new Date().toISOString(),
    });

    const errors =
      validateRule(updatedRule);

    if (errors.length > 0) {
      throw new Error(errors.join(" "));
    }

    rules[index] = updatedRule;

    this.writeRules(rules);

    return cloneRule(updatedRule);
  }

  static setActive(
    id: string,
    isActive: boolean,
  ): NexusAiKnowledgeRule {
    return this.update(id, {
      isActive,
    });
  }

  static delete(id: string): boolean {
    const rules = this.getMutableRules();

    const filteredRules = rules.filter(
      (rule) => rule.id !== id,
    );

    if (
      filteredRules.length === rules.length
    ) {
      return false;
    }

    this.writeRules(filteredRules);
    return true;
  }

  static duplicate(
    id: string,
  ): NexusAiKnowledgeRule {
    const sourceRule = this.findById(id);

    if (!sourceRule) {
      throw new Error(
        "La regla que deseas duplicar no existe.",
      );
    }

    const baseCode = `${sourceRule.code}-COPIA`;
    let nextCode = baseCode;
    let counter = 2;

    while (this.findByCode(nextCode)) {
      nextCode = `${baseCode}-${counter}`;
      counter += 1;
    }

    return this.create({
      code: nextCode,
      name: `${sourceRule.name} - Copia`,
      category: sourceRule.category,
      aliases: [...sourceRule.aliases],
      keywords: [...sourceRule.keywords],
      defaultUnit:
        sourceRule.defaultUnit,
      description:
        sourceRule.description,
      resourceRules:
        sourceRule.resourceRules.map(
          (resourceRule) => ({
            ...resourceRule,
            id: generateId(
              "nexus-resource-rule",
            ),
            aliases: [
              ...resourceRule.aliases,
            ],
          }),
        ),
      assumptions: [
        ...sourceRule.assumptions,
      ],
      warnings: [...sourceRule.warnings],
      isActive: false,
    });
  }

  static resetToInitial():
    NexusAiKnowledgeRule[] {
    this.writeRules(
      cloneRules(
        INITIAL_NEXUS_AI_KNOWLEDGE_RULES,
      ),
    );

    return this.findAll();
  }

  static clear(): void {
    this.memoryRules = [];

    if (!isBrowser()) {
      return;
    }

    window.localStorage.removeItem(
      NEXUS_AI_KNOWLEDGE_STORAGE_KEY,
    );

    window.localStorage.removeItem(
      NEXUS_AI_KNOWLEDGE_VERSION_KEY,
    );
  }

  static exportAsJson(): string {
    return JSON.stringify(
      {
        version:
          NEXUS_AI_KNOWLEDGE_VERSION,
        exportedAt:
          new Date().toISOString(),
        rules: this.findAll(),
      },
      null,
      2,
    );
  }

  static importFromJson(
    json: string,
    replaceExisting = false,
  ): NexusAiKnowledgeImportResult {
    const result: NexusAiKnowledgeImportResult =
      {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

    let parsed: unknown;

    try {
      parsed = JSON.parse(json);
    } catch {
      result.errors.push(
        "El archivo JSON no tiene un formato válido.",
      );

      return result;
    }

    let incomingRules: unknown[] = [];

    if (Array.isArray(parsed)) {
      incomingRules = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      "rules" in parsed &&
      Array.isArray(
        (parsed as { rules?: unknown })
          .rules,
      )
    ) {
      incomingRules = (
        parsed as { rules: unknown[] }
      ).rules;
    } else {
      result.errors.push(
        "El JSON no contiene una lista válida de reglas.",
      );

      return result;
    }

    const existingRules =
      replaceExisting
        ? []
        : this.getMutableRules();

    const finalRules =
      cloneRules(existingRules);

    incomingRules.forEach(
      (item, index) => {
        try {
          if (
            !item ||
            typeof item !== "object"
          ) {
            throw new Error(
              "La entrada no es un objeto válido.",
            );
          }

          const incoming =
            sanitizeRule(
              item as NexusAiKnowledgeRule,
            );

          const validationErrors =
            validateRule(incoming);

          if (
            validationErrors.length > 0
          ) {
            throw new Error(
              validationErrors.join(" "),
            );
          }

          const existingIndex =
            finalRules.findIndex(
              (rule) =>
                normalizeNexusAiKnowledgeText(
                  rule.code,
                ) ===
                normalizeNexusAiKnowledgeText(
                  incoming.code,
                ),
            );

          if (existingIndex >= 0) {
            finalRules[existingIndex] = {
              ...incoming,
              id:
                finalRules[existingIndex]
                  .id,
              createdAt:
                finalRules[existingIndex]
                  .createdAt,
              updatedAt:
                new Date().toISOString(),
            };

            result.updated += 1;
            return;
          }

          finalRules.push({
            ...incoming,
            id:
              incoming.id ||
              generateId("nexus-rule"),
            createdAt:
              incoming.createdAt ||
              new Date().toISOString(),
            updatedAt:
              new Date().toISOString(),
          });

          result.imported += 1;
        } catch (error) {
          result.skipped += 1;

          const message =
            error instanceof Error
              ? error.message
              : "Error desconocido.";

          result.errors.push(
            `Regla ${index + 1}: ${message}`,
          );
        }
      },
    );

    if (
      result.imported > 0 ||
      result.updated > 0 ||
      replaceExisting
    ) {
      this.writeRules(finalRules);
    }

    return result;
  }

  static getStatistics(): {
    total: number;
    active: number;
    inactive: number;
    resourceRules: number;
    categories: Partial<
      Record<
        NexusAiConstructionCategory,
        number
      >
    >;
  } {
    const rules = this.findAll();

    const categories: Partial<
      Record<
        NexusAiConstructionCategory,
        number
      >
    > = {};

    rules.forEach((rule) => {
      categories[rule.category] =
        (categories[rule.category] ?? 0) +
        1;
    });

    return {
      total: rules.length,
      active: rules.filter(
        (rule) => rule.isActive,
      ).length,
      inactive: rules.filter(
        (rule) => !rule.isActive,
      ).length,
      resourceRules: rules.reduce(
        (total, rule) =>
          total +
          rule.resourceRules.length,
        0,
      ),
      categories,
    };
  }

  static getStorageVersion(): string {
    if (!isBrowser()) {
      return NEXUS_AI_KNOWLEDGE_VERSION;
    }

    return (
      window.localStorage.getItem(
        NEXUS_AI_KNOWLEDGE_VERSION_KEY,
      ) ?? NEXUS_AI_KNOWLEDGE_VERSION
    );
  }
}