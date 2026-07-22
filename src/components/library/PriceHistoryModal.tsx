"use client";

import { History, X } from "lucide-react";

import type { LibraryResource } from "@/types/library";

interface PriceHistoryModalProps {
  resource: LibraryResource;
  onClose: () => void;
}

export default function PriceHistoryModal({
  resource,
  onClose,
}: PriceHistoryModalProps) {
  const entries = [...resource.priceHistory].sort(
    (a, b) =>
      new Date(b.registeredAt).getTime() -
      new Date(a.registeredAt).getTime(),
  );

  const averagePrice =
    entries.length > 0
      ? entries.reduce(
          (total, entry) => total + entry.price,
          0,
        ) / entries.length
      : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Historial de precios
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {resource.name}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {resource.code} · {resource.unit}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-700">
              Precio actual
            </p>

            <p className="mt-2 text-2xl font-black text-blue-950">
              {formatCurrency(resource.defaultUnitPrice)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-100 p-5">
            <p className="text-sm font-semibold text-slate-600">
              Precio promedio
            </p>

            <p className="mt-2 text-2xl font-black text-slate-950">
              {formatCurrency(averagePrice)}
            </p>
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <History className="h-4 w-4 text-blue-600" />

            <h3 className="font-semibold text-slate-800">
              Registros
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-950">
                    {formatCurrency(entry.price)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {entry.supplier ||
                      "Proveedor no especificado"}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(entry.registeredAt)}
                  </p>

                  {index === 0 && (
                    <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Precio vigente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Cerrar historial
        </button>
      </div>
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