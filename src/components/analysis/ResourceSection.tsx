import { Library, Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";

import { ResourceService } from "@/services/resource.service";
import type { CostResource } from "@/types/budget";

interface ResourceSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  resources: CostResource[];
  onAdd: () => void;
  onEdit: (resource: CostResource) => void;
  onDelete: (resourceId: string) => void;
}

export default function ResourceSection({
  icon: Icon,
  title,
  description,
  resources,
  onAdd,
  onEdit,
  onDelete,
}: ResourceSectionProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">{title}</h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center">
          <p className="text-sm text-slate-400">
            Aún no hay recursos registrados.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Recurso</th>
                <th className="pb-3">Unidad</th>
                <th className="pb-3 text-right">Cantidad</th>
                <th className="pb-3 text-right">Precio</th>
                <th className="pb-3 text-right">Desperdicio</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td className="py-4">
                    <div className="flex items-start gap-3">
                      {resource.libraryResourceId && (
                        <div
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                          title="Recurso agregado desde la biblioteca"
                        >
                          <Library className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div>
                        <p className="font-medium">
                          {resource.name}
                        </p>

                        {resource.code && (
                          <p className="mt-1 text-xs text-slate-400">
                            {resource.code}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 text-slate-500">
                    {resource.unit}
                  </td>

                  <td className="py-4 text-right">
                    {formatNumber(resource.quantity)}
                  </td>

                  <td className="py-4 text-right">
                    {formatCurrency(resource.unitPrice)}
                  </td>

                  <td className="py-4 text-right">
                    {formatNumber(resource.wastePercentage ?? 0)}%
                  </td>

                  <td className="py-4 text-right font-semibold">
                    {formatCurrency(
                      ResourceService.calculateResourceTotal(resource),
                    )}
                  </td>

                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(resource)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(resource.id)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("es-DO", {
    maximumFractionDigits: 4,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}