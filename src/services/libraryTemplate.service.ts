import * as XLSX from "xlsx";

import {
  LIBRARY_IMPORT_COLUMNS,
  type LibraryImportColumnDefinition,
} from "@/types/library";

interface LibraryTemplateExampleRow {
  Código: string;
  Tipo: string;
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

interface LibraryTemplateInstructionRow {
  Campo: string;
  Obligatorio: string;
  Descripción: string;
  "Valores aceptados": string;
}

const FILE_NAME = "Plantilla_Importacion_Recursos_NEXUS.xlsx";

const EXAMPLE_ROWS: LibraryTemplateExampleRow[] = [
  {
    Código: "MAT-00001",
    Tipo: "material",
    Nombre: "Cemento gris Portland",
    Unidad: "funda",
    Precio: 550,
    Categoría: "Cementos",
    Subcategoría: "Cemento gris",
    Marca: "Ejemplo",
    Proveedor: "Proveedor de referencia",
    Descripción:
      "Cemento Portland de uso general en funda de 42.5 kg.",
    Etiquetas: "cemento; concreto; mampostería",
    Observaciones:
      "Precio de ejemplo. Actualizar antes de utilizar.",
    Favorito: "Sí",
  },
  {
    Código: "LAB-00001",
    Tipo: "labor",
    Nombre: "Albañil",
    Unidad: "día",
    Precio: 2500,
    Categoría: "Construcción",
    Subcategoría: "Albañilería",
    Marca: "",
    Proveedor: "",
    Descripción:
      "Jornada diaria de mano de obra especializada.",
    Etiquetas: "albañil; mano de obra",
    Observaciones: "",
    Favorito: "No",
  },
  {
    Código: "EQU-00001",
    Tipo: "equipment",
    Nombre: "Mezcladora de concreto",
    Unidad: "día",
    Precio: 1800,
    Categoría: "Equipos",
    Subcategoría: "Mezclado",
    Marca: "",
    Proveedor: "Alquiler de equipos",
    Descripción:
      "Alquiler diario de mezcladora de concreto.",
    Etiquetas: "mezcladora; concreto; alquiler",
    Observaciones: "",
    Favorito: "No",
  },
  {
    Código: "SUB-00001",
    Tipo: "subcontract",
    Nombre: "Instalación de plafón",
    Unidad: "m²",
    Precio: 950,
    Categoría: "Terminaciones",
    Subcategoría: "Plafones",
    Marca: "",
    Proveedor: "Subcontratista de referencia",
    Descripción:
      "Suministro e instalación de plafón terminado.",
    Etiquetas: "plafón; terminaciones; instalación",
    Observaciones:
      "Confirmar alcance y materiales incluidos.",
    Favorito: "No",
  },
];

const COLUMN_WIDTHS = [
  { wch: 16 },
  { wch: 16 },
  { wch: 34 },
  { wch: 14 },
  { wch: 14 },
  { wch: 22 },
  { wch: 22 },
  { wch: 18 },
  { wch: 28 },
  { wch: 48 },
  { wch: 36 },
  { wch: 48 },
  { wch: 12 },
];

export const LibraryTemplateService = {
  downloadTemplate(): void {
    const workbook = XLSX.utils.book_new();

    const resourceWorksheet =
      XLSX.utils.json_to_sheet(EXAMPLE_ROWS);

    resourceWorksheet["!cols"] = COLUMN_WIDTHS;
    resourceWorksheet["!autofilter"] = {
      ref: `A1:M${EXAMPLE_ROWS.length + 1}`,
    };

    const instructionRows = createInstructionRows();

    const instructionsWorksheet =
      XLSX.utils.json_to_sheet(instructionRows);

    instructionsWorksheet["!cols"] = [
      { wch: 22 },
      { wch: 14 },
      { wch: 62 },
      { wch: 52 },
    ];

    const typeRows = [
      {
        Tipo: "material",
        Descripción:
          "Materiales consumibles utilizados en la ejecución.",
      },
      {
        Tipo: "labor",
        Descripción:
          "Mano de obra, personal, cuadrillas o jornales.",
      },
      {
        Tipo: "equipment",
        Descripción:
          "Equipos, herramientas, maquinarias o alquileres.",
      },
      {
        Tipo: "subcontract",
        Descripción:
          "Trabajos ejecutados mediante subcontratistas.",
      },
    ];

    const typesWorksheet =
      XLSX.utils.json_to_sheet(typeRows);

    typesWorksheet["!cols"] = [
      { wch: 18 },
      { wch: 70 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      resourceWorksheet,
      "Recursos",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      instructionsWorksheet,
      "Instrucciones",
    );

    XLSX.utils.book_append_sheet(
      workbook,
      typesWorksheet,
      "Tipos de recursos",
    );

    XLSX.writeFile(workbook, FILE_NAME, {
      compression: true,
      bookType: "xlsx",
    });
  },
};

function createInstructionRows(): LibraryTemplateInstructionRow[] {
  return LIBRARY_IMPORT_COLUMNS.map((column) => ({
    Campo: column.label,
    Obligatorio: column.required ? "Sí" : "No",
    Descripción: getColumnDescription(column),
    "Valores aceptados": getAcceptedValues(column),
  }));
}

function getColumnDescription(
  column: LibraryImportColumnDefinition,
): string {
  const descriptions: Record<
    LibraryImportColumnDefinition["key"],
    string
  > = {
    code:
      "Código único del recurso. Puede dejarse vacío para que NEXUS genere uno automáticamente.",

    type:
      "Clasificación principal del recurso dentro de la biblioteca.",

    name:
      "Nombre descriptivo que permitirá identificar el recurso.",

    unit:
      "Unidad utilizada para medir o cuantificar el recurso.",

    price:
      "Precio unitario del recurso expresado en pesos dominicanos.",

    category:
      "Categoría general utilizada para organizar recursos relacionados.",

    subcategory:
      "Clasificación secundaria dentro de la categoría principal.",

    brand:
      "Marca, fabricante o referencia comercial del recurso.",

    supplier:
      "Empresa, suplidor, contratista o fuente utilizada como referencia.",

    description:
      "Descripción técnica o información adicional del recurso.",

    tags:
      "Palabras clave separadas por coma, punto y coma o barra vertical.",

    observations:
      "Notas internas, condiciones, advertencias o aclaraciones.",

    favorite:
      "Indica si el recurso debe mostrarse dentro de los favoritos.",
  };

  return descriptions[column.key];
}

function getAcceptedValues(
  column: LibraryImportColumnDefinition,
): string {
  const acceptedValues: Record<
    LibraryImportColumnDefinition["key"],
    string
  > = {
    code:
      "Texto libre. Ejemplo: MAT-00001. También puede dejarse vacío.",

    type:
      "material, labor, equipment o subcontract.",

    name:
      "Texto obligatorio.",

    unit:
      "Texto. Ejemplos: ud, m, m², m³, kg, funda, día, hora.",

    price:
      "Número igual o mayor que cero. Ejemplos: 550, 1,250.50 o 1.250,50.",

    category:
      "Texto libre.",

    subcategory:
      "Texto libre.",

    brand:
      "Texto libre.",

    supplier:
      "Texto libre.",

    description:
      "Texto libre.",

    tags:
      "Varias etiquetas separadas por coma, punto y coma o |.",

    observations:
      "Texto libre.",

    favorite:
      "Sí, No, Yes, True, False, 1, 0 o X.",
  };

  return acceptedValues[column.key];
}