import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import { BudgetService } from "@/services/budget.service";
import { ChapterService } from "@/services/chapter.service";
import { ContractService } from "@/services/contract.service";
import { ItemService } from "@/services/item.service";
import { PlanService } from "@/services/plan.service";
import { ProjectService } from "@/services/project.service";
import type { PlanAnalysis } from "@/types/planAnalysis";

const PLAN_ANALYSES_KEY = "nexus-plan-analyses";

export interface ProjectDeletionSummary {
  chapters: number;
  items: number;
  plans: number;
  contracts: number;
  budgets: number;
}

/**
 * Deletes project-owned data without touching the Master Library or global counters.
 * File blobs are removed from IndexedDB before their metadata disappears.
 */
export class ProjectDeletionService {
  static async deleteProject(projectId: string): Promise<ProjectDeletionSummary> {
    const project = ProjectService.findById(projectId);
    if (!project) throw new Error("El proyecto ya no existe.");

    const chapters = ChapterService.findByProject(projectId);
    const items = ItemService.findByProject(projectId);
    const plans = PlanService.findByProject(projectId);
    const contracts = ContractService.findByProject(projectId);
    const budget = BudgetService.findByProject(projectId);

    // Delete binary attachments first. Their service methods also remove metadata.
    for (const plan of plans) await PlanService.delete(plan.id);
    for (const contract of contracts) await ContractService.delete(contract.id);

    // ItemService.delete cascades each item's APU resources.
    for (const item of items) ItemService.delete(item.id);
    for (const chapter of chapters) ChapterService.delete(chapter.id);
    if (budget) BudgetService.delete(budget.id);

    const analyses = LocalStorageRepository.get<PlanAnalysis[]>(PLAN_ANALYSES_KEY) ?? [];
    LocalStorageRepository.save(
      PLAN_ANALYSES_KEY,
      analyses.filter((analysis) => analysis.projectId !== projectId),
    );

    if (!ProjectService.delete(projectId)) {
      throw new Error("No fue posible eliminar el registro principal del proyecto.");
    }

    return {
      chapters: chapters.length,
      items: items.length,
      plans: plans.length,
      contracts: contracts.length,
      budgets: budget ? 1 : 0,
    };
  }
}
