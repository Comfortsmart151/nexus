"use client";

import Link from "next/link";
import {
  Calculator,
  Check,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";
import { useState } from "react";

import type {
  BudgetChapter,
  BudgetItem,
  BudgetItemPriceSource,
} from "@/types/budget";

export interface BudgetItemRow {
  item: BudgetItem;
  unitPrice: number;
  amount: number;
  isCalculated: boolean;
}

export interface InlineItemUpdate {
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  priceSource?: BudgetItemPriceSource;
}

interface ChapterItemsTableProps {
  projectId: string;
  chapter: BudgetChapter;
  items: BudgetItemRow[];
  onUpdateItem: (
    itemId: string,
    input: InlineItemUpdate,
  ) => void;
  onUseApuPrice: (itemId: string) => void;
}

interface EditingValues {
  name: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

export default function ChapterItemsTable({
  projectId,
  chapter,
  items,
  onUpdateItem,
  onUseApuPrice,
}: ChapterItemsTableProps) {
  const [editingItemId, setEditingItemId] =
    useState<string | null>(null);

  const [editingValues, setEditingValues] =
    useState<EditingValues | null>(null);

  function startEditing(row: BudgetItemRow) {
    setEditingItemId(row.item.id);

    setEditingValues({
      name: row.item.name,
      quantity: String(row.item.quantity),
      unit: row.item.unit,
      unitPrice: String(row.unitPrice),
    });
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditingValues(null);
  }

  function saveEditing(row: BudgetItemRow) {
    if (!editingValues) {
      return;
    }

    const name = editingValues.name.trim();
    const unit = editingValues.unit.trim();

    const quantity = sanitizeNumber(
      Number(editingValues.quantity),
    );

    const enteredUnitPrice = sanitizeNumber(
      Number(editingValues.unitPrice),
    );

    if (!name || !unit) {
      return;
    }

    const priceChanged =
      Math.abs(
        enteredUnitPrice - row.unitPrice,
      ) > 0.000001;

    onUpdateItem(row.item.id, {
      name,
      unit,
      quantity,
      ...(priceChanged
        ? {
            unitPrice: enteredUnitPrice,
            priceSource: "manual" as const,
          }
        : {}),
    });

    cancelEditing();
  }

  if (items.length === 0) {
    return (
      <div className="px-5 py-10 text-center sm:px-7">
        <p className="font-medium text-slate-600">
          Este capítulo todavía no tiene partidas.
        </p>

        <Link
          href={`/projects/${projectId}/chapters/${chapter.id}/items`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
        >
          Agregar partidas
        </Link>
      </div>
    );
  }

  const chapterSubtotal = items.reduce(
    (total, currentItem) =>
      total + currentItem.amount,
    0,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-5 py-4 font-semibold">
              Código
            </th>

            <th className="px-5 py-4 font-semibold">
              Concepto
            </th>

            <th className="px-5 py-4 text-right font-semibold">
              Cantidad
            </th>

            <th className="px-5 py-4 font-semibold">
              Unidad
            </th>

            <th className="px-5 py-4 text-right font-semibold">
              Precio unitario
            </th>

            <th className="px-5 py-4 text-right font-semibold">
              Importe
            </th>

            <th className="px-5 py-4 text-center font-semibold">
              Origen
            </th>

            <th className="px-5 py-4 text-center font-semibold">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {items.map((row) => {
            const {
              item,
              unitPrice,
              amount,
              isCalculated,
            } = row;

            const isEditing =
              editingItemId === item.id &&
              editingValues !== null;

            const previewQuantity = isEditing
              ? sanitizeNumber(
                  Number(editingValues.quantity),
                )
              : item.quantity;

            const previewUnitPrice = isEditing
              ? sanitizeNumber(
                  Number(editingValues.unitPrice),
                )
              : unitPrice;

            const previewAmount =
              previewQuantity * previewUnitPrice;

            return (
              <tr
                key={item.id}
                className="transition hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-500">
                  {item.code || "—"}
                </td>

                <td className="px-5 py-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingValues.name}
                      onChange={(event) =>
                        setEditingValues({
                          ...editingValues,
                          name: event.target.value,
                        })
                      }
                      className="w-full min-w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <>
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>

                      {item.description && (
                        <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </>
                  )}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={editingValues.quantity}
                      onChange={(event) =>
                        setEditingValues({
                          ...editingValues,
                          quantity: event.target.value,
                        })
                      }
                      className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <span className="font-medium">
                      {formatNumber(
                        item.quantity,
                        4,
                      )}
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingValues.unit}
                      onChange={(event) =>
                        setEditingValues({
                          ...editingValues,
                          unit: event.target.value,
                        })
                      }
                      className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <span className="text-sm text-slate-500">
                      {item.unit}
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingValues.unitPrice}
                      onChange={(event) =>
                        setEditingValues({
                          ...editingValues,
                          unitPrice: event.target.value,
                        })
                      }
                      className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  ) : (
                    <span className="font-semibold">
                      {formatCurrency(unitPrice)}
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-950">
                  {formatCurrency(
                    isEditing
                      ? previewAmount
                      : amount,
                  )}
                </td>

                <td className="px-5 py-4 text-center">
                  <PriceSourceBadge
                    source={item.priceSource}
                    hasCalculatedApu={isCalculated}
                  />
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            saveEditing(row)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                          title="Guardar cambios"
                        >
                          <Check className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(row)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                          title="Editar partida"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {item.priceSource ===
                          "manual" &&
                          isCalculated && (
                            <button
                              type="button"
                              onClick={() =>
                                onUseApuPrice(
                                  item.id,
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 transition hover:bg-violet-100"
                              title="Restaurar precio calculado por APU"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}

                        <Link
                          href={
                            `/projects/${projectId}` +
                            `/chapters/${chapter.id}` +
                            `/items/${item.id}/analysis`
                          }
                          className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition ${
                            isCalculated
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          <Calculator className="h-4 w-4" />

                          {isCalculated
                            ? "APU"
                            : "Completar"}
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50">
            <td
              colSpan={5}
              className="px-5 py-4 text-right text-sm font-bold uppercase tracking-wider text-slate-500"
            >
              Subtotal del capítulo
            </td>

            <td className="whitespace-nowrap px-5 py-4 text-right text-lg font-black">
              {formatCurrency(chapterSubtotal)}
            </td>

            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PriceSourceBadge({
  source,
  hasCalculatedApu,
}: {
  source: BudgetItemPriceSource;
  hasCalculatedApu: boolean;
}) {
  if (source === "manual") {
    return (
      <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
        Manual
      </span>
    );
  }

  if (hasCalculatedApu) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        APU
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
      Sin precio
    </span>
  );
}

function sanitizeNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function formatNumber(
  value: number,
  maximumFractionDigits = 2,
): string {
  return value.toLocaleString("es-DO", {
    maximumFractionDigits,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}