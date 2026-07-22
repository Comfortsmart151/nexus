import * as XLSX from "xlsx";

import { LibraryService } from "@/services/library.service";

import type { ResourceType } from "@/types/budget";
import type { LibraryResource } from "@/types/library";

export type LibraryExportScope =
  | "all"
  | "favorites"
  | ResourceType;

export interface LibraryExportOptions {
  scope?: LibraryExportScope;
  resources?: LibraryResource[];
  fileName?: string;
}

interface LibraryExportRow {
  Código: string;
  Tipo: ResourceType;
  Nombre: string;
  Unidad: string;
  Precio: number;
  Categoría: string;
  Subcategoría: string;
  Marca: string;
  Proveedor: string;
  Descripción: string;
  Etiquetas: string;
  Observaciones: string;
  Favorito: string;
}

interface LibraryExportSummaryRow {
  Indicador: string;
  Valor: string | number;
}

const DEFAULT_FILE_NAME = "Biblioteca_Recursos_NEXUS.xlsx";

const RESOURCE_COLUMN_WIDTHS = [
  { wch: 16 },
  { wch: 16 },
  { wch: 36 },
  { wch: 14 },
  { wch: 16 },
  { wch: 24 },
  { wch: 24 },
  { wch: 20 },
  { wch: 30 },
  { wch: 48 },
  { wch: 38 },
  { wch: 48 },
  { wch: 12 },
];

const SUMMARY_COLUMN_WIDTHS = [
  { wch: 34 },
  { wch: 24 },
];

export const LibraryExportService = {
  exportLibrary(options: LibraryExportOptions = {}): void {
    const scope = options.scope ?? "all";

    const sourceResources =
      options.resources ?? LibraryService.findActive();

    const filteredResources = filterResources(
      sourceResources,
      scope,
    );

    if (filteredResources.length === 0) {
      throw new Error(
        "No existen recursos disponibles para exportar con el filtro seleccionado.",
      );
    }

    const sortedResources = [...filteredResources].sort(
      compareResources,
    );

    const workbook = XLSX.utils.book_new();

    const resourceRows = sortedResources.map(
      mapResourceToExportRow,
    );

    const resourcesWorksheet =
      XLSX.utils.json_to_sheet(resourceRows);

    resourcesWorksheet["!cols"] =
      RESOURCE_COLUMN_WIDTHS;

    resourcesWorksheet["!autofilter"] = {
      ref: `A1:M${resourceRows.length + 1}`,
    };

    resourcesWorksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: "A2",
      activePane: "bottomLeft",
      state: "frozen",
    };

    const summaryRows = createSummaryRows(
      sortedResources,
      scope,
    );

    const summaryWorksheet =
      XLSX.utils.json_to_sheet(summaryRows);

    summaryWorksheet["!cols"] =
      SUMMARY_COLUMN_WIDTHS;

    const typeSummaryRows = createTypeSummaryRows(
      sortedResources,
    );

    const typeSummaryWorksheet =
      XLSX.utils.json_to_sheet(typeSummaryRows);

    typeSummaryWorksheet["!cols"] = [
      { wch: 22 },
      { wch: 18 },
      { wch: 54 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      resourcesWorksheet,
      "Recursos",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      summaryWorksheet,
      "Resumen",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      typeSummaryWorksheet,
      "Tipos de recursos",
    );

    const fileName =
      normalizeFileName(options.fileName) ??
      createDefaultFileName(scope);

    XLSX.writeFile(workbook, fileName, {
      compression: true,
      bookType: "xlsx",
    });
  },

  exportAll(
    resources?: LibraryResource[],
  ): void {
    this.exportLibrary({
      scope: "all",
      resources,
    });
  },

  exportFavorites(
    resources?: LibraryResource[],
  ): void {
    this.exportLibrary({
      scope: "favorites",
      resources,
    });
  },

  exportMaterials(
    resources?: LibraryResource[],
  ): void {
    this.exportLibrary({
      scope: "material",
      resources,
    });
  },

  exportLabor(
    resources?: LibraryResource[],
  ): void {
    this.exportLibrary({
      scope: "labor",
      resources,
    });
  },

  exportEquipment(
    resources?: LibraryResource[],
  ): void {
    this.exportLibrary({
      scope: "equipment",
      resources,
    });
  },

  exportSubcontracts(
    resources?: LibraryResource[],
  ): void {
    this.exportLibrary({
      scope: "subcontract",
      resources,
    });
  },
};

function filterResources(
  resources: LibraryResource[],
  scope: LibraryExportScope,
): LibraryResource[] {
  if (scope === "all") {
    return resources;
  }

  if (scope === "favorites") {
    return resources.filter(
      (resource) => resource.isFavorite,
    );
  }

  return resources.filter(
    (resource) => resource.type === scope,
  );
}

function compareResources(
  firstResource: LibraryResource,
  secondResource: LibraryResource,
): number {
  const typeComparison = firstResource.type.localeCompare(
    secondResource.type,
    "es",
  );

  if (typeComparison !== 0) {
    return typeComparison;
  }

  const categoryComparison = (
    firstResource.category ?? ""
  ).localeCompare(
    secondResource.category ?? "",
    "es",
  );

  if (categoryComparison !== 0) {
    return categoryComparison;
  }

  return firstResource.name.localeCompare(
    secondResource.name,
    "es",
  );
}

function mapResourceToExportRow(
  resource: LibraryResource,
): LibraryExportRow {
  return {
    Código: resource.code,
    Tipo: resource.type,
    Nombre: resource.name,
    Unidad: resource.unit,
    Precio: resource.defaultUnitPrice,
    Categoría: resource.category ?? "",
    Subcategoría: resource.subcategory ?? "",
    Marca: resource.brand ?? "",
    Proveedor: resource.supplier ?? "",
    Descripción: resource.description ?? "",
    Etiquetas: resource.tags.join("; "),
    Observaciones: resource.observations ?? "",
    Favorito: resource.isFavorite ? "Sí" : "No",
  };
}

function createSummaryRows(
  resources: LibraryResource[],
  scope: LibraryExportScope,
): LibraryExportSummaryRow[] {
  const totalValue = resources.reduce(
    (accumulator, resource) =>
      accumulator + resource.defaultUnitPrice,
    0,
  );

  const averagePrice =
    resources.length > 0
      ? totalValue / resources.length
      : 0;

  return [
    {
      Indicador: "Producto",
      Valor: "NEXUS",
    },
    {
      Indicador: "Archivo",
      Valor: "Exportación de biblioteca de recursos",
    },
    {
      Indicador: "Fecha de exportación",
      Valor: formatDate(new Date()),
    },
    {
      Indicador: "Filtro exportado",
      Valor: getScopeLabel(scope),
    },
    {
      Indicador: "Total de recursos",
      Valor: resources.length,
    },
    {
      Indicador: "Materiales",
      Valor: countByType(resources, "material"),
    },
    {
      Indicador: "Mano de obra",
      Valor: countByType(resources, "labor"),
    },
    {
      Indicador: "Equipos",
      Valor: countByType(resources, "equipment"),
    },
    {
      Indicador: "Subcontratos",
      Valor: countByType(resources, "subcontract"),
    },
    {
      Indicador: "Recursos favoritos",
      Valor: resources.filter(
        (resource) => resource.isFavorite,
      ).length,
    },
    {
      Indicador: "Precio unitario promedio",
      Valor: roundNumber(averagePrice),
    },
  ];
}

function createTypeSummaryRows(
  resources: LibraryResource[],
) {
  return [
    {
      Tipo: "material",
      Cantidad: countByType(
        resources,
        "material",
      ),
      Descripción:
        "Materiales consumibles utilizados en la ejecución de partidas.",
    },
    {
      Tipo: "labor",
      Cantidad: countByType(
        resources,
        "labor",
      ),
      Descripción:
        "Mano de obra, personal, cuadrillas, jornales y especialistas.",
    },
    {
      Tipo: "equipment",
      Cantidad: countByType(
        resources,
        "equipment",
      ),
      Descripción:
        "Equipos, herramientas, maquinarias y alquileres.",
    },
    {
      Tipo: "subcontract",
      Cantidad: countByType(
        resources,
        "subcontract",
      ),
      Descripción:
        "Trabajos y servicios ejecutados mediante subcontratistas.",
    },
  ];
}

function countByType(
  resources: LibraryResource[],
  type: ResourceType,
): number {
  return resources.filter(
    (resource) => resource.type === type,
  ).length;
}

function getScopeLabel(
  scope: LibraryExportScope,
): string {
  const labels: Record<LibraryExportScope, string> = {
    all: "Biblioteca completa",
    favorites: "Solo favoritos",
    material: "Solo materiales",
    labor: "Solo mano de obra",
    equipment: "Solo equipos",
    subcontract: "Solo subcontratos",
  };

  return labels[scope];
}

function createDefaultFileName(
  scope: LibraryExportScope,
): string {
  const date = createDateStamp(new Date());

  const scopeNames: Record<
    LibraryExportScope,
    string
  > = {
    all: "Biblioteca",
    favorites: "Favoritos",
    material: "Materiales",
    labor: "Mano_de_Obra",
    equipment: "Equipos",
    subcontract: "Subcontratos",
  };

  if (scope === "all") {
    return `Biblioteca_Recursos_NEXUS_${date}.xlsx`;
  }

  return `Biblioteca_${scopeNames[scope]}_NEXUS_${date}.xlsx`;
}

function normalizeFileName(
  fileName?: string,
): string | null {
  const cleanFileName = fileName?.trim();

  if (!cleanFileName) {
    return null;
  }

  const safeFileName = cleanFileName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_");

  if (
    safeFileName.toLowerCase().endsWith(".xlsx")
  ) {
    return safeFileName;
  }

  return `${safeFileName}.xlsx`;
}

function createDateStamp(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function roundNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

void DEFAULT_FILE_NAME;