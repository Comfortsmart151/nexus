"use client";

import {
  Boxes,
  BriefcaseBusiness,
  Building2,
  Edit3,
  Plus,
  Tags,
  Truck,
  X,
} from "lucide-react";

import type { ElementType, FormEvent } from "react";

import type { ResourceType } from "@/types/budget";

interface ResourceTypeOption {
  type: ResourceType;
  label: string;
  singular: string;
  description: string;
  icon: ElementType;
}

const resourceTypes: ResourceTypeOption[] = [
  {
    type: "material",
    label: "Materiales",
    singular: "Material",
    description: "Cemento, arena, acero, bloques y suministros.",
    icon: Boxes,
  },
  {
    type: "labor",
    label: "Mano de obra",
    singular: "Mano de obra",
    description: "Peones, maestros, técnicos y especialistas.",
    icon: BriefcaseBusiness,
  },
  {
    type: "equipment",
    label: "Equipos",
    singular: "Equipo",
    description: "Maquinarias, herramientas y alquileres.",
    icon: Truck,
  },
  {
    type: "subcontract",
    label: "Subcontratos",
    singular: "Subcontrato",
    description: "Trabajos especializados contratados a terceros.",
    icon: Building2,
  },
];

const units = [
  "ud",
  "funda",
  "lb",
  "kg",
  "qq",
  "ton",
  "pie",
  "pie²",
  "m",
  "m²",
  "m³",
  "gal",
  "litro",
  "hora",
  "día",
  "jornal",
  "global",
];

interface ResourceModalProps {
  editing: boolean;
  resourceType: ResourceType;
  code: string;
  name: string;
  unit: string;
  price: string;
  supplier: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  tagsText: string;
  observations: string;
  isFavorite: boolean;
  onResourceTypeChange: (value: ResourceType) => void;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onTagsTextChange: (value: string) => void;
  onObservationsChange: (value: string) => void;
  onFavoriteChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export default function ResourceModal({
  editing,
  resourceType,
  code,
  name,
  unit,
  price,
  supplier,
  description,
  category,
  subcategory,
  brand,
  tagsText,
  observations,
  isFavorite,
  onResourceTypeChange,
  onCodeChange,
  onNameChange,
  onUnitChange,
  onPriceChange,
  onSupplierChange,
  onDescriptionChange,
  onCategoryChange,
  onSubcategoryChange,
  onBrandChange,
  onTagsTextChange,
  onObservationsChange,
  onFavoriteChange,
  onSubmit,
  onClose,
}: ResourceModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Biblioteca inteligente
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {editing ? "Editar recurso" : "Nuevo recurso"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <FormField label="Tipo de recurso">
            <select
              value={resourceType}
              disabled={editing}
              onChange={(event) =>
                onResourceTypeChange(
                  event.target.value as ResourceType,
                )
              }
              className="nexus-input mt-2 disabled:bg-slate-100"
            >
              {resourceTypes.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Código">
            <input
              value={code}
              onChange={(event) =>
                onCodeChange(event.target.value)
              }
              placeholder="Se genera automáticamente"
              className="nexus-input mt-2"
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Nombre del recurso">
              <input
                autoFocus
                value={name}
                onChange={(event) =>
                  onNameChange(event.target.value)
                }
                placeholder="Ej. Cemento gris tipo Portland"
                className="nexus-input mt-2"
              />
            </FormField>
          </div>

          <FormField label="Categoría">
            <input
              value={category}
              onChange={(event) =>
                onCategoryChange(event.target.value)
              }
              placeholder="Ej. Cementos"
              className="nexus-input mt-2"
            />
          </FormField>

          <FormField label="Subcategoría">
            <input
              value={subcategory}
              onChange={(event) =>
                onSubcategoryChange(event.target.value)
              }
              placeholder="Ej. Cemento Portland"
              className="nexus-input mt-2"
            />
          </FormField>

          <FormField label="Marca">
            <input
              value={brand}
              onChange={(event) =>
                onBrandChange(event.target.value)
              }
              placeholder="Ej. Titán"
              className="nexus-input mt-2"
            />
          </FormField>

          <FormField label="Etiquetas">
            <div className="relative">
              <Tags className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={tagsText}
                onChange={(event) =>
                  onTagsTextChange(event.target.value)
                }
                placeholder="obra gris, estructura, cemento"
                className="nexus-input mt-2 pl-11"
              />
            </div>
          </FormField>
                    <FormField label="Unidad">
            <select
              value={unit}
              onChange={(event) =>
                onUnitChange(event.target.value)
              }
              className="nexus-input mt-2"
            >
              {units.map((currentUnit) => (
                <option key={currentUnit} value={currentUnit}>
                  {currentUnit}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Precio base">
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                onPriceChange(event.target.value)
              }
              placeholder="0.00"
              className="nexus-input mt-2"
            />
          </FormField>

          <div className="sm:col-span-2">
            <FormField label="Proveedor o referencia">
              <input
                value={supplier}
                onChange={(event) =>
                  onSupplierChange(event.target.value)
                }
                placeholder="Ej. Ferretería o suplidor"
                className="nexus-input mt-2"
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField label="Descripción técnica">
              <textarea
                value={description}
                onChange={(event) =>
                  onDescriptionChange(event.target.value)
                }
                rows={3}
                placeholder="Presentación, especificaciones o características..."
                className="nexus-input mt-2 resize-none"
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField label="Observaciones">
              <textarea
                value={observations}
                onChange={(event) =>
                  onObservationsChange(event.target.value)
                }
                rows={3}
                placeholder="Condiciones comerciales, disponibilidad o notas internas..."
                className="nexus-input mt-2 resize-none"
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-800">
                  Recurso favorito
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Los favoritos aparecerán primero en la biblioteca.
                </p>
              </div>

              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(event) =>
                  onFavoriteChange(event.target.checked)
                }
                className="h-5 w-5 rounded border-slate-300 text-blue-600"
              />
            </label>
          </div>
        </div>

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
            disabled={
              !name.trim() ||
              price === "" ||
              Number(price) < 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {editing ? (
              <Edit3 className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}

            {editing ? "Guardar cambios" : "Crear recurso"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}