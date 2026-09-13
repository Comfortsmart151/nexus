import type { ProjectPriceRegion } from "@/types/construcosto";

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
  clientTaxId?: string;
  clientContact?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  location: string;
  projectType: string;
  priceRegion: ProjectPriceRegion;
  status: ProjectStatus;
  progress: number;
  currentStep: ProjectStep;
  createdAt: string;
  updatedAt: string;
}