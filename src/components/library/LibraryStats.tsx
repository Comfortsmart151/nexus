"use client";

import { Boxes, BriefcaseBusiness, Building2, Truck } from "lucide-react";

import type { ElementType } from "react";

import type { ResourceType } from "@/types/budget";

interface ResourceTypeOption {
  type: ResourceType;
  label: string;
  description: string;
  icon: ElementType;
}

const resourceTypes: ResourceTypeOption[] = [
  {
    type: "material",
    label: "Materiales",
    description: "Cemento, arena, acero, bloques y suministros.",
    icon: Boxes,
  },
  {
    type: "labor",
    label: "Mano de obra",
    description: "Peones, maestros, técnicos y especialistas.",
    icon: BriefcaseBusiness,
  },
  {
    type: "equipment",
    label: "Equipos",
    description: "Maquinarias, herramientas y alquileres.",
    icon: Truck,
  },
  {
    type: "subcontract",
    label: "Subcontratos",
    description: "Trabajos especializados contratados a terceros.",
    icon: Building2,
  },
];

interface LibraryStatsProps {
  activeFilter: "all" | "favorites" | ResourceType;
  countByType: (type: ResourceType) => number;
  onSelectType: (type: ResourceType) => void;
}

export default function LibraryStats({
  activeFilter,
  countByType,
  onSelectType,
}: LibraryStatsProps) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {resourceTypes.map((resourceOption) => {
        const Icon = resourceOption.icon;
        const count = countByType(resourceOption.type);

        const selected =
          activeFilter === resourceOption.type;

        return (
          <button
            key={resourceOption.type}
            type="button"
            onClick={() => onSelectType(resourceOption.type)}
            className={`rounded-2xl border p-5 text-left shadow-sm transition ${
              selected
                ? "border-blue-400 bg-blue-50 shadow-blue-100"
                : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <span className="text-3xl font-black">
                {count}
              </span>
            </div>

            <h2 className="mt-5 font-semibold">
              {resourceOption.label}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {resourceOption.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}