export type ProjectStatus =
  | "draft"
  | "in-progress"
  | "ready"
  | "approved"
  | "archived";

export type ProjectStep =
  | "general"
  | "chapters"
  | "items"
  | "costs"
  | "summary"
  | "completed";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  location: string;
  projectType: string;
  status: ProjectStatus;
  progress: number;
  currentStep: ProjectStep;
  createdAt: string;
  updatedAt: string;
}