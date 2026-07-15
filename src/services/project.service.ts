import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import type {
  Project,
  ProjectStatus,
  ProjectStep,
} from "@/types/project";
import { generateProjectId } from "@/utils/idGenerator";

const PROJECTS_KEY = "nexus-projects";
const PROJECT_COUNTER_KEY = "nexus-project-counter";

export interface CreateProjectInput {
  name: string;
  client: string;
  location: string;
  projectType: string;
}

export interface UpdateProjectInput {
  name?: string;
  client?: string;
  location?: string;
  projectType?: string;
  status?: ProjectStatus;
  progress?: number;
  currentStep?: ProjectStep;
}

export class ProjectService {
  static findAll(): Project[] {
    const storedProjects =
      LocalStorageRepository.get<Partial<Project>[]>(PROJECTS_KEY) ?? [];

    const normalizedProjects = storedProjects.map((project, index) =>
      ProjectService.normalizeProject(project, index),
    );

    LocalStorageRepository.save(PROJECTS_KEY, normalizedProjects);

    return normalizedProjects;
  }

  static findById(projectId: string): Project | null {
    return (
      ProjectService.findAll().find(
        (project) => project.id === projectId,
      ) ?? null
    );
  }

  static create(input: CreateProjectInput): Project {
    const projects = ProjectService.findAll();

    const storedCounter =
      LocalStorageRepository.get<number>(PROJECT_COUNTER_KEY) ?? 0;

    const inferredCounter = ProjectService.getHighestProjectNumber(projects);
    const nextCounter = Math.max(storedCounter, inferredCounter) + 1;

    const projectId = generateProjectId(nextCounter);
    const now = new Date().toISOString();

    const project: Project = {
      id: projectId,
      code: projectId,
      name: input.name.trim(),
      client: input.client.trim(),
      location: input.location.trim(),
      projectType: input.projectType.trim(),
      status: "in-progress",
      progress: 20,
      currentStep: "chapters",
      createdAt: now,
      updatedAt: now,
    };

    LocalStorageRepository.save(PROJECTS_KEY, [project, ...projects]);
    LocalStorageRepository.save(PROJECT_COUNTER_KEY, nextCounter);

    return project;
  }

  static update(
    projectId: string,
    input: UpdateProjectInput,
  ): Project | null {
    const projects = ProjectService.findAll();

    const projectIndex = projects.findIndex(
      (project) => project.id === projectId,
    );

    if (projectIndex === -1) return null;

    const currentProject = projects[projectIndex];

    const updatedProject: Project = {
      ...currentProject,
      name: input.name?.trim() ?? currentProject.name,
      client: input.client?.trim() ?? currentProject.client,
      location: input.location?.trim() ?? currentProject.location,
      projectType:
        input.projectType?.trim() ?? currentProject.projectType,
      status: input.status ?? currentProject.status,
      progress:
        input.progress !== undefined
          ? ProjectService.clampProgress(input.progress)
          : currentProject.progress,
      currentStep: input.currentStep ?? currentProject.currentStep,
      updatedAt: new Date().toISOString(),
    };

    projects[projectIndex] = updatedProject;
    LocalStorageRepository.save(PROJECTS_KEY, projects);

    return updatedProject;
  }

  static updateProgress(
    projectId: string,
    progress: number,
    currentStep: ProjectStep,
  ): Project | null {
    const normalizedProgress =
      ProjectService.clampProgress(progress);

    const status: ProjectStatus =
      normalizedProgress >= 100 ? "ready" : "in-progress";

    return ProjectService.update(projectId, {
      progress: normalizedProgress,
      currentStep,
      status,
    });
  }

  static delete(projectId: string): boolean {
    const projects = ProjectService.findAll();

    const filteredProjects = projects.filter(
      (project) => project.id !== projectId,
    );

    if (filteredProjects.length === projects.length) {
      return false;
    }

    LocalStorageRepository.save(PROJECTS_KEY, filteredProjects);

    return true;
  }

  private static normalizeProject(
    project: Partial<Project>,
    index: number,
  ): Project {
    const fallbackNumber = index + 1;
    const fallbackId = generateProjectId(fallbackNumber);
    const now = new Date().toISOString();

    const id = project.id || fallbackId;

    return {
      id,
      code: project.code || id,
      name: project.name?.trim() || "Proyecto sin nombre",
      client: project.client?.trim() || "Cliente no especificado",
      location:
        project.location?.trim() || "Ubicación no especificada",
      projectType:
        project.projectType?.trim() || "Tipo no especificado",
      status: project.status || "in-progress",
      progress: ProjectService.clampProgress(
        project.progress ?? 20,
      ),
      currentStep: project.currentStep || "chapters",
      createdAt: project.createdAt || now,
      updatedAt: project.updatedAt || project.createdAt || now,
    };
  }

  private static clampProgress(progress: number): number {
    return Math.min(100, Math.max(0, Math.round(progress)));
  }

  private static getHighestProjectNumber(
    projects: Project[],
  ): number {
    return projects.reduce((highest, project) => {
      const match = project.id.match(/^PRJ-(\d+)$/);

      if (!match) return highest;

      return Math.max(highest, Number(match[1]));
    }, 0);
  }
}