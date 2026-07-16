import type { CreateLibraryResourceInput } from "@/types/library";

const HISTORICAL_SOURCE =
  "Manual de Costos — precio histórico; actualizar antes de usar";

export const INITIAL_LIBRARY_RESOURCES: CreateLibraryResourceInput[] = [
  // MATERIALES
  {
    code: "MAT-00001",
    type: "material",
    name: "Cemento gris",
    unit: "funda",
    defaultUnitPrice: 140,
    supplier: HISTORICAL_SOURCE,
    description:
      "Precio de referencia histórico extraído del Manual de Costos.",
  },
  {
    code: "MAT-00002",
    type: "material",
    name: "Arena de Itabo",
    unit: "m³",
    defaultUnitPrice: 550,
    supplier: HISTORICAL_SOURCE,
    description:
      "Arena utilizada en morteros y hormigones.",
  },
  {
    code: "MAT-00003",
    type: "material",
    name: "Arena de Itabo sucia",
    unit: "m³",
    defaultUnitPrice: 420,
    supplier: HISTORICAL_SOURCE,
    description:
      "Precio de referencia histórico.",
  },
  {
    code: "MAT-00004",
    type: "material",
    name: "Arena de Itabo lavada",
    unit: "m³",
    defaultUnitPrice: 580,
    supplier: HISTORICAL_SOURCE,
    description:
      "Arena lavada para morteros y hormigones.",
  },
  {
    code: "MAT-00005",
    type: "material",
    name: "Arena de planta",
    unit: "m³",
    defaultUnitPrice: 550,
    supplier: HISTORICAL_SOURCE,
    description:
      "Precio de referencia histórico.",
  },
  {
    code: "MAT-00006",
    type: "material",
    name: "Arena azul",
    unit: "m³",
    defaultUnitPrice: 600,
    supplier: HISTORICAL_SOURCE,
    description:
      "Arena fina utilizada principalmente en morteros de pañete.",
  },
  {
    code: "MAT-00007",
    type: "material",
    name: "Grava limpia",
    unit: "m³",
    defaultUnitPrice: 600,
    supplier: HISTORICAL_SOURCE,
    description:
      "Agregado para hormigones.",
  },
  {
    code: "MAT-00008",
    type: "material",
    name: "Grava sucia",
    unit: "m³",
    defaultUnitPrice: 540,
    supplier: HISTORICAL_SOURCE,
    description:
      "Precio de referencia histórico.",
  },
  {
    code: "MAT-00009",
    type: "material",
    name: "Madera para encofrado",
    unit: "pie²",
    defaultUnitPrice: 30,
    supplier: HISTORICAL_SOURCE,
    description:
      "Madera de referencia para charrancha, encofrados y andamios.",
  },
  {
    code: "MAT-00010",
    type: "material",
    name: "Clavos",
    unit: "lb",
    defaultUnitPrice: 30,
    supplier: HISTORICAL_SOURCE,
    description:
      "Clavos para trabajos provisionales y encofrados.",
  },
  {
    code: "MAT-00011",
    type: "material",
    name: "Hilo de construcción",
    unit: "lb",
    defaultUnitPrice: 200,
    supplier: HISTORICAL_SOURCE,
    description:
      "Hilo utilizado para replanteo y alineación.",
  },
  {
    code: "MAT-00012",
    type: "material",
    name: "Cal",
    unit: "funda",
    defaultUnitPrice: 80,
    supplier: HISTORICAL_SOURCE,
    description:
      "Material de referencia para replanteos y morteros.",
  },
  {
    code: "MAT-00013",
    type: "material",
    name: "Caliche",
    unit: "m³",
    defaultUnitPrice: 200,
    supplier: HISTORICAL_SOURCE,
    description:
      "Material de relleno compactado.",
  },

  // MANO DE OBRA
  {
    code: "LAB-00001",
    type: "labor",
    name: "Trabajador no calificado — Peón",
    unit: "día",
    defaultUnitPrice: 268,
    supplier: HISTORICAL_SOURCE,
    description:
      "Jornal histórico de referencia. Jornada considerada: 8 horas.",
  },
  {
    code: "LAB-00002",
    type: "labor",
    name: "Trabajador calificado",
    unit: "día",
    defaultUnitPrice: 294,
    supplier: HISTORICAL_SOURCE,
    description:
      "Jornal histórico de referencia.",
  },
  {
    code: "LAB-00003",
    type: "labor",
    name: "Ayudante",
    unit: "día",
    defaultUnitPrice: 345,
    supplier: HISTORICAL_SOURCE,
    description:
      "Jornal histórico de referencia.",
  },
  {
    code: "LAB-00004",
    type: "labor",
    name: "Operario de tercera categoría",
    unit: "día",
    defaultUnitPrice: 448,
    supplier: HISTORICAL_SOURCE,
    description:
      "Jornal histórico de referencia.",
  },
  {
    code: "LAB-00005",
    type: "labor",
    name: "Operario de segunda categoría",
    unit: "día",
    defaultUnitPrice: 511,
    supplier: HISTORICAL_SOURCE,
    description:
      "Jornal histórico de referencia.",
  },
  {
    code: "LAB-00006",
    type: "labor",
    name: "Operario de primera categoría",
    unit: "día",
    defaultUnitPrice: 639,
    supplier: HISTORICAL_SOURCE,
    description:
      "Jornal histórico de referencia.",
  },
  {
    code: "LAB-00007",
    type: "labor",
    name: "Maestro de obra",
    unit: "día",
    defaultUnitPrice: 830,
    supplier: HISTORICAL_SOURCE,
    description:
      "Jornal histórico de referencia.",
  },
  {
    code: "LAB-00008",
    type: "labor",
    name: "Topógrafo",
    unit: "día",
    defaultUnitPrice: 3000,
    supplier: HISTORICAL_SOURCE,
    description:
      "Valor histórico usado en el análisis de replanteo.",
  },

  // EQUIPOS Y HERRAMIENTAS
  {
    code: "EQU-00001",
    type: "equipment",
    name: "Estación topográfica",
    unit: "día",
    defaultUnitPrice: 2000,
    supplier: HISTORICAL_SOURCE,
    description:
      "Costo histórico utilizado en el análisis de replanteo.",
  },
  {
    code: "EQU-00002",
    type: "equipment",
    name: "Pala manual",
    unit: "ud",
    defaultUnitPrice: 440,
    supplier: HISTORICAL_SOURCE,
    description:
      "Valor histórico del equipo; revisar vida útil y costo vigente.",
  },
  {
    code: "EQU-00003",
    type: "equipment",
    name: "Pico manual",
    unit: "ud",
    defaultUnitPrice: 550,
    supplier: HISTORICAL_SOURCE,
    description:
      "Valor histórico del equipo; revisar vida útil y costo vigente.",
  },
  {
    code: "EQU-00004",
    type: "equipment",
    name: "Carretilla de construcción",
    unit: "ud",
    defaultUnitPrice: 1250,
    supplier: HISTORICAL_SOURCE,
    description:
      "Valor histórico utilizado para calcular depreciación por uso.",
  },
];