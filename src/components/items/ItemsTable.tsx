import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Trash2,
} from "lucide-react";

import ItemStatusBadge from "@/components/items/ItemStatusBadge";
import type { BudgetItem } from "@/types/budget";

interface ItemsTableProps {
  projectId: string;
  chapterId: string;
  items: BudgetItem[];
  onDelete: (itemId: string) => void;
}

export default function ItemsTable({
  projectId,
  chapterId,
  items,
  onDelete,
}: ItemsTableProps) {
  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Partidas del capítulo
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {items.length}{" "}
            {items.length === 1
              ? "partida registrada"
              : "partidas registradas"}
          </p>
        </div>

        {items.length > 0 && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Guardado automáticamente
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyItemsState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">
                  Código
                </th>

                <th className="px-6 py-4">
                  Descripción
                </th>

                <th className="px-6 py-4">
                  Unidad
                </th>

                <th className="px-6 py-4 text-right">
                  Cantidad
                </th>

                <th className="px-6 py-4 text-right">
                  Precio unitario
                </th>

                <th className="px-6 py-4 text-right">
                  Importe
                </th>

                <th className="px-6 py-4">
                  Estado
                </th>

                <th className="px-6 py-4 text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const analysisHref =
                  `/projects/${projectId}` +
                  `/chapters/${chapterId}` +
                  `/items/${item.id}`;

                const itemAmount =
                  item.quantity * item.unitPrice;

                return (
                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-5 font-semibold text-blue-700">
                      {item.code ?? item.id}
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-medium text-slate-900">
                        {item.name}
                      </p>

                      {item.description && (
                        <p className="mt-1 max-w-md text-sm text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-5 text-slate-600">
                      {item.unit}
                    </td>

                    <td className="px-6 py-5 text-right font-medium">
                      {formatNumber(item.quantity)}
                    </td>

                    <td className="px-6 py-5 text-right font-medium">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="px-6 py-5 text-right font-bold text-slate-900">
                      {formatCurrency(itemAmount)}
                    </td>

                    <td className="px-6 py-5">
                      <ItemStatusBadge
                        status={item.status}
                      />
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={analysisHref}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                        >
                          Abrir APU
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(item.id)
                          }
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-5 text-right text-sm font-semibold text-slate-600"
                >
                  Subtotal del capítulo
                </td>

                <td className="px-6 py-5 text-right text-lg font-bold text-slate-950">
                  {formatCurrency(
                    items.reduce(
                      (total, item) =>
                        total +
                        item.quantity *
                          item.unitPrice,
                      0,
                    ),
                  )}
                </td>

                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyItemsState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <ClipboardList className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-xl font-semibold">
        Aún no hay partidas
      </h3>

      <p className="mt-2 max-w-md text-slate-500">
        Agrega la primera partida de este capítulo para
        comenzar a construir el presupuesto.
      </p>
    </div>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("es-DO", {
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}