"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Edit3,
  Library,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  type ElementType,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import NexusLogo from "@/components/ui/NexusLogo";
import { LibraryService } from "@/services/library.service";
import type { ResourceType } from "@/types/budget";
import type { LibraryResource } from "@/types/library";

type LibraryFilter = "all" | ResourceType;

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

export default function LibraryWorkspace() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [activeFilter, setActiveFilter] =
    useState<LibraryFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] =
    useState<LibraryResource | null>(null);

  const [resourceType, setResourceType] =
    useState<ResourceType>("material");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("ud");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [description, setDescription] = useState("");

  function loadResources() {
    setResources(LibraryService.findActive());
  }

  useEffect(() => {
  LibraryService.seedInitialLibrary();
  loadResources();
  setLoaded(true);
}, []);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return resources
      .filter(
        (resource) =>
          activeFilter === "all" ||
          resource.type === activeFilter,
      )
      .filter((resource) => {
        if (!normalizedSearch) return true;

        const searchableText = [
          resource.code,
          resource.name,
          resource.unit,
          resource.supplier ?? "",
          resource.description ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [resources, activeFilter, searchTerm]);

  function countByType(type: ResourceType) {
    return resources.filter((resource) => resource.type === type)
      .length;
  }

  function clearForm() {
    setEditingResource(null);
    setResourceType(
      activeFilter === "all" ? "material" : activeFilter,
    );
    setCode("");
    setName("");
    setUnit("ud");
    setPrice("");
    setSupplier("");
    setDescription("");
  }

  function openCreateModal() {
    clearForm();
    setModalOpen(true);
  }

  function openEditModal(resource: LibraryResource) {
    setEditingResource(resource);
    setResourceType(resource.type);
    setCode(resource.code);
    setName(resource.name);
    setUnit(resource.unit);
    setPrice(resource.defaultUnitPrice.toString());
    setSupplier(resource.supplier ?? "");
    setDescription(resource.description ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    clearForm();
  }

  function saveResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();
    const parsedPrice = Number(price);

    if (
      !cleanName ||
      !unit.trim() ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return;
    }

    if (editingResource) {
      LibraryService.update(editingResource.id, {
        code,
        name: cleanName,
        unit,
        defaultUnitPrice: parsedPrice,
        supplier,
        description,
      });
    } else {
      LibraryService.create({
        code,
        type: resourceType,
        name: cleanName,
        unit,
        defaultUnitPrice: parsedPrice,
        supplier,
        description,
      });
    }

    loadResources();
    closeModal();
  }

  function deleteResource(resource: LibraryResource) {
    const confirmed = window.confirm(
      `¿Deseas eliminar “${resource.name}” de la biblioteca?`,
    );

    if (!confirmed) return;

    LibraryService.delete(resource.id);
    loadResources();
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Cargando biblioteca...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <NexusLogo size="sm" />

          <Link
            href="/dashboard"
            className="mt-10 flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al Dashboard
          </Link>

          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <Library className="h-5 w-5" />
            </div>

            <p className="mt-5 text-xs uppercase tracking-wider text-slate-400">
              Biblioteca maestra
            </p>

            <p className="mt-2 font-semibold">
              Recursos de costos
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Precios y recursos reutilizables en todos los
              presupuestos.
            </p>
          </div>

          <div className="mt-auto text-sm text-slate-500">
            Powered by Ingeniería González
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-6 lg:p-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>

          <header className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Base de datos maestra
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Biblioteca de recursos
              </h1>

              <p className="mt-3 max-w-2xl text-slate-500">
                Registra materiales, mano de obra, equipos y
                subcontratos para reutilizarlos en todos los APU.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500"
            >
              <Plus className="h-5 w-5" />
              Nuevo recurso
            </button>
          </header>

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
                  onClick={() =>
                    setActiveFilter(resourceOption.type)
                  }
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

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Recursos registrados
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredResources.length}{" "}
                  {filteredResources.length === 1
                    ? "recurso visible"
                    : "recursos visibles"}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    activeFilter === "all"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-blue-300"
                  }`}
                >
                  Ver todos
                </button>

                <div className="relative min-w-0 sm:w-80">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Buscar código, recurso o proveedor..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Library className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  No hay recursos registrados
                </h3>

                <p className="mt-2 max-w-md text-slate-500">
                  Crea el primer recurso de la biblioteca o cambia
                  los filtros de búsqueda.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
                >
                  <Plus className="h-5 w-5" />
                  Crear recurso
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Código</th>
                      <th className="px-6 py-4">Recurso</th>
                      <th className="px-6 py-4">Tipo</th>
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4 text-right">
                        Precio base
                      </th>
                      <th className="px-6 py-4">Proveedor</th>
                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredResources.map((resource) => {
                      const typeData = resourceTypes.find(
                        (option) =>
                          option.type === resource.type,
                      );

                      const Icon = typeData?.icon ?? Library;

                      return (
                        <tr
                          key={resource.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5 font-semibold text-blue-700">
                            {resource.code}
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

                                {resource.description && (
                                  <p className="mt-1 max-w-sm truncate text-sm text-slate-500">
                                    {resource.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              {typeData?.label ?? resource.type}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-slate-600">
                            {resource.unit}
                          </td>

                          <td className="px-6 py-5 text-right font-semibold">
                            {formatCurrency(
                              resource.defaultUnitPrice,
                            )}
                          </td>

                          <td className="px-6 py-5 text-slate-500">
                            {resource.supplier || "No especificado"}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(resource)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                              >
                                <Edit3 className="h-4 w-4" />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteResource(resource)
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
                </table>
              </div>
            )}
          </section>
        </section>
      </div>

      {modalOpen && (
        <ResourceModal
          editing={Boolean(editingResource)}
          resourceType={resourceType}
          code={code}
          name={name}
          unit={unit}
          price={price}
          supplier={supplier}
          description={description}
          onResourceTypeChange={setResourceType}
          onCodeChange={setCode}
          onNameChange={setName}
          onUnitChange={setUnit}
          onPriceChange={setPrice}
          onSupplierChange={setSupplier}
          onDescriptionChange={setDescription}
          onSubmit={saveResource}
          onClose={closeModal}
        />
      )}
    </main>
  );
}

function ResourceModal({
  editing,
  resourceType,
  code,
  name,
  unit,
  price,
  supplier,
  description,
  onResourceTypeChange,
  onCodeChange,
  onNameChange,
  onUnitChange,
  onPriceChange,
  onSupplierChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}: {
  editing: boolean;
  resourceType: ResourceType;
  code: string;
  name: string;
  unit: string;
  price: string;
  supplier: string;
  description: string;
  onResourceTypeChange: (value: ResourceType) => void;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Biblioteca maestra
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {editing ? "Editar recurso" : "Nuevo recurso"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Tipo de recurso
            </label>

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
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Código
            </label>

            <input
              value={code}
              onChange={(event) =>
                onCodeChange(event.target.value)
              }
              placeholder="Se genera automáticamente"
              className="nexus-input mt-2"
            />
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
              placeholder="Ej. Cemento gris tipo Portland"
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
              {units.map((currentUnit) => (
                <option key={currentUnit} value={currentUnit}>
                  {currentUnit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Precio base
            </label>

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
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Proveedor o referencia
            </label>

            <input
              value={supplier}
              onChange={(event) =>
                onSupplierChange(event.target.value)
              }
              placeholder="Ej. Ferretería, suplidor o fuente del precio"
              className="nexus-input mt-2"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Descripción
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                onDescriptionChange(event.target.value)
              }
              rows={3}
              placeholder="Notas técnicas, especificaciones o presentación..."
              className="nexus-input mt-2 resize-none"
            />
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
              !price ||
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}