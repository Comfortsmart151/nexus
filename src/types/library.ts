import type { ResourceType } from "@/types/budget";

export interface LibraryPriceHistoryEntry {
  id: string;
  price: number;
  supplier?: string;
  registeredAt: string;
}

export interface LibraryResource {
  id: string;
  code: string;
  type: ResourceType;
  name: string;
  unit: string;
  defaultUnitPrice: number;

  description?: string;
  supplier?: string;

  category?: string;
  subcategory?: string;
  brand?: string;
  tags: string[];
  observations?: string;

  isFavorite: boolean;
  isActive: boolean;

  priceUpdatedAt: string;
  priceHistory: LibraryPriceHistoryEntry[];

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

  category?: string;
  subcategory?: string;
  brand?: string;
  tags?: string[];
  observations?: string;

  isFavorite?: boolean;
  priceUpdatedAt?: string;
}

export interface UpdateLibraryResourceInput {
  code?: string;
  name?: string;
  unit?: string;
  defaultUnitPrice?: number;

  description?: string;
  supplier?: string;

  category?: string;
  subcategory?: string;
  brand?: string;
  tags?: string[];
  observations?: string;

  isFavorite?: boolean;
  isActive?: boolean;
  priceUpdatedAt?: string;
}