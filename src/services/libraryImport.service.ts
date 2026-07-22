import * as XLSX from "xlsx";

import { LibraryService } from "@/services/library.service";

import {
  LIBRARY_IMPORT_COLUMNS,
  type LibraryImportColumnKey,
  type LibraryImportDuplicateStrategy,
  type LibraryImportFileType,
  type LibraryImportPreview,
  type LibraryImportPreviewRow,
  type LibraryImportRawRow,
  type LibraryImportResourceInput,
  type LibraryImportResult,
  type LibraryImportValidationIssue,
  type LibraryResource,
} from "@/types/library";

import type { ResourceType } from "@/types/budget";

type SpreadsheetRow = Record<string, unknown>;

interface ImportExecutionOptions {
  rows: LibraryImportPreviewRow[];
}

const VALID_RESOURCE_TYPES: ResourceType[] = [
  "material",
  "labor",
  "equipment",
  "subcontract",
];

export const LibraryImportService = {
  async createPreview(file: File): Promise<LibraryImportPreview> {
    const fileType = getFileType(file);
    const spreadsheetRows = await readSpreadsheet(file);

    const existingResources = LibraryService.findActive();

    const rows = spreadsheetRows.map((spreadsheetRow, index) => {
      const rawRow = mapSpreadsheetRow(
        spreadsheetRow,
        index + 2,
      );

      return validateRow(rawRow, existingResources);
    });

    return {
      fileName: file.name,
      fileType,
      totalRows: rows.length,
      validRows: rows.filter(
        (row) => row.status === "valid",
      ).length,
      warningRows: rows.filter(
        (row) => row.status === "warning",
      ).length,
      errorRows: rows.filter(
        (row) => row.status === "error",
      ).length,
      duplicateRows: rows.filter(
        (row) => row.status === "duplicate",
      ).length,
      rows,
    };
  },

  updateDuplicateStrategy(
    preview: LibraryImportPreview,
    rowNumber: number,
    strategy: LibraryImportDuplicateStrategy,
  ): LibraryImportPreview {
    const rows = preview.rows.map((row) => {
      if (row.rowNumber !== rowNumber) {
        return row;
      }

      return {
        ...row,
        duplicateStrategy: strategy,
      };
    });

    return recalculatePreview(preview, rows);
  },

  updateAllDuplicateStrategies(
    preview: LibraryImportPreview,
    strategy: LibraryImportDuplicateStrategy,
  ): LibraryImportPreview {
    const rows = preview.rows.map((row) => {
      if (!row.duplicate) {
        return row;
      }

      return {
        ...row,
        duplicateStrategy: strategy,
      };
    });

    return recalculatePreview(preview, rows);
  },

  executeImport({
    rows,
  }: ImportExecutionOptions): LibraryImportResult {
    const result: LibraryImportResult = {
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const row of rows) {
      if (row.status === "error" || !row.resource) {
        result.failed += 1;

        result.errors.push({
          rowNumber: row.rowNumber,
          message:
            row.errors.map((error) => error.message).join(". ") ||
            "La fila contiene errores de validación.",
        });

        continue;
      }

      result.totalProcessed += 1;

      try {
        if (row.duplicate) {
          processDuplicateRow(row, result);
          continue;
        }

        createResource(row.resource);
        result.created += 1;
      } catch (error) {
        result.failed += 1;

        result.errors.push({
          rowNumber: row.rowNumber,
          message:
            error instanceof Error
              ? error.message
              : "No fue posible importar el recurso.",
        });
      }
    }

    return result;
  },
};

async function readSpreadsheet(
  file: File,
): Promise<SpreadsheetRow[]> {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    raw: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error(
      "El archivo no contiene ninguna hoja disponible.",
    );
  }

  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error(
      "No fue posible leer la primera hoja del archivo.",
    );
  }

  const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(
    worksheet,
    {
      defval: "",
      raw: false,
    },
  );

  if (rows.length === 0) {
    throw new Error(
      "El archivo no contiene recursos para importar.",
    );
  }

  return rows;
}

function getFileType(file: File): LibraryImportFileType {
  const extension = file.name
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase();

  if (extension === "csv") {
    return "csv";
  }

  if (extension === "xlsx" || extension === "xls") {
    return "xlsx";
  }

  throw new Error(
    "Formato no compatible. Selecciona un archivo XLSX, XLS o CSV.",
  );
}

function mapSpreadsheetRow(
  row: SpreadsheetRow,
  rowNumber: number,
): LibraryImportRawRow {
  const normalizedRow = normalizeSpreadsheetHeaders(row);

  return {
    rowNumber,
    code: normalizedRow.code,
    type: normalizedRow.type,
    name: normalizedRow.name,
    unit: normalizedRow.unit,
    price: normalizedRow.price,
    category: normalizedRow.category,
    subcategory: normalizedRow.subcategory,
    brand: normalizedRow.brand,
    supplier: normalizedRow.supplier,
    description: normalizedRow.description,
    tags: normalizedRow.tags,
    observations: normalizedRow.observations,
    favorite: normalizedRow.favorite,
  };
}

function normalizeSpreadsheetHeaders(
  row: SpreadsheetRow,
): Partial<Record<LibraryImportColumnKey, unknown>> {
  const normalizedRow: Partial<
    Record<LibraryImportColumnKey, unknown>
  > = {};

  for (const [header, value] of Object.entries(row)) {
    const normalizedHeader = normalizeText(header);

    const columnDefinition = LIBRARY_IMPORT_COLUMNS.find(
      (column) =>
        normalizeText(column.label) === normalizedHeader ||
        column.aliases.some(
          (alias) => normalizeText(alias) === normalizedHeader,
        ),
    );

    if (!columnDefinition) {
      continue;
    }

    normalizedRow[columnDefinition.key] = value;
  }

  return normalizedRow;
}

function validateRow(
  rawRow: LibraryImportRawRow,
  existingResources: LibraryResource[],
): LibraryImportPreviewRow {
  const errors: LibraryImportValidationIssue[] = [];
  const warnings: LibraryImportValidationIssue[] = [];

  const type = parseResourceType(rawRow.type);
  const name = cleanString(rawRow.name);
  const unit = cleanString(rawRow.unit);
  const price = parsePrice(rawRow.price);

  if (!type) {
    errors.push({
      field: "type",
      message:
        "El tipo debe ser material, mano de obra, equipo o subcontrato.",
    });
  }

  if (!name) {
    errors.push({
      field: "name",
      message: "El nombre del recurso es obligatorio.",
    });
  }

  if (!unit) {
    errors.push({
      field: "unit",
      message: "La unidad del recurso es obligatoria.",
    });
  }

  if (price === null) {
    errors.push({
      field: "defaultUnitPrice",
      message:
        "El precio debe ser un número válido igual o mayor que cero.",
    });
  }

  if (errors.length > 0 || !type || price === null) {
    return {
      rowNumber: rawRow.rowNumber,
      status: "error",
      resource: null,
      errors,
      warnings,
      duplicate: null,
      duplicateStrategy: "skip",
    };
  }

  const resource: LibraryImportResourceInput = {
    rowNumber: rawRow.rowNumber,
    code: cleanString(rawRow.code),
    type,
    name,
    unit,
    defaultUnitPrice: price,
    category: cleanString(rawRow.category),
    subcategory: cleanString(rawRow.subcategory),
    brand: cleanString(rawRow.brand),
    supplier: cleanString(rawRow.supplier),
    description: cleanString(rawRow.description),
    tags: parseTags(rawRow.tags),
    observations: cleanString(rawRow.observations),
    isFavorite: parseBoolean(rawRow.favorite),
  };

  if (!resource.code) {
    warnings.push({
      field: "code",
      message:
        "No se indicó un código. NEXUS generará uno automáticamente.",
    });
  }

  if (!resource.category) {
    warnings.push({
      field: "category",
      message: "El recurso no tiene una categoría asignada.",
    });
  }

  if (resource.defaultUnitPrice === 0) {
    warnings.push({
      field: "defaultUnitPrice",
      message: "El recurso tiene precio cero.",
    });
  }

  const duplicate = findDuplicate(
    resource,
    existingResources,
  );

  if (duplicate) {
    return {
      rowNumber: rawRow.rowNumber,
      status: "duplicate",
      resource,
      errors,
      warnings,
      duplicate: {
        id: duplicate.id,
        code: duplicate.code,
        name: duplicate.name,
      },
      duplicateStrategy: "skip",
    };
  }

  return {
    rowNumber: rawRow.rowNumber,
    status: warnings.length > 0 ? "warning" : "valid",
    resource,
    errors,
    warnings,
    duplicate: null,
    duplicateStrategy: "create",
  };
}

function processDuplicateRow(
  row: LibraryImportPreviewRow,
  result: LibraryImportResult,
) {
  if (!row.resource || !row.duplicate) {
    throw new Error(
      "No se encontró la información del recurso duplicado.",
    );
  }

  switch (row.duplicateStrategy) {
    case "skip":
      result.skipped += 1;
      return;

    case "update":
      updateResource(row.duplicate.id, row.resource);
      result.updated += 1;
      return;

    case "create":
      createResource(row.resource, true);
      result.created += 1;
      return;

    default:
      result.skipped += 1;
  }
}

function createResource(
  resource: LibraryImportResourceInput,
  forceNewCode = false,
) {
  LibraryService.create({
    code: forceNewCode ? undefined : resource.code || undefined,
    type: resource.type,
    name: resource.name,
    unit: resource.unit,
    defaultUnitPrice: resource.defaultUnitPrice,
    category: resource.category || undefined,
    subcategory: resource.subcategory || undefined,
    brand: resource.brand || undefined,
    supplier: resource.supplier || undefined,
    description: resource.description || undefined,
    tags: resource.tags,
    observations: resource.observations || undefined,
    isFavorite: resource.isFavorite,
  });
}

function updateResource(
  resourceId: string,
  resource: LibraryImportResourceInput,
) {
  LibraryService.update(resourceId, {
    code: resource.code || undefined,
    name: resource.name,
    unit: resource.unit,
    defaultUnitPrice: resource.defaultUnitPrice,
    category: resource.category || undefined,
    subcategory: resource.subcategory || undefined,
    brand: resource.brand || undefined,
    supplier: resource.supplier || undefined,
    description: resource.description || undefined,
    tags: resource.tags,
    observations: resource.observations || undefined,
    isFavorite: resource.isFavorite,
    priceUpdatedAt: new Date().toISOString(),
  });
}

function findDuplicate(
  resource: LibraryImportResourceInput,
  existingResources: LibraryResource[],
): LibraryResource | null {
  const normalizedCode = normalizeText(resource.code);

  if (normalizedCode) {
    const codeMatch = existingResources.find(
      (existingResource) =>
        normalizeText(existingResource.code) === normalizedCode,
    );

    if (codeMatch) {
      return codeMatch;
    }
  }

  const normalizedName = normalizeText(resource.name);
  const normalizedUnit = normalizeText(resource.unit);

  return (
    existingResources.find(
      (existingResource) =>
        normalizeText(existingResource.name) === normalizedName &&
        normalizeText(existingResource.unit) === normalizedUnit &&
        existingResource.type === resource.type,
    ) ?? null
  );
}

function parseResourceType(
  value: unknown,
): ResourceType | null {
  const normalizedValue = normalizeText(value);

  const typeAliases: Record<string, ResourceType> = {
    material: "material",
    materiales: "material",
    mat: "material",

    labor: "labor",
    manoobra: "labor",
    manodeobra: "labor",
    personal: "labor",
    trabajador: "labor",
    trabajadores: "labor",

    equipment: "equipment",
    equipo: "equipment",
    equipos: "equipment",
    maquinaria: "equipment",
    maquinarias: "equipment",
    herramienta: "equipment",
    herramientas: "equipment",

    subcontract: "subcontract",
    subcontrato: "subcontract",
    subcontratos: "subcontract",
    subcontratista: "subcontract",
    subcontratistas: "subcontract",
  };

  const parsedType = typeAliases[normalizedValue];

  if (!parsedType) {
    return null;
  }

  return VALID_RESOURCE_TYPES.includes(parsedType)
    ? parsedType
    : null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0
      ? value
      : null;
  }

  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const withoutCurrency = rawValue
    .replace(/\s/g, "")
    .replace(/RD\$/gi, "")
    .replace(/DOP/gi, "")
    .replace(/\$/g, "");

  const normalizedValue = normalizeNumericText(
    withoutCurrency,
  );

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

function normalizeNumericText(value: string): string {
  const lastCommaIndex = value.lastIndexOf(",");
  const lastDotIndex = value.lastIndexOf(".");

  if (lastCommaIndex > lastDotIndex) {
    return value
      .replace(/\./g, "")
      .replace(",", ".");
  }

  if (lastDotIndex > lastCommaIndex) {
    return value.replace(/,/g, "");
  }

  return value.replace(",", ".");
}

function parseTags(value: unknown): string[] {
  const rawValue = cleanString(value);

  if (!rawValue) {
    return [];
  }

  return Array.from(
    new Set(
      rawValue
        .split(/[,;|]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue = normalizeText(value);

  return [
    "si",
    "sí",
    "yes",
    "true",
    "verdadero",
    "1",
    "x",
  ].includes(normalizedValue);
}

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function recalculatePreview(
  preview: LibraryImportPreview,
  rows: LibraryImportPreviewRow[],
): LibraryImportPreview {
  return {
    ...preview,
    totalRows: rows.length,
    validRows: rows.filter(
      (row) => row.status === "valid",
    ).length,
    warningRows: rows.filter(
      (row) => row.status === "warning",
    ).length,
    errorRows: rows.filter(
      (row) => row.status === "error",
    ).length,
    duplicateRows: rows.filter(
      (row) => row.status === "duplicate",
    ).length,
    rows,
  };
}