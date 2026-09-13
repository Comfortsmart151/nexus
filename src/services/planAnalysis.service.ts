import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import { FileBlobService } from "@/services/fileBlob.service";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import type {
  PlanAnalysis,
  PlanDetectedSpace,
  PlanGeometrySummary,
  PlanItemProposal,
  PlanArchitecturalElement,
  PlanMeasurement,
} from "@/types/planAnalysis";

const KEY = "nexus-plan-analyses";

type PositionedText = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type ParsedPage = {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
  items: PositionedText[];
};

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeUpper(text: string) {
  return normalize(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function number(value: string) {
  return Number(value.replace(",", "."));
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function isNumericDimension(text: string) {
  return /^\d{1,3}(?:[.,]\d{1,4})?$/.test(text.trim());
}

function normalizedAngle(angle: number) {
  let value = angle % 180;
  if (value < 0) value += 180;
  return value;
}

function isHorizontal(item: PositionedText) {
  const a = normalizedAngle(item.rotation);
  return a <= 15 || a >= 165;
}

function isVertical(item: PositionedText) {
  const a = normalizedAngle(item.rotation);
  return a >= 75 && a <= 105;
}

function groupByCoordinate(items: PositionedText[], selector: (item: PositionedText) => number, tolerance = 5) {
  const sorted = [...items].sort((a, b) => selector(a) - selector(b));
  const groups: PositionedText[][] = [];
  for (const item of sorted) {
    const value = selector(item);
    const group = groups.find((g) => Math.abs(selector(g[0]) - value) <= tolerance);
    if (group) group.push(item);
    else groups.push([item]);
  }
  return groups;
}

function mode(values: number[], tolerance = 0.02): { value: number; count: number } | null {
  if (!values.length) return null;
  const buckets: { value: number; values: number[] }[] = [];
  for (const value of values) {
    const bucket = buckets.find((b) => Math.abs(b.value - value) <= tolerance);
    if (bucket) {
      bucket.values.push(value);
      bucket.value = bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length;
    } else buckets.push({ value, values: [value] });
  }
  buckets.sort((a, b) => b.values.length - a.values.length || b.value - a.value);
  return { value: buckets[0].value, count: buckets[0].values.length };
}

const SPACE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "Sala de reuniones", regex: /\bSALA\s+DE\s+REUNIONES\b/g },
  { name: "Recepción", regex: /\bRECEPCION\b/g },
  { name: "Oficina", regex: /\bOFICINA\b/g },
  { name: "Baño", regex: /\b(?:BANO|BANOS)\b/g },
  { name: "Cocina", regex: /\bCOCINA\b/g },
  { name: "Depósito", regex: /\bDEPOSITO\b/g },
  { name: "Pasillo", regex: /\bPASILLO\b/g },
  { name: "Archivo", regex: /\bARCHIVO\b/g },
  { name: "Comedor", regex: /\bCOMEDOR\b/g },
  { name: "Área de trabajo", regex: /\bAREA\s+DE\s+TRABAJO\b/g },
];

function detectSpaces(text: string): PlanDetectedSpace[] {
  const upper = normalizeUpper(text);
  const spaces: PlanDetectedSpace[] = [];
  for (const item of SPACE_PATTERNS) {
    const count = (upper.match(item.regex) ?? []).length;
    if (count > 0) spaces.push({ name: item.name, count });
  }
  return spaces;
}

function planPageScore(page: ParsedPage) {
  const upper = normalizeUpper(page.text);
  let score = 0;
  if (upper.includes("PLANTA DIMENSIONADA")) score += 10;
  else if (upper.includes("PLANTA")) score += 3;
  if (upper.includes("ESC." ) || upper.includes("ESCALA")) score += 2;
  score += Math.min(6, page.items.filter((x) => isNumericDimension(x.text)).length / 8);
  score += Math.min(4, detectSpaces(page.text).reduce((a, b) => a + b.count, 0));
  return score;
}

function detectElevationHeight(pages: ParsedPage[]) {
  const elevationPages = pages.filter((p) => /ELEVACIONES|FRONTAL|POSTERIOR|LAT\.\s*(?:DERECHO|IZQUIERDO)/i.test(p.text));
  let best: { pageNumber: number; height: number; count: number } | null = null;
  for (const page of elevationPages) {
    const candidates = page.items
      .filter((item) => isNumericDimension(item.text) && isVertical(item))
      .map((item) => number(item.text))
      .filter((v) => v >= 2 && v <= 6);
    const common = mode(candidates, 0.03);
    if (common && (!best || common.count > best.count)) best = { pageNumber: page.pageNumber, height: common.value, count: common.count };
  }
  return best;
}

function detectGeometry(pages: ParsedPage[]): PlanGeometrySummary | undefined {
  if (!pages.length) return undefined;
  const page = [...pages].sort((a, b) => planPageScore(b) - planPageScore(a))[0];
  if (planPageScore(page) < 4) return undefined;

  const numeric = page.items.filter((item) => isNumericDimension(item.text));
  const horizontal = numeric.filter(isHorizontal);
  const vertical = numeric.filter(isVertical);
  const hValues = horizontal.map((item) => number(item.text)).filter((v) => v > 0 && v < 100);
  const vValues = vertical.map((item) => number(item.text)).filter((v) => v > 0 && v < 100);

  const lengthCandidates = hValues.filter((v) => v >= 4);
  const overallLength = lengthCandidates.length ? Math.max(...lengthCandidates) : undefined;
  const widthCandidates = vValues.filter((v) => v >= 1.5 && v <= 10);
  const overallWidth = widthCandidates.length ? Math.max(...widthCandidates) : undefined;

  let clearWidth: number | undefined;
  if (overallWidth) {
    const innerWidths = vValues.filter((v) => v >= 1.5 && v < overallWidth - 0.05);
    const repeatedWidth = mode(innerWidths, 0.03);
    if (repeatedWidth && repeatedWidth.count >= 2) clearWidth = repeatedWidth.value;
  }

  const horizontalRows = groupByCoordinate(
    horizontal.filter((item) => {
      const v = number(item.text);
      return v >= 1.5 && (!overallLength || v < overallLength * 0.75);
    }),
    (item) => item.y,
    7,
  );

  const segmentRows = horizontalRows
    .map((group) => ({
      values: group.map((item) => number(item.text)).filter((v) => v >= 1.5),
      y: group.reduce((sum, item) => sum + item.y, 0) / group.length,
    }))
    .filter((row) => row.values.length >= 3)
    .map((row) => ({ ...row, sum: row.values.reduce((a, b) => a + b, 0) }))
    .filter((row) => !overallLength || row.sum <= overallLength * 1.03)
    .sort((a, b) => b.values.length - a.values.length || b.sum - a.sum);

  let horizontalSegments: number[] = [];
  if (segmentRows.length) {
    const bestCount = segmentRows[0].values.length;
    const candidates = segmentRows.filter((row) => row.values.length === bestCount);
    const target = overallLength ?? Math.max(...candidates.map((x) => x.sum));
    candidates.sort((a, b) => Math.abs(target - a.sum) - Math.abs(target - b.sum));
    horizontalSegments = candidates[0].values.map((v) => round(v, 3));
  }

  const spaces = detectSpaces(page.text);
  const roomCount = spaces.reduce((sum, space) => sum + space.count, 0);
  const grossArea = overallLength && overallWidth ? overallLength * overallWidth : undefined;
  const segmentLength = horizontalSegments.reduce((a, b) => a + b, 0);
  const netFloorArea = clearWidth && segmentLength > 0 ? clearWidth * segmentLength : grossArea;
  const exteriorPerimeter = overallLength && overallWidth ? 2 * (overallLength + overallWidth) : undefined;
  const internalPartitionLength = clearWidth && roomCount >= 2 ? clearWidth * (roomCount - 1) : undefined;
  const elevation = detectElevationHeight(pages);
  const grossExteriorWallArea = exteriorPerimeter && elevation ? exteriorPerimeter * elevation.height : undefined;

  const notes: string[] = [];
  if (overallLength && overallWidth) notes.push(`Huella general inferida por cotas maestras: ${round(overallLength, 3)} × ${round(overallWidth, 3)} m.`);
  if (horizontalSegments.length && clearWidth) notes.push(`Área útil inferida por ${horizontalSegments.length} tramos interiores y ancho libre repetido ${round(clearWidth, 3)} m.`);
  if (roomCount) notes.push(`${roomCount} espacios rotulados detectados en la planta.`);
  if (elevation) notes.push(`Altura útil repetida detectada en elevaciones: ${round(elevation.height, 3)} m.`);

  const confidence: "high" | "medium" | "low" = overallLength && overallWidth && clearWidth && horizontalSegments.length >= 3 ? "high" : overallLength && overallWidth ? "medium" : "low";

  return {
    sourcePage: page.pageNumber,
    elevationPage: elevation?.pageNumber,
    overallLength: overallLength ? round(overallLength, 3) : undefined,
    overallWidth: overallWidth ? round(overallWidth, 3) : undefined,
    clearWidth: clearWidth ? round(clearWidth, 3) : undefined,
    clearHeight: elevation ? round(elevation.height, 3) : undefined,
    horizontalSegments,
    grossArea: grossArea ? round(grossArea, 2) : undefined,
    netFloorArea: netFloorArea ? round(netFloorArea, 2) : undefined,
    exteriorPerimeter: exteriorPerimeter ? round(exteriorPerimeter, 2) : undefined,
    internalPartitionLength: internalPartitionLength ? round(internalPartitionLength, 2) : undefined,
    grossExteriorWallArea: grossExteriorWallArea ? round(grossExteriorWallArea, 2) : undefined,
    spaces,
    confidence,
    notes,
  };
}


function countText(text: string, regex: RegExp) {
  return (normalizeUpper(text).match(regex) ?? []).length;
}

function valuesOnPages(pages: ParsedPage[], pageFilter: (p: ParsedPage) => boolean, min: number, max: number) {
  return pages.filter(pageFilter).flatMap((page) => page.items)
    .filter((item) => isNumericDimension(item.text))
    .map((item) => number(item.text))
    .filter((value) => value >= min && value <= max);
}

/**
 * V4.3: reconocimiento conservador de huecos arquitectónicos usando la información
 * vectorial/textual que ya trae el PDF. No inventa elementos cuando el plano no aporta
 * evidencia suficiente. El usuario puede corregir cantidad y dimensiones antes de aceptar.
 */
function detectArchitecturalElements(pages: ParsedPage[], geometry?: PlanGeometrySummary): PlanArchitecturalElement[] {
  const elements: PlanArchitecturalElement[] = [];
  const planPages = pages.filter((p) => /PLANTA/i.test(p.text));
  const elevationPages = pages.filter((p) => /ELEVACIONES|FRONTAL|POSTERIOR|LAT\.\s*(?:DERECHO|IZQUIERDO)/i.test(p.text));

  // Puertas: los rótulos ACCESO del plano dimensionado son una evidencia directa de huecos.
  const accessCount = planPages.reduce((sum, page) => sum + countText(page.text, /\bACCESO\b/g), 0);
  const planWidths = valuesOnPages(planPages, () => true, 0.65, 1.4);
  const oneMetre = planWidths.filter((v) => Math.abs(v - 1) <= 0.03).length;
  const elevationHeights = valuesOnPages(elevationPages, () => true, 1.8, 2.3);
  const doorHeightMode = mode(elevationHeights, 0.03);
  if (accessCount > 0) {
    const sourcePage = planPages.find((p) => /\bACCESO\b/i.test(p.text))?.pageNumber ?? geometry?.sourcePage ?? 1;
    elements.push({
      id: "AE-DOOR-01", type: "door", label: "Puerta de acceso detectada", quantity: accessCount,
      width: oneMetre >= accessCount ? 1 : undefined,
      height: doorHeightMode && doorHeightMode.value >= 1.9 ? round(doorHeightMode.value, 3) : undefined,
      sourcePage,
      source: `${accessCount} rótulo(s) ACCESO en planta${oneMetre >= accessCount ? " · ancho 1.000 m repetido" : ""}${doorHeightMode ? ` · altura candidata ${round(doorHeightMode.value, 3)} m en elevación` : ""}`,
      confidence: oneMetre >= accessCount ? "high" : "medium", confirmed: false,
    });
  }

  // Ventanas: dimensiones explícitas ancho x alto en elevaciones laterales.
  // Se cuentan solo elevaciones que contienen ambos valores, evitando asumir ventanas no acotadas.
  const windowPages = elevationPages.filter((page) => {
    const vals = page.items.filter((i) => isNumericDimension(i.text)).map((i) => number(i.text));
    return vals.some((v) => Math.abs(v - 1.2) <= 0.03) && vals.some((v) => Math.abs(v - 1.5) <= 0.04);
  });
  if (windowPages.length) {
    const widths = valuesOnPages(windowPages, () => true, 0.5, 2.5);
    const heights = valuesOnPages(windowPages, () => true, 0.5, 2.5);
    const widthMatches = widths.filter((v) => Math.abs(v - 1.2) <= 0.03);
    const heightMatches = heights.filter((v) => Math.abs(v - 1.5) <= 0.04);
    const width = widthMatches[0] ?? 1.2;
    const height = heightMatches[0] ?? 1.5;
    const dimensionedCount = Math.max(1, Math.min(widthMatches.length, heightMatches.length));
    elements.push({
      id: "AE-WINDOW-01", type: "window", label: "Ventana dimensionada detectada", quantity: dimensionedCount,
      width: round(width, 3), height: round(height, 3), sourcePage: windowPages[0].pageNumber,
      source: `${dimensionedCount} ventana(s) con cota explícita ${round(width, 3)} × ${round(height, 3)} m en elevaciones`,
      confidence: "high", confirmed: false,
    });
  }
  return elements;
}

function openingArea(elements: PlanArchitecturalElement[]) {
  return round(elements.reduce((sum, e) => sum + (e.width && e.height ? e.quantity * e.width * e.height : 0), 0), 2);
}

export class PlanAnalysisService {
  static find(planId: string): PlanAnalysis | null {
    return (LocalStorageRepository.get<PlanAnalysis[]>(KEY) ?? []).find((x) => x.planId === planId) ?? null;
  }

  static save(value: PlanAnalysis) {
    const all = LocalStorageRepository.get<PlanAnalysis[]>(KEY) ?? [];
    LocalStorageRepository.save(KEY, [value, ...all.filter((x) => x.planId !== value.planId)]);
  }

  static async analyze(planId: string, projectId: string): Promise<PlanAnalysis> {
    const blob = await FileBlobService.get(planId);
    if (!blob) throw new Error("No se encontró el archivo del plano.");
    if (blob.type && blob.type !== "application/pdf") throw new Error("Planos v3 analiza PDF por ahora. Las imágenes rasterizadas requieren la capa de visión.");

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const data = new Uint8Array(await blob.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pages: ParsedPage[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items: PositionedText[] = content.items
        .filter((item): item is typeof item & { str: string; transform: number[]; width: number; height: number } => "str" in item && Array.isArray(item.transform))
        .map((item) => ({
          text: item.str.trim(),
          x: item.transform[4] ?? 0,
          y: item.transform[5] ?? 0,
          width: Number(item.width ?? 0),
          height: Number(item.height ?? 0),
          rotation: Math.atan2(item.transform[1] ?? 0, item.transform[0] ?? 1) * 180 / Math.PI,
        }))
        .filter((item) => item.text.length > 0);
      pages.push({
        pageNumber: p,
        width: viewport.width,
        height: viewport.height,
        text: normalize(items.map((item) => item.text).join(" ")),
        items,
      });
    }

    const text = normalize(pages.map((page) => page.text).join(" "));
    const upper = normalizeUpper(text);
    const scale = text.match(/(?:ESC(?:ALA)?\.?\s*:??\s*)(1\s*:\s*\d+)/i)?.[1]?.replace(/\s/g, "") ?? "No detectada";
    const level = text.match(/(?:NIVEL\s*:?\s*)([^|]{1,30}?)(?=\s{2,}|DISCIPLINA|USO|$)/i)?.[1]?.trim() ?? (upper.includes("PLANTA 1") ? "Planta 1" : "No detectado");
    const discipline = /PLANTA|ELEVACIONES|FACHADA|CORTE|ARQUITECT/i.test(text) ? "Arquitectura" : "Por confirmar";

    const geometry = detectGeometry(pages);
    const architecturalElements = detectArchitecturalElements(pages, geometry);
    const openingsArea = openingArea(architecturalElements);
    const netExteriorWallArea = geometry?.grossExteriorWallArea ? round(Math.max(0, geometry.grossExteriorWallArea - openingsArea), 2) : undefined;
    const measurements: PlanMeasurement[] = [];

    if (geometry?.grossArea) measurements.push({
      id: "M-GROSS",
      label: "Área bruta de huella",
      unit: "m²",
      quantity: geometry.grossArea,
      source: `Cotas maestras de la página ${geometry.sourcePage}: ${geometry.overallLength} × ${geometry.overallWidth} m`,
      confidence: geometry.confidence,
    });
    if (geometry?.netFloorArea) measurements.push({
      id: "M-FLOOR",
      label: "Área útil interior inferida",
      unit: "m²",
      quantity: geometry.netFloorArea,
      source: geometry.horizontalSegments.length
        ? `Tramos interiores (${geometry.horizontalSegments.join(" + ")} m) × ancho libre ${geometry.clearWidth} m`
        : `Derivada de la huella general en página ${geometry.sourcePage}`,
      confidence: geometry.horizontalSegments.length && geometry.clearWidth ? "high" : "medium",
    });
    if (geometry?.exteriorPerimeter) measurements.push({
      id: "M-PERIMETER",
      label: "Perímetro exterior",
      unit: "ml",
      quantity: geometry.exteriorPerimeter,
      source: `2 × (${geometry.overallLength} + ${geometry.overallWidth}) m`,
      confidence: geometry.confidence,
    });
    if (geometry?.clearHeight) measurements.push({
      id: "M-HEIGHT",
      label: "Altura útil detectada",
      unit: "m",
      quantity: geometry.clearHeight,
      source: `Cota vertical repetida en elevaciones, página ${geometry.elevationPage}`,
      confidence: "high",
    });
    const roomCount = geometry?.spaces.reduce((sum, space) => sum + space.count, 0) ?? 0;
    if (roomCount > 0) measurements.push({
      id: "M-ROOMS",
      label: "Espacios rotulados detectados",
      unit: "und",
      quantity: roomCount,
      source: geometry!.spaces.map((space) => `${space.name}: ${space.count}`).join(" · "),
      confidence: "high",
    });
    if (geometry?.internalPartitionLength) measurements.push({
      id: "M-PARTITIONS",
      label: "Longitud base de divisiones interiores",
      unit: "ml",
      quantity: geometry.internalPartitionLength,
      source: `${Math.max(0, roomCount - 1)} divisiones secuenciales × ancho libre ${geometry.clearWidth} m`,
      confidence: "medium",
    });
    if (architecturalElements.length) {
      const doors = architecturalElements.filter((e) => e.type === "door").reduce((a, b) => a + b.quantity, 0);
      const windows = architecturalElements.filter((e) => e.type === "window").reduce((a, b) => a + b.quantity, 0);
      if (doors) measurements.push({ id: "M-DOORS", label: "Puertas detectadas", unit: "und", quantity: doors, source: architecturalElements.filter((e) => e.type === "door").map((e) => e.source).join(" · "), confidence: architecturalElements.find((e) => e.type === "door")?.confidence ?? "medium" });
      if (windows) measurements.push({ id: "M-WINDOWS", label: "Ventanas dimensionadas detectadas", unit: "und", quantity: windows, source: architecturalElements.filter((e) => e.type === "window").map((e) => e.source).join(" · "), confidence: architecturalElements.find((e) => e.type === "window")?.confidence ?? "medium" });
      if (openingsArea > 0) measurements.push({ id: "M-OPENINGS", label: "Área de huecos detectados", unit: "m²", quantity: openingsArea, source: "Puertas/ventanas con dimensiones defendibles", confidence: "medium" });
    }
    if (geometry?.grossExteriorWallArea) measurements.push({
      id: "M-EXT-WALL",
      label: "Área bruta de cerramiento exterior",
      unit: "m²",
      quantity: geometry.grossExteriorWallArea,
      source: `Perímetro ${geometry.exteriorPerimeter} ml × altura ${geometry.clearHeight} m, área bruta antes de huecos`,
      confidence: "medium",
    });

    if (netExteriorWallArea !== undefined && openingsArea > 0) measurements.push({
      id: "M-EXT-WALL-NET", label: "Área neta de cerramiento exterior", unit: "m²", quantity: netExteriorWallArea,
      source: `Área bruta ${geometry?.grossExteriorWallArea} m² − huecos detectados ${openingsArea} m²`, confidence: "medium",
    });

    // Compatibilidad con planos sencillos que sí traen dimensiones explícitas A x B m.
    if (!geometry?.netFloorArea) {
      const dims = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*m\b/g)];
      const areas = dims.map((m) => number(m[1]) * number(m[2])).filter((x) => x > 0 && x < 10000);
      const floorArea = areas.reduce((a, b) => a + b, 0);
      if (floorArea > 0) measurements.push({ id: "M-FLOOR-TEXT", label: "Área útil inferida de dimensiones rotuladas", unit: "m²", quantity: round(floorArea), source: `${dims.length} dimensiones A × B encontradas en texto del PDF`, confidence: "medium" });
    }

    const floorArea = geometry?.netFloorArea ?? measurements.find((m) => m.id === "M-FLOOR-TEXT")?.quantity ?? 0;
    const proposals: PlanItemProposal[] = [];
    if (floorArea > 0) {
      proposals.push({ id: "P-FLOOR", code: "PLN-001", name: "Piso de terminación según plano arquitectónico", unit: "m²", quantity: round(floorArea), rationale: "Área útil interior reconstruida desde la planta dimensionada. La terminación exacta debe confirmarse con especificaciones.", confidence: geometry?.confidence === "high" ? "high" : "medium", decision: "pending" });
      proposals.push({ id: "P-CEIL", code: "PLN-002", name: "Terminación de cielo raso según especificaciones", unit: "m²", quantity: round(floorArea), rationale: "Cantidad base equivalente al área útil interior. El sistema no asume el tipo de cielo sin especificaciones.", confidence: "medium", decision: "pending" });
    }
    if (geometry?.internalPartitionLength) {
      proposals.push({ id: "P-PART", code: "PLN-003", name: "Divisiones interiores según plano arquitectónico", unit: "ml", quantity: geometry.internalPartitionLength, rationale: "Longitud base inferida por la secuencia de espacios de la planta. Material, espesor y composición deben confirmarse antes del APU.", confidence: "medium", decision: "pending" });
    }
    if (geometry?.grossExteriorWallArea) {
      proposals.push({ id: "P-EXT", code: "PLN-004", name: "Terminación exterior de cerramientos según especificaciones", unit: "m²", quantity: netExteriorWallArea ?? geometry.grossExteriorWallArea, rationale: openingsArea > 0 ? `Superficie neta: ${geometry.grossExteriorWallArea} m² brutos menos ${openingsArea} m² de huecos detectados. Confirmar puertas/ventanas antes de incorporar.` : "Superficie bruta de cerramiento exterior. No se detectaron huecos dimensionados suficientes para descontarlos automáticamente.", confidence: openingsArea > 0 ? "medium" : "low", decision: "pending" });
    }
    const doors = architecturalElements.filter((e) => e.type === "door");
    const windows = architecturalElements.filter((e) => e.type === "window");
    const doorQty = doors.reduce((a, b) => a + b.quantity, 0);
    const windowQty = windows.reduce((a, b) => a + b.quantity, 0);
    if (doorQty) proposals.push({ id: "P-DOORS", code: "PLN-005", name: "Suministro e instalación de puertas según plano", unit: "und", quantity: doorQty, rationale: `Puertas detectadas por rótulos/simbología textual del plano. ${doors.map((e) => e.source).join(" · ")}. Confirmar material y tipo antes del APU.`, confidence: doors.every((e) => e.confidence === "high") ? "high" : "medium", decision: "pending" });
    if (windowQty) proposals.push({ id: "P-WINDOWS", code: "PLN-006", name: "Suministro e instalación de ventanas según plano", unit: "und", quantity: windowQty, rationale: `Ventanas con dimensiones explícitas detectadas en elevaciones. ${windows.map((e) => e.source).join(" · ")}. El conteo es conservador: confirmar ventanas visibles no acotadas.`, confidence: "high", decision: "pending" });

    const warnings = [
      "Las partidas son propuestas y no se incorporan al presupuesto sin aprobación humana.",
      "Planos v4.3 reconstruye cotas por posición del texto del PDF; todavía no interpreta de forma completa líneas, polilíneas, bloques CAD ni símbolos constructivos.",
      openingsArea > 0 ? `Se descontaron provisionalmente ${openingsArea} m² de huecos dimensionados; confirma el conteo de puertas/ventanas antes de incorporar.` : "No se detectaron huecos dimensionados suficientes; las superficies de muros permanecen brutas.",
    ];
    if (scale === "No detectada") warnings.push("No se detectó escala; no deben inferirse longitudes gráficas no rotuladas hasta calibrarla.");
    if (!geometry) warnings.push("No se identificó una planta dimensionada con estructura espacial suficiente.");
    if (!proposals.length) warnings.push("No se encontraron cantidades suficientemente defendibles para generar partidas automáticas.");

    const result: PlanAnalysis = {
      planId,
      projectId,
      status: "review",
      discipline,
      scale,
      level,
      pages: pdf.numPages,
      extractedText: text,
      geometry,
      architecturalElements,
      openingsArea,
      netExteriorWallArea,
      measurements,
      proposals,
      warnings,
      analyzedAt: new Date().toISOString(),
    };
    this.save(result);
    return result;
  }

  static updateArchitecturalElement(planId: string, elementId: string, patch: Partial<Pick<PlanArchitecturalElement, "quantity" | "width" | "height" | "confirmed">>) {
    const analysis = this.find(planId);
    if (!analysis) return null;
    analysis.architecturalElements = (analysis.architecturalElements ?? []).map((e) => e.id === elementId ? {
      ...e, ...patch,
      quantity: patch.quantity !== undefined ? Math.max(0, Number(patch.quantity) || 0) : e.quantity,
      width: patch.width !== undefined ? Math.max(0, Number(patch.width) || 0) : e.width,
      height: patch.height !== undefined ? Math.max(0, Number(patch.height) || 0) : e.height,
    } : e);
    analysis.openingsArea = openingArea(analysis.architecturalElements);
    analysis.netExteriorWallArea = analysis.geometry?.grossExteriorWallArea !== undefined ? round(Math.max(0, analysis.geometry.grossExteriorWallArea - analysis.openingsArea), 2) : undefined;
    const doorQty = analysis.architecturalElements.filter((e) => e.type === "door").reduce((a, b) => a + b.quantity, 0);
    const windowQty = analysis.architecturalElements.filter((e) => e.type === "window").reduce((a, b) => a + b.quantity, 0);
    analysis.proposals = analysis.proposals.map((p) => p.id === "P-DOORS" ? { ...p, quantity: doorQty } : p.id === "P-WINDOWS" ? { ...p, quantity: windowQty } : p.id === "P-EXT" && analysis.netExteriorWallArea !== undefined ? { ...p, quantity: analysis.netExteriorWallArea, rationale: `Superficie neta recalculada: ${analysis.geometry?.grossExteriorWallArea} m² brutos menos ${analysis.openingsArea} m² de huecos.` } : p);
    this.save(analysis);
    return analysis;
  }

  static updateProposal(planId: string, proposalId: string, patch: Partial<Pick<PlanItemProposal, "code" | "name" | "unit" | "quantity" | "wastePercentage" | "priceAdjustmentPercentage" | "manualNote">>) {
    const analysis = this.find(planId);
    if (!analysis) return null;
    analysis.proposals = analysis.proposals.map((p) => p.id === proposalId ? {
      ...p, ...patch,
      quantity: patch.quantity !== undefined ? Math.max(0, Number(patch.quantity) || 0) : p.quantity,
      wastePercentage: patch.wastePercentage !== undefined ? Math.max(0, Number(patch.wastePercentage) || 0) : (p.wastePercentage ?? 0),
      priceAdjustmentPercentage: patch.priceAdjustmentPercentage !== undefined ? Math.max(0, Number(patch.priceAdjustmentPercentage) || 0) : (p.priceAdjustmentPercentage ?? 0),
    } : p);
    this.save(analysis);
    return analysis;
  }

  static setDecision(planId: string, proposalId: string, decision: "accepted" | "rejected") {
    const analysis = this.find(planId);
    if (!analysis) return null;
    analysis.proposals = analysis.proposals.map((p) => p.id === proposalId ? { ...p, decision } : p);
    this.save(analysis);
    return analysis;
  }

  static approveAccepted(planId: string) {
    const analysis = this.find(planId);
    if (!analysis) throw new Error("Análisis no encontrado.");
    const accepted = analysis.proposals.filter((p) => p.decision === "accepted");
    if (!accepted.length) throw new Error("Acepta al menos una partida antes de incorporarla.");

    let chapter = ChapterService.findByProject(analysis.projectId).find((c) => c.name === "Partidas detectadas por planos");
    if (!chapter) chapter = ChapterService.create({ projectId: analysis.projectId, name: "Partidas detectadas por planos", description: "Partidas originadas por análisis de planos y aprobadas por revisión humana." });

    const existing = ItemService.findByChapter(chapter.id);
    for (const p of accepted) {
      if (existing.some((x) => x.description?.includes(`[PLAN:${planId}:${p.id}]`))) continue;
      const waste = Math.max(0, p.wastePercentage ?? 0);
      const adjustedQuantity = p.quantity * (1 + waste / 100);
      ItemService.create({ projectId: analysis.projectId, chapterId: chapter.id, code: p.code, name: p.name, description: `${p.rationale}${p.manualNote ? ` Nota revisión: ${p.manualNote}` : ""} [PLAN:${planId}:${p.id}]`, unit: p.unit, quantity: +adjustedQuantity.toFixed(4), analysisVolume: 1, planWastePercentage: waste, manualPriceAdjustmentPercentage: Math.max(0, p.priceAdjustmentPercentage ?? 0) });
    }
    const approved = { ...analysis, status: "approved" as const, approvedAt: new Date().toISOString() };
    this.save(approved);
    return approved;
  }
}
