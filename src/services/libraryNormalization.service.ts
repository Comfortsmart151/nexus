import type { LibraryResource, UpdateLibraryResourceInput } from "@/types/library";

export type NormalizationKind = "source" | "waste" | "classification";
export type NormalizationConfidence = "high" | "medium";

export interface LibraryNormalizationProposal {
  id: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  kind: NormalizationKind;
  confidence: NormalizationConfidence;
  summary: string;
  changes: UpdateLibraryResourceInput;
}

const CATEGORY_RULES: Array<{ pattern: RegExp; category: string; subcategory?: string }> = [
  { pattern: /cemento\s+pvc|pegamento\s+pvc|adhesivo\s+pvc/i, category: "PLOMERÍA", subcategory: "ADHESIVOS PVC" },
  { pattern: /abrazadera|tuber[ií]a|codo|tee\b|niple|reducci[oó]n|v[aá]lvula|sif[oó]n|desag[uü]e/i, category: "PLOMERÍA", subcategory: "ACCESORIOS" },
  { pattern: /interruptor|tomacorriente|timbre|breaker|alambre\s+#?\d+\s*(?:tw|thhn)|cable|conduit|caja\s+(?:rectangular|octagonal)/i, category: "ELECTRICIDAD", subcategory: "ACCESORIOS Y CONDUCTORES" },
  { pattern: /acero|varilla|malla\s+electro|alambre\s+dulce/i, category: "ACERO Y REFUERZO" },
  { pattern: /cemento\s+(?:gris|blanco)|arena|grava|block|bloque|mortero|hormig[oó]n/i, category: "ALBAÑILERÍA & HORMIGÓN" },
  { pattern: /cer[aá]mica|porcelanato|adoqu[ií]n|z[oó]calo|contrahuella|piso/i, category: "PISOS & REVESTIMIENTOS" },
  { pattern: /pintura|primer|sellador|masilla|estuco|stucco|yeso/i, category: "PINTURA & TERMINACIONES" },
  { pattern: /madera|plywood|playwood|clavo|bisagra|puerta|cerradura/i, category: "CARPINTERÍA & HERRAJES" },
];

export class LibraryNormalizationService {
  static proposals(resources: LibraryResource[]): LibraryNormalizationProposal[] {
    const proposals: LibraryNormalizationProposal[] = [];
    for (const resource of resources) {
      const category = (resource.category ?? "").trim();
      const source = resource.source?.trim() ?? "";

      if (category.toLowerCase() === "banco apu" && !source) {
        proposals.push({
          id: `${resource.id}:source`, resourceId: resource.id, resourceCode: resource.code,
          resourceName: resource.name, kind: "source", confidence: "high",
          summary: "Mover “Banco APU” de clasificación a Fuente",
          changes: { source: "Banco APU", category: "" },
        });
      }

      const waste = this.extractWaste(resource.name);
      if (waste && resource.suggestedWastePercent == null) {
        proposals.push({
          id: `${resource.id}:waste`, resourceId: resource.id, resourceCode: resource.code,
          resourceName: resource.name, kind: "waste", confidence: "high",
          summary: `Extraer ${waste.percent}% de desperdicio y limpiar el nombre`,
          changes: { name: waste.cleanName, suggestedWastePercent: waste.percent },
        });
      }

      if (["", "materiales", "banco apu", "mano de obra", "equipos"].includes(category.toLowerCase())) {
        const cleanName = waste?.cleanName ?? resource.name;
        const inferred = CATEGORY_RULES.find((rule) => rule.pattern.test(cleanName));
        if (inferred) {
          proposals.push({
            id: `${resource.id}:classification`, resourceId: resource.id, resourceCode: resource.code,
            resourceName: resource.name, kind: "classification", confidence: "high",
            summary: `${category || "Sin clasificación"} → ${inferred.category}${inferred.subcategory ? ` / ${inferred.subcategory}` : ""}`,
            changes: { category: inferred.category, subcategory: inferred.subcategory ?? resource.subcategory ?? "", ...(category.toLowerCase() === "banco apu" && !source ? { source: "Banco APU" } : {}) },
          });
        }
      }
    }
    return proposals;
  }

  static extractWaste(name: string): { percent: number; cleanName: string } | null {
    const patterns = [
      /\s*(?:\+|-)?\s*(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s+)?(?:desp(?:erdicio)?\.?|merma)\b/gi,
      /\s*(?:con\s+)?(?:desp(?:erdicio)?\.?|merma)\s*[-+:]?\s*(\d+(?:[.,]\d+)?)\s*%/gi,
    ];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(name);
      if (!match) continue;
      const percent = Number(match[1].replace(",", "."));
      if (!Number.isFinite(percent)) return null;
      const cleanName = name.replace(pattern, " ").replace(/\s{2,}/g, " ").replace(/[+\-]\s*$/g, "").trim();
      return { percent, cleanName };
    }
    return null;
  }
}
