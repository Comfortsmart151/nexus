"use client";

import {
  CalendarClock,
  Edit3,
  History,
  Library,
  Star,
  Trash2,
} from "lucide-react";

import type { ElementType } from "react";

import type { ResourceType } from "@/types/budget";
import type { LibraryResource } from "@/types/library";

interface ResourceTypeOption {
  type: ResourceType;
  label: string;
  icon: ElementType;
}

interface LibraryTableProps {
  resources: LibraryResource[];
  resourceTypes: ResourceTypeOption[];
  onToggleFavorite: (resource: LibraryResource) => void;
  onEdit: (resource: LibraryResource) => void;
  onDelete: (resource: LibraryResource) => void;
  onHistory: (resource: LibraryResource) => void;
}

export default function LibraryTable({
  resources,
  resourceTypes,
  onToggleFavorite,
  onEdit,
  onDelete,
  onHistory,
}: LibraryTableProps) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Library className="h-8 w-8" />
        </div>

        <h3 className="mt-5 text-xl font-semibold">
          No hay recursos visibles
        </h3>

        <p className="mt-2 max-w-md text-slate-500">
          Cambia los filtros o crea un nuevo recurso.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1350px]">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-6 py-4">Código</th>
            <th className="px-6 py-4">Recurso</th>
            <th className="px-6 py-4">Clasificación</th>
            <th className="px-6 py-4">Unidad</th>
            <th className="px-6 py-4 text-right">
              Precio base
            </th>
            <th className="px-6 py-4">Proveedor</th>
            <th className="px-6 py-4">Actualización</th>
            <th className="px-6 py-4 text-right">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {resources.map((resource) => {
            const typeData = resourceTypes.find(
              (option) => option.type === resource.type,
            );

            const Icon = typeData?.icon ?? Library;

            return (
              <tr
                key={resource.id}
                className="transition hover:bg-slate-50"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleFavorite(resource)
                      }
                      className={`rounded-lg p-1.5 transition ${
                        resource.isFavorite
                          ? "bg-amber-50 text-amber-500"
                          : "text-slate-300 hover:bg-amber-50 hover:text-amber-500"
                      }`}
                    >
                      <Star
                        className="h-4 w-4"
                        fill={
                          resource.isFavorite
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>

                    <span className="font-semibold text-blue-700">
                      {resource.code}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {resource.name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {resource.brand && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                            {resource.brand}
                          </span>
                        )}

                        {resource.tags
                          .slice(0, 2)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <p className="font-medium text-slate-700">
                    {resource.category ||
                      typeData?.label ||
                      resource.type}
                  </p>

                  {resource.subcategory && (
                    <p className="mt-1 text-sm text-slate-400">
                      {resource.subcategory}
                    </p>
                  )}
                </td>

                <td className="px-6 py-5 text-slate-600">
                  {resource.unit}
                </td>

                <td className="px-6 py-5 text-right">
                  <p className="font-bold text-slate-950">
                    {formatCurrency(
                      resource.defaultUnitPrice,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {resource.priceHistory.length}{" "}
                    {resource.priceHistory.length === 1
                      ? "registro"
                      : "registros"}
                  </p>
                </td>

                <td className="px-6 py-5 text-slate-500">
                  {resource.supplier ||
                    "No especificado"}
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarClock className="h-4 w-4" />
                    {formatDate(resource.priceUpdatedAt)}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onHistory(resource)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      <History className="h-4 w-4" />
                      Historial
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(resource)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-600 hover:text-white"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(resource)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}