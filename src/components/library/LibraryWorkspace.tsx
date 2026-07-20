"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Edit3,
  FolderTree,
  History,
  Library,
  Plus,
  Search,
  Star,
  Tags,
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

type LibraryFilter = "all" | "favorites" | ResourceType;

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
  const [resources, setResources] = useState<LibraryResource[]>(
    [],
  );

  const [activeFilter, setActiveFilter] =
    useState<LibraryFilter>("all");

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingResource, setEditingResource] =
    useState<LibraryResource | null>(null);

  const [historyResource, setHistoryResource] =
    useState<LibraryResource | null>(null);

  const [resourceType, setResourceType] =
    useState<ResourceType>("material");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("ud");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [observations, setObservations] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  function loadResources() {
    setResources(LibraryService.findActive());
  }

  useEffect(() => {
    LibraryService.seedInitialLibrary();
    loadResources();
    setLoaded(true);
  }, []);

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        resources
          .map((resource) => resource.category?.trim() ?? "")
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return resources
      .filter((resource) => {
        if (activeFilter === "all") {
          return true;
        }

        if (activeFilter === "favorites") {
          return resource.isFavorite;
        }

        return resource.type === activeFilter;
      })
      .filter((resource) => {
        if (!categoryFilter) {
          return true;
        }

        return resource.category === categoryFilter;
      })
      .filter((resource) => {
        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          resource.code,
          resource.name,
          resource.unit,
          resource.supplier ?? "",
          resource.description ?? "",
          resource.category ?? "",
          resource.subcategory ?? "",
          resource.brand ?? "",
          resource.observations ?? "",
          ...resource.tags,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return a.isFavorite ? -1 : 1;
        }

        return a.name.localeCompare(b.name, "es");
      });
  }, [
    resources,
    activeFilter,
    searchTerm,
    categoryFilter,
  ]);

  const totalFavorites = useMemo(
    () =>
      resources.filter((resource) => resource.isFavorite).length,
    [resources],
  );

  function countByType(type: ResourceType) {
    return resources.filter((resource) => resource.type === type)
      .length;
  }

  function clearForm() {
    setEditingResource(null);

    setResourceType(
      activeFilter !== "all" && activeFilter !== "favorites"
        ? activeFilter
        : "material",
    );

    setCode("");
    setName("");
    setUnit("ud");
    setPrice("");
    setSupplier("");
    setDescription("");

    setCategory("");
    setSubcategory("");
    setBrand("");
    setTagsText("");
    setObservations("");
    setIsFavorite(false);
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

    setCategory(resource.category ?? "");
    setSubcategory(resource.subcategory ?? "");
    setBrand(resource.brand ?? "");
    setTagsText(resource.tags.join(", "));
    setObservations(resource.observations ?? "");
    setIsFavorite(resource.isFavorite);

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

    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingResource) {
      LibraryService.update(editingResource.id, {
        code,
        name: cleanName,
        unit,
        defaultUnitPrice: parsedPrice,
        supplier,
        description,
        category,
        subcategory,
        brand,
        tags,
        observations,
        isFavorite,
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
        category,
        subcategory,
        brand,
        tags,
        observations,
        isFavorite,
      });
    }

    loadResources();
    closeModal();
  }

  function toggleFavorite(resource: LibraryResource) {
    LibraryService.toggleFavorite(resource.id);
    loadResources();
  }

  function deleteResource(resource: LibraryResource) {
    const confirmed = window.confirm(
      `¿Deseas eliminar “${resource.name}” de la biblioteca?`,
    );

    if (!confirmed) {
      return;
    }

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
              Biblioteca inteligente
            </p>

            <p className="mt-2 font-semibold">
              Recursos de costos
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Precios, categorías e historial reutilizable en
              todos los presupuestos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("favorites");
              setCategoryFilter("");
            }}
            className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeFilter === "favorites"
                ? "bg-amber-50 text-amber-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favoritos
            </span>

            <span>{totalFavorites}</span>
          </button>

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
                Organiza recursos, proveedores, marcas, precios e
                historial para reutilizarlos en todos los APU.
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
                  onClick={() => {
                    setActiveFilter(resourceOption.type);
                    setCategoryFilter("");
                  }}
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
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
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

                <div className="flex flex-col gap-3 lg:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter("all");
                      setCategoryFilter("");
                    }}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      activeFilter === "all"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    Ver todos
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter("favorites");
                      setCategoryFilter("");
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      activeFilter === "favorites"
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-600 hover:border-amber-300"
                    }`}
                  >
                    <Star className="h-4 w-4" />
                    Favoritos
                  </button>

                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Todas las categorías</option>

                    {availableCategories.map((currentCategory) => (
                      <option
                        key={currentCategory}
                        value={currentCategory}
                      >
                        {currentCategory}
                      </option>
                    ))}
                  </select>

                  <div className="relative min-w-0 lg:w-80">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Buscar recurso, marca o etiqueta..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Library className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  No hay recursos visibles
                </h3>

                <p className="mt-2 max-w-md text-slate-500">
                  Crea un recurso o cambia los filtros de búsqueda.
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
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleFavorite(resource)
                                }
                                title={
                                  resource.isFavorite
                                    ? "Quitar de favoritos"
                                    : "Agregar a favoritos"
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
                            {resource.supplier || "No especificado"}
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
                                onClick={() =>
                                  setHistoryResource(resource)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                              >
                                <History className="h-4 w-4" />
                                Historial
                              </button>

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
          category={category}
          subcategory={subcategory}
          brand={brand}
          tagsText={tagsText}
          observations={observations}
          isFavorite={isFavorite}
          onResourceTypeChange={setResourceType}
          onCodeChange={setCode}
          onNameChange={setName}
          onUnitChange={setUnit}
          onPriceChange={setPrice}
          onSupplierChange={setSupplier}
          onDescriptionChange={setDescription}
          onCategoryChange={setCategory}
          onSubcategoryChange={setSubcategory}
          onBrandChange={setBrand}
          onTagsTextChange={setTagsText}
          onObservationsChange={setObservations}
          onFavoriteChange={setIsFavorite}
          onSubmit={saveResource}
          onClose={closeModal}
        />
      )}

      {historyResource && (
        <PriceHistoryModal
          resource={historyResource}
          onClose={() => setHistoryResource(null)}
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
}: {
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
}) {
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

function PriceHistoryModal({
  resource,
  onClose,
}: {
  resource: LibraryResource;
  onClose: () => void;
}) {
  const entries = [...resource.priceHistory].sort(
    (a, b) =>
      new Date(b.registeredAt).getTime() -
      new Date(a.registeredAt).getTime(),
  );

  const averagePrice =
    entries.length > 0
      ? entries.reduce((total, entry) => total + entry.price, 0) /
        entries.length
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
                    {entry.supplier || "Proveedor no especificado"}
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