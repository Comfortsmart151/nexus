import type { ResourceType } from "@/types/budget";

export interface LibraryResource {
  id: string;
  code: string;
  type: ResourceType;
  name: string;
  unit: string;
  defaultUnitPrice: number;
  description?: string;
  supplier?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLibraryResourceInput {
  code?: string;
  type: ResourceType;
  name: string;
  unit: string;
  defaultUnitPrice: number;
  description?: string;
  supplier?: string;
}

export interface UpdateLibraryResourceInput {
  code?: string;
  name?: string;
  unit?: string;
  defaultUnitPrice?: number;
  description?: string;
  supplier?: string;
  isActive?: boolean;
}