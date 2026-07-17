"use client";

import {
  CheckCircle2,
  Library,
  Plus,
  Search,
  X,
} from "lucide-react";
import { type FormEvent, useMemo } from "react";

import { LibraryService } from "@/services/library.service";
import type { ResourceType } from "@/types/budget";
import type { LibraryResource } from "@/types/library";

export type ResourceCreationMode = "library" | "manual";

interface ResourceFormModalProps {
  type: ResourceType;
  mode: ResourceCreationMode;
  librarySearch: string;
  selectedLibraryResourceId: string | null;
  code: string;
  name: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  wastePercentage: string;
  onModeChange: (mode: ResourceCreationMode) => void;
  onLibrarySearchChange: (value: string) => void;
  onLibraryResourceSelect: (
    resource: LibraryResource,
  ) => void;
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

export default function ResourceFormModal({
  type,
  mode,
  librarySearch,
  selectedLibraryResourceId,
  code,
  name,
  unit,
  quantity,
  unitPrice,
  wastePercentage,
  onModeChange,
  onLibrarySearchChange,
  onLibraryResourceSelect,
  onCodeChange,
  onNameChange,
  onUnitChange,
  onQuantityChange,
  onUnitPriceChange,
  onWasteChange,
  onSubmit,
  onClose,
}: ResourceFormModalProps) {
  const title = getResourceTypeLabel(type);

  const libraryResources = useMemo(
    () => LibraryService.search(librarySearch, type),
    [librarySearch, type],
  );

  const canSubmit =
    Boolean(name.trim()) &&
    quantityIsValid(quantity) &&
    priceIsValid(unitPrice) &&
    (mode === "manual" ||
      Boolean(selectedLibraryResourceId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <ModalHeader
          eyebrow="Nuevo recurso"
          title={`Agregar ${title.toLowerCase()}`}
          onClose={onClose}
        />

        <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onModeChange("library")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === "library"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Library className="h-4 w-4" />
            Desde biblioteca
          </button>

          <button
            type="button"
            onClick={() => onModeChange("manual")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === "manual"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus className="h-4 w-4" />
            Recurso manual
          </button>
        </div>

        {mode === "library" && (
          <div className="mt-7">
            <label className="text-sm font-medium text-slate-700">
              Buscar en la biblioteca
            </label>

            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                autoFocus
                value={librarySearch}
                onChange={(event) =>
                  onLibrarySearchChange(event.target.value)
                }
                placeholder={`Buscar ${title.toLowerCase()} por nombre, código o proveedor`}
                className="nexus-input pl-12"
              />
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-2">
              {libraryResources.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Library className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-sm font-medium text-slate-500">
                    No encontramos recursos
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Prueba otra búsqueda o utiliza la opción de
                    recurso manual.
                  </p>
                </div>
              ) : (
                libraryResources.map((libraryResource) => {
                  const isSelected =
                    libraryResource.id ===
                    selectedLibraryResourceId;

                  return (
                    <button
                      key={libraryResource.id}
                      type="button"
                      onClick={() =>
                        onLibraryResourceSelect(
                          libraryResource,
                        )
                      }
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {libraryResource.name}
                            </p>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                              {libraryResource.code}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            Unidad: {libraryResource.unit}
                            {libraryResource.supplier
                              ? ` · ${libraryResource.supplier}`
                              : ""}
                          </p>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="font-bold text-slate-900">
                            {formatCurrency(
                              libraryResource.defaultUnitPrice,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Precio de referencia
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {mode === "manual" && (
          <ManualResourceFields
            type={type}
            code={code}
            name={name}
            unit={unit}
            onCodeChange={onCodeChange}
            onNameChange={onNameChange}
            onUnitChange={onUnitChange}
          />
        )}

        {(mode === "manual" ||
          selectedLibraryResourceId) && (
          <ResourceCostFields
            type={type}
            name={name}
            code={code}
            unit={unit}
            quantity={quantity}
            unitPrice={unitPrice}
            wastePercentage={wastePercentage}
            showSelectedResource={mode === "library"}
            onQuantityChange={onQuantityChange}
            onUnitPriceChange={onUnitPriceChange}
            onWasteChange={onWasteChange}
          />
        )}

        <ModalActions
          submitLabel="Agregar al APU"
          disabled={!canSubmit}
          onClose={onClose}
        />
      </form>
    </div>
  );
}

function ManualResourceFields({
  type,
  code,
  name,
  unit,
  onCodeChange,
  onNameChange,
  onUnitChange,
}: {
  type: ResourceType;
  code: string;
  name: string;
  unit: string;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
}) {
  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2">
      <div>
        <label className="text-sm font-medium text-slate-700">
          Código
        </label>

        <input
          value={code}
          onChange={(event) =>
            onCodeChange(event.target.value)
          }
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
          onChange={(event) =>
            onUnitChange(event.target.value)
          }
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
          onChange={(event) =>
            onNameChange(event.target.value)
          }
          placeholder={getResourcePlaceholder(type)}
          className="nexus-input mt-2"
        />
      </div>
    </div>
  );
}

function ResourceCostFields({
  type,
  name,
  code,
  unit,
  quantity,
  unitPrice,
  wastePercentage,
  showSelectedResource,
  onQuantityChange,
  onUnitPriceChange,
  onWasteChange,
}: {
  type: ResourceType;
  name: string;
  code: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  wastePercentage: string;
  showSelectedResource: boolean;
  onQuantityChange: (value: string) => void;
  onUnitPriceChange: (value: string) => void;
  onWasteChange: (value: string) => void;
}) {
  return (
    <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {showSelectedResource && (
        <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              {name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {code} · {unit}
            </p>
          </div>

          <p className="text-sm font-medium text-blue-700">
            Recurso seleccionado
          </p>
        </div>
      )}

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
            onChange={(event) =>
              onQuantityChange(event.target.value)
            }
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
            onChange={(event) =>
              onUnitPriceChange(event.target.value)
            }
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
              onChange={(event) =>
                onWasteChange(event.target.value)
              }
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
                type === "material"
                  ? wastePercentage
                  : "0",
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          {title}
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
  );
}

function ModalActions({
  submitLabel,
  disabled,
  onClose,
}: {
  submitLabel: string;
  disabled: boolean;
  onClose: () => void;
}) {
  return (
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
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CheckCircle2 className="h-5 w-5" />
        {submitLabel}
      </button>
    </div>
  );
}

function getResourceTypeLabel(type: ResourceType): string {
  const labels: Record<ResourceType, string> = {
    material: "Material",
    labor: "Mano de obra",
    equipment: "Equipo",
    subcontract: "Subcontrato",
  };

  return labels[type];
}

function getResourcePlaceholder(
  type: ResourceType,
): string {
  const placeholders: Record<ResourceType, string> = {
    material: "Ej. Cemento gris tipo Portland",
    labor: "Ej. Maestro de obra",
    equipment: "Ej. Retroexcavadora",
    subcontract: "Ej. Instalación especializada",
  };

  return placeholders[type];
}

function quantityIsValid(value: string): boolean {
  if (!value.trim()) {
    return false;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0;
}

function priceIsValid(value: string): boolean {
  if (!value.trim()) {
    return false;
  }

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

  return (
    safeQuantity *
    safeUnitPrice *
    (1 + safeWaste / 100)
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}