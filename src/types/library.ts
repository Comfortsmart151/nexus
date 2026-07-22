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

/*
|--------------------------------------------------------------------------
| Importación de recursos
|--------------------------------------------------------------------------
*/

export type LibraryImportFileType = "xlsx" | "csv";

export type LibraryImportRowStatus =
  | "valid"
  | "warning"
  | "error"
  | "duplicate";

export type LibraryImportDuplicateStrategy =
  | "skip"
  | "update"
  | "create";

export type LibraryImportColumnKey =
  | "code"
  | "type"
  | "name"
  | "unit"
  | "price"
  | "category"
  | "subcategory"
  | "brand"
  | "supplier"
  | "description"
  | "tags"
  | "observations"
  | "favorite";

export interface LibraryImportRawRow {
  rowNumber: number;

  code?: unknown;
  type?: unknown;
  name?: unknown;
  unit?: unknown;
  price?: unknown;

  category?: unknown;
  subcategory?: unknown;
  brand?: unknown;
  supplier?: unknown;

  description?: unknown;
  tags?: unknown;
  observations?: unknown;
  favorite?: unknown;
}

export interface LibraryImportResourceInput {
  rowNumber: number;

  code: string;
  type: ResourceType;
  name: string;
  unit: string;
  defaultUnitPrice: number;

  category: string;
  subcategory: string;
  brand: string;
  supplier: string;

  description: string;
  tags: string[];
  observations: string;

  isFavorite: boolean;
}

export type LibraryImportValidationField =
  | keyof LibraryImportResourceInput
  | "general";

export interface LibraryImportValidationIssue {
  field: LibraryImportValidationField;
  message: string;
}

export interface LibraryImportDuplicateMatch {
  id: string;
  code: string;
  name: string;
}

export interface LibraryImportPreviewRow {
  rowNumber: number;
  status: LibraryImportRowStatus;

  resource: LibraryImportResourceInput | null;

  errors: LibraryImportValidationIssue[];
  warnings: LibraryImportValidationIssue[];

  duplicate: LibraryImportDuplicateMatch | null;
  duplicateStrategy: LibraryImportDuplicateStrategy;
}

export interface LibraryImportPreview {
  fileName: string;
  fileType: LibraryImportFileType;

  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;

  rows: LibraryImportPreviewRow[];
}

export interface LibraryImportExecutionError {
  rowNumber: number;
  message: string;
}

export interface LibraryImportResult {
  totalProcessed: number;

  created: number;
  updated: number;
  skipped: number;
  failed: number;

  errors: LibraryImportExecutionError[];
}

export interface LibraryImportColumnDefinition {
  key: LibraryImportColumnKey;
  label: string;
  required: boolean;
  aliases: string[];
}

export const LIBRARY_IMPORT_COLUMNS: LibraryImportColumnDefinition[] =
  [
    {
      key: "code",
      label: "Código",
      required: false,
      aliases: [
        "codigo",
        "código",
        "code",
        "cod",
        "id recurso",
        "id del recurso",
      ],
    },
    {
      key: "type",
      label: "Tipo",
      required: true,
      aliases: [
        "tipo",
        "type",
        "tipo de recurso",
        "resource type",
        "clasificacion",
        "clasificación",
      ],
    },
    {
      key: "name",
      label: "Nombre",
      required: true,
      aliases: [
        "nombre",
        "name",
        "recurso",
        "nombre del recurso",
        "descripcion corta",
        "descripción corta",
      ],
    },
    {
      key: "unit",
      label: "Unidad",
      required: true,
      aliases: [
        "unidad",
        "unit",
        "ud",
        "unidad de medida",
        "medida",
      ],
    },
    {
      key: "price",
      label: "Precio",
      required: true,
      aliases: [
        "precio",
        "price",
        "precio base",
        "precio unitario",
        "costo",
        "cost",
        "costo unitario",
        "valor",
      ],
    },
    {
      key: "category",
      label: "Categoría",
      required: false,
      aliases: [
        "categoria",
        "categoría",
        "category",
        "familia",
      ],
    },
    {
      key: "subcategory",
      label: "Subcategoría",
      required: false,
      aliases: [
        "subcategoria",
        "subcategoría",
        "subcategory",
        "sub categoria",
        "sub categoría",
      ],
    },
    {
      key: "brand",
      label: "Marca",
      required: false,
      aliases: ["marca", "brand", "fabricante"],
    },
    {
      key: "supplier",
      label: "Proveedor",
      required: false,
      aliases: [
        "proveedor",
        "supplier",
        "suplidor",
        "referencia",
        "fuente",
      ],
    },
    {
      key: "description",
      label: "Descripción",
      required: false,
      aliases: [
        "descripcion",
        "descripción",
        "description",
        "detalle",
        "detalles",
      ],
    },
    {
      key: "tags",
      label: "Etiquetas",
      required: false,
      aliases: [
        "etiquetas",
        "tags",
        "tag",
        "palabras clave",
        "keywords",
      ],
    },
    {
      key: "observations",
      label: "Observaciones",
      required: false,
      aliases: [
        "observaciones",
        "observacion",
        "observación",
        "notas",
        "notes",
        "comentarios",
      ],
    },
    {
      key: "favorite",
      label: "Favorito",
      required: false,
      aliases: [
        "favorito",
        "favorite",
        "destacado",
        "es favorito",
        "is favorite",
      ],
    },
  ];