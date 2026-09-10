import type { LibraryResource } from "@/types/library";

export type LibraryAuditFlag =
  | "validated"
  | "needs-validation"
  | "possible-duplicate"
  | "no-price"
  | "historical-price"
  | "review-unit"
  | "waste-in-name"
  | "review-classification"
  | "data-reviewed"
  | "price-validated";

export interface LibraryAuditResult {
  resourceId: string;
  flags: LibraryAuditFlag[];
  duplicateIds: string[];
}

const GENERIC_CATEGORIES = new Set(["materiales", "banco apu", "", "mano de obra", "equipos"]);
const KNOWN_UNITS = new Set([
  "ud","pza","par","juego","paquete","caja","rollo","funda","saco","cubeta","tarro","lata","plancha","lámina","tubo","barra","varilla",
  "mm","cm","m","km","pulg","pie","pie lineal","cm²","m²","pie²","p²","cm³","m³","pie³","yd³","ml","l","gal","oz",
  "g","kg","lb","qq","ton","hora","día","semana","mes","jornal","h-eq","día-eq","viaje","servicio","global","sg","lote","punto","salida","registro","aparato","puerta","ventana","visita","nivel","m²/uso","m³·km"
]);

export class LibraryAuditService {
  static audit(resources: LibraryResource[]): Map<string, LibraryAuditResult> {
    const groups = new Map<string, LibraryResource[]>();
    for (const resource of resources) {
      const key = `${resource.type}|${this.canonicalName(resource.name)}`;
      const group = groups.get(key) ?? [];
      group.push(resource);
      groups.set(key, group);
    }

    const result = new Map<string, LibraryAuditResult>();
    for (const resource of resources) {
      const flags: LibraryAuditFlag[] = [];
      const key = `${resource.type}|${this.canonicalName(resource.name)}`;
      const duplicates = (groups.get(key) ?? []).filter((item) => item.id !== resource.id);
      const text = `${resource.name} ${resource.description ?? ""} ${resource.observations ?? ""}`.toLowerCase();
      const category = (resource.category ?? "").trim().toLowerCase();
      const importedReference = resource.tags.some((tag) => tag.toLowerCase() === "plantilla-referencia") || text.includes("validar antes de cotizar");
      const historical = text.includes("histórico") || text.includes("historico") || text.includes("precio histórico");
      const wasteInName = /(?:desp(?:erdicio)?\.?|merma)\s*[-+:]?\s*\d+\s*%|\+\s*\d+\s*%\s*(?:desp)?/i.test(resource.name);

      if (resource.defaultUnitPrice <= 0) flags.push("no-price");
      if (importedReference) flags.push("needs-validation");
      if (historical) flags.push("historical-price");
      if (wasteInName) flags.push("waste-in-name");
      if (duplicates.length > 0) flags.push("possible-duplicate");
      if (!KNOWN_UNITS.has(resource.unit.trim().toLowerCase())) flags.push("review-unit");
      if (GENERIC_CATEGORIES.has(category)) flags.push("review-classification");
      if (resource.dataReviewedAt) flags.push("data-reviewed");
      if (resource.priceValidatedAt && resource.defaultUnitPrice > 0) flags.push("price-validated");

      // “Validado” ya no se infiere por ausencia de alertas. Requiere revisión explícita de datos.
      if (resource.dataReviewedAt) flags.push("validated");
      result.set(resource.id, { resourceId: resource.id, flags, duplicateIds: duplicates.map((item) => item.id) });
    }
    return result;
  }

  static canonicalName(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Preserve dimensions/specifications before punctuation cleanup.
      .replace(/(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)/g, "$1_$2_$3")
      .replace(/(\d+)\s*\/\s*(\d+)/g, "$1_$2")
      .replace(/(\d+)\s*[x×]\s*(\d+)/g, "$1x$2")
      .replace(/(?:\+|-)\s*\d+(?:[.,]\d+)?\s*%\s*(?:desp(?:erdicio)?\.?)?/gi, " ")
      .replace(/\b(?:con\s+)?\d+(?:[.,]\d+)?\s*%\s*(?:de\s+)?(?:desp(?:erdicio)?\.?|merma)\b/gi, " ")
      .replace(/\b(?:desp(?:erdicio)?\.?|merma)\s*[-+:]?\s*\d+(?:[.,]\d+)?\s*%/gi, " ")
      .replace(/["'“”]/g, "")
      .replace(/[^a-z0-9_]+/g, " ")
      .trim();
  }
}
