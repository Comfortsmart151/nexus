import { ProjectService } from "@/services/project.service";
import type {
  Project,
  ProjectStep,
} from "@/types/project";

const STEP_PROGRESS: Record<ProjectStep, number> = {
  general: 0,
  chapters: 20,
  items: 40,
  costs: 60,
  summary: 80,
  completed: 100,
};

const NEXT_STEP: Record<ProjectStep, ProjectStep> = {
  general: "chapters",
  chapters: "items",
  items: "costs",
  costs: "summary",
  summary: "completed",
  completed: "completed",
};

export class NexusEngine {
  static getProject(projectId: string): Project | null {
    return ProjectService.findById(projectId);
  }

  static getNextStep(projectId: string): ProjectStep | null {
    const project = ProjectService.findById(projectId);

    if (!project) return null;

    return NEXT_STEP[project.currentStep];
  }

  static completeCurrentStep(projectId: string): Project | null {
    const project = ProjectService.findById(projectId);

    if (!project) return null;

    const nextStep = NEXT_STEP[project.currentStep];
    const nextProgress = STEP_PROGRESS[nextStep];

    return ProjectService.updateProgress(
      projectId,
      nextProgress,
      nextStep,
    );
  }

  static moveProjectToStep(
    projectId: string,
    step: ProjectStep,
  ): Project | null {
    return ProjectService.updateProgress(
      projectId,
      STEP_PROGRESS[step],
      step,
    );
  }

  static isProjectReady(projectId: string): boolean {
    const project = ProjectService.findById(projectId);

    return Boolean(
      project &&
        project.progress === 100 &&
        project.currentStep === "completed",
    );
  }
}