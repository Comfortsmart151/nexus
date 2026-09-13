import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { PlanService } from "@/services/plan.service";
import { ResourceService } from "@/services/resource.service";
import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import type { PlanAnalysis } from "@/types/planAnalysis";
import type { ProjectReviewIssue, ProjectReviewResult } from "@/types/projectReview";

export class ProjectReviewService {
  static run(projectId: string): ProjectReviewResult {
    const chapters = ChapterService.findByProject(projectId);
    const items = ItemService.findByProject(projectId);
    const resources = ResourceService.findAll().filter((r) => items.some((i) => i.id === r.itemId));
    const chapterIds = new Set(chapters.map((c) => c.id));
    const plans = PlanService.findByProject(projectId);
    const analyses = (LocalStorageRepository.get<PlanAnalysis[]>("nexus-plan-analyses") ?? []).filter((a) => a.projectId === projectId);
    const issues: ProjectReviewIssue[] = [];
    const push = (issue: ProjectReviewIssue) => issues.push(issue);

    if (!chapters.length) push({ id:"no-chapters", severity:"critical", title:"Proyecto sin capítulos", detail:"Crea la estructura del presupuesto antes de finalizar.", href:`/projects/${projectId}/chapters` });
    if (!items.length) push({ id:"no-items", severity:"critical", title:"Proyecto sin partidas", detail:"No hay actividades presupuestables registradas.", href:`/projects/${projectId}/items` });

    items.forEach((item) => {
      const href = chapterIds.has(item.chapterId) ? `/projects/${projectId}/chapters/${item.chapterId}/items/${item.id}` : `/projects/${projectId}/analyses`;
      if (!chapterIds.has(item.chapterId)) push({ id:`orphan-${item.id}`, severity:"critical", title:`${item.code ?? "Partida"} sin capítulo válido`, detail:item.name, href, entity:item.id });
      if (item.quantity <= 0) push({ id:`qty-${item.id}`, severity:"critical", title:`Cantidad en cero: ${item.name}`, detail:"Define una cantidad mayor que cero.", href, entity:item.id });
      if (item.status !== "priced" || item.unitPrice <= 0) push({ id:`price-${item.id}`, severity:"critical", title:`APU pendiente: ${item.name}`, detail:"La partida todavía no tiene precio unitario valorizado.", href, entity:item.id });
      if ((item.manualPriceAdjustmentPercentage ?? 0) > 0) push({ id:`manual-${item.id}`, severity:"warning", title:`Ajuste manual en ${item.name}`, detail:`Incremento manual ${item.manualPriceAdjustmentPercentage}% sobre el APU.`, href, entity:item.id });
    });

    resources.forEach((resource) => {
      const item = items.find((i) => i.id === resource.itemId);
      if (!item) return;
      const href = chapterIds.has(item.chapterId) ? `/projects/${projectId}/chapters/${item.chapterId}/items/${item.id}` : `/projects/${projectId}/analyses`;
      if (resource.unitPrice <= 0 || resource.priceStatus === "missing") push({ id:`r0-${resource.id}`, severity:"critical", title:`Recurso sin precio: ${resource.name}`, detail:`Partida: ${item.name}`, href, entity:resource.id });
      else if (resource.priceStatus === "referential") push({ id:`ref-${resource.id}`, severity:"warning", title:`Precio referencial: ${resource.name}`, detail:`${resource.priceSource ?? "Fuente no indicada"}${resource.priceSourceDate ? ` · ${resource.priceSourceDate}` : ""}`, href, entity:resource.id });
      if ((resource.priceConfidence ?? "").toLowerCase().includes("low") || (resource.priceConfidence ?? "").toLowerCase().includes("baj")) push({ id:`conf-${resource.id}`, severity:"warning", title:`Confianza baja: ${resource.name}`, detail:"Conviene validar el mapeo o precio antes de emitir el presupuesto.", href, entity:resource.id });
    });

    analyses.forEach((analysis) => {
      const pendingProps = analysis.proposals.filter((p) => p.decision === "pending").length;
      const unconfirmedOpenings = (analysis.architecturalElements ?? []).filter((e) => !e.confirmed).length;
      if (pendingProps) push({ id:`plan-prop-${analysis.planId}`, severity:"warning", title:`${pendingProps} propuesta(s) de plano sin decidir`, detail:"Revisa las partidas detectadas antes de cerrar el presupuesto.", href:`/projects/${projectId}/plans/${analysis.planId}/analysis` });
      if (unconfirmedOpenings) push({ id:`open-${analysis.planId}`, severity:"warning", title:`${unconfirmedOpenings} puerta(s)/ventana(s) sin confirmar`, detail:"Las mediciones de huecos aún requieren revisión humana.", href:`/projects/${projectId}/plans/${analysis.planId}/analysis` });
    });

    if (!plans.length) push({ id:"no-plan", severity:"warning", title:"Proyecto sin planos asociados", detail:"No es obligatorio, pero no existe trazabilidad de mediciones desde planos.", href:`/projects/${projectId}/plans` });

    const critical = issues.filter((i) => i.severity === "critical").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    const checks = Math.max(1, items.length * 3 + resources.length + analyses.length * 2 + 3);
    const deductions = critical * 4 + warnings;
    const score = Math.max(0, Math.min(100, Math.round(100 - (deductions / checks) * 100)));
    const passed = Math.max(0, checks - critical - warnings);
    return { score, critical, warnings, passed, issues, generatedAt:new Date().toISOString() };
  }
}
