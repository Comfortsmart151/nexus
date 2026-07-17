"use client";

import { CheckCircle2, Library, X } from "lucide-react";
import type { FormEvent } from "react";

import type { CostResource, ResourceType } from "@/types/budget";

interface EditResourceModalProps {
  resource: CostResource;
  code: string;
  name: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  wastePercentage: string;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onUnitPriceChange: (value: string) => void;
  onWasteChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const resourceUnits = [
  "ud",
  "funda",
  "m",
  "m²",
  "m³",
  "kg",
  "lb",
  "ton",
  "gal",
  "litro",
  "día",
  "hora",
  "jornal",
  "global",
];

export default function EditResourceModal({
  resource,
  code,
  name,
  unit,
  quantity,
  unitPrice,
  wastePercentage,
  onCodeChange,
  onNameChange,
  onUnitChange,
  onQuantityChange,
  onUnitPriceChange,
  onWasteChange,
  onSubmit,
  onClose,
}: EditResourceModalProps) {
  const canSubmit =
    Boolean(name.trim()) &&
    quantityIsValid(quantity) &&
    priceIsValid(unitPrice);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Editar recurso
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {resource.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {resource.libraryResourceId && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <Library className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                Recurso vinculado a la biblioteca
              </p>

              <p className="mt-1 text-sm text-blue-700">
                Los cambios realizados aquí solo afectarán este APU. El
                recurso original de la biblioteca permanecerá sin cambios.
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Código
            </label>

            <input
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              placeholder="Opcional"
              className="nexus-input mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Unidad
            </label>

            <select
              value={unit}
              onChange={(event) => onUnitChange(event.target.value)}
              className="nexus-input mt-2"
            >
              {resourceUnits.map((currentUnit) => (
                <option key={currentUnit} value={currentUnit}>
                  {currentUnit}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Nombre del recurso
            </label>

            <input
              autoFocus
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="nexus-input mt-2"
            />
          </div>
        </div>

        <ResourceCostFields
          type={resource.type}
          quantity={quantity}
          unitPrice={unitPrice}
          wastePercentage={wastePercentage}
          onQuantityChange={onQuantityChange}
          onUnitPriceChange={onUnitPriceChange}
          onWasteChange={onWasteChange}
        />

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 className="h-5 w-5" />
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}

function ResourceCostFields({
  type,
  quantity,
  unitPrice,
  wastePercentage,
  onQuantityChange,
  onUnitPriceChange,
  onWasteChange,
}: {
  type: ResourceType;
  quantity: string;
  unitPrice: string;
  wastePercentage: string;
  onQuantityChange: (value: string) => void;
  onUnitPriceChange: (value: string) => void;
  onWasteChange: (value: string) => void;
}) {
  return (
    <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Cantidad por unidad de partida
          </label>

          <input
            type="number"
            min="0.0001"
            step="0.0001"
            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            className="nexus-input mt-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Precio unitario
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(event) => onUnitPriceChange(event.target.value)}
            placeholder="0.00"
            className="nexus-input mt-2"
          />
        </div>

        {type === "material" && (
          <div>
            <label className="text-sm font-medium text-slate-700">
              Desperdicio (%)
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={wastePercentage}
              onChange={(event) => onWasteChange(event.target.value)}
              className="nexus-input mt-2"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700">
            Importe estimado
          </label>

          <div className="mt-2 flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-900">
            {formatCurrency(
              calculatePreviewTotal(
                quantity,
                unitPrice,
                type === "material" ? wastePercentage : "0",
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function quantityIsValid(value: string): boolean {
  if (!value.trim()) return false;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0;
}

function priceIsValid(value: string): boolean {
  if (!value.trim()) return false;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0;
}

function calculatePreviewTotal(
  quantity: string,
  unitPrice: string,
  wastePercentage: string,
): number {
  const parsedQuantity = Number(quantity);
  const parsedUnitPrice = Number(unitPrice);
  const parsedWaste = Number(wastePercentage);

  if (
    !Number.isFinite(parsedQuantity) ||
    !Number.isFinite(parsedUnitPrice)
  ) {
    return 0;
  }

  const safeQuantity = Math.max(0, parsedQuantity);
  const safeUnitPrice = Math.max(0, parsedUnitPrice);
  const safeWaste = Number.isFinite(parsedWaste)
    ? Math.max(0, parsedWaste)
    : 0;

  return safeQuantity * safeUnitPrice * (1 + safeWaste / 100);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}