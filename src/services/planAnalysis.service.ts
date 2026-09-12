import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import { FileBlobService } from "@/services/fileBlob.service";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import type { PlanAnalysis, PlanItemProposal, PlanMeasurement } from "@/types/planAnalysis";

const KEY = "nexus-plan-analyses";

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function number(value: string) {
  return Number(value.replace(",", "."));
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
    if (blob.type && blob.type !== "application/pdf") throw new Error("Planos v2 analiza PDF por ahora. Las imágenes se incorporarán en la siguiente capa de visión.");

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const data = new Uint8Array(await blob.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const chunks: string[] = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      chunks.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }
    const text = normalize(chunks.join(" "));
    const upper = text.toUpperCase();
    const scale = text.match(/(?:ESCALA(?:\s+GRAFICA)?\s*:?\s*)(1\s*:\s*\d+)/i)?.[1]?.replace(/\s/g, "") ?? "No detectada";
    const level = text.match(/(?:NIVEL\s*:?\s*)([^|]{1,30}?)(?=\s{2,}|DISCIPLINA|USO|$)/i)?.[1]?.trim() ?? (upper.includes("PLANTA 1") ? "Planta 1" : "No detectado");
    const discipline = upper.includes("ARQUITECT") ? "Arquitectura" : "Por confirmar";

    const dims = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*m\b/g)];
    const areas = dims.map((m) => number(m[1]) * number(m[2])).filter((x) => x > 0 && x < 10000);
    const floorArea = areas.reduce((a, b) => a + b, 0);
    const roomCount = (upper.match(/\b(AULA|ADMINISTRACION|BA[NÑ]O|DEPOSITO|PASILLO)\b/g) ?? []).length;

    const measurements: PlanMeasurement[] = [];
    if (floorArea > 0) measurements.push({ id: "M-FLOOR", label: "Área útil inferida de dimensiones rotuladas", unit: "m²", quantity: +floorArea.toFixed(2), source: `${dims.length} dimensiones encontradas en texto del PDF`, confidence: "medium" });
    if (roomCount > 0) measurements.push({ id: "M-ROOMS", label: "Espacios rotulados detectados", unit: "und", quantity: roomCount, source: "Rótulos de espacios del PDF", confidence: "high" });

    const proposals: PlanItemProposal[] = [];
    if (floorArea > 0) {
      proposals.push({ id: "P-FLOOR", code: "PLN-001", name: "Piso de terminación según plano arquitectónico", unit: "m²", quantity: +floorArea.toFixed(2), rationale: "Área inferida de las dimensiones de espacios rotuladas. Terminación exacta requiere especificaciones.", confidence: "medium", decision: "pending" });
      proposals.push({ id: "P-CEIL", code: "PLN-002", name: "Terminación de cielo raso según especificaciones", unit: "m²", quantity: +floorArea.toFixed(2), rationale: "Cantidad base equivalente al área de piso; tipo de cielo requiere plano/especificación correspondiente.", confidence: "low", decision: "pending" });
    }

    const warnings = [
      "Las partidas son propuestas y no se incorporan al presupuesto sin aprobación humana.",
      "La lectura v2 usa texto y cotas disponibles en el PDF; todavía no interpreta geometría vectorial completa ni símbolos constructivos.",
    ];
    if (scale === "No detectada") warnings.push("No se detectó escala; no deben inferirse longitudes gráficas hasta calibrarla.");
    if (!proposals.length) warnings.push("No se encontraron dimensiones suficientes para generar cantidades automáticas.");

    const result: PlanAnalysis = { planId, projectId, status: "review", discipline, scale, level, pages: pdf.numPages, extractedText: text, measurements, proposals, warnings, analyzedAt: new Date().toISOString() };
    this.save(result);
    return result;
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
