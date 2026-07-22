"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Truck,
} from "lucide-react";

import {
  type ElementType,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import LibraryFilters from "@/components/library/LibraryFilters";
import LibraryHeader from "@/components/library/LibraryHeader";
import LibraryImportModal from "@/components/library/LibraryImportModal";
import LibrarySidebar from "@/components/library/LibrarySidebar";
import LibraryStats from "@/components/library/LibraryStats";
import LibraryTable from "@/components/library/LibraryTable";
import PriceHistoryModal from "@/components/library/PriceHistoryModal";
import ResourceModal from "@/components/library/ResourceModal";

import { LibraryService } from "@/services/library.service";

import type { ResourceType } from "@/types/budget";
import type {
  LibraryImportResult,
  LibraryResource,
} from "@/types/library";

type LibraryFilter = "all" | "favorites" | ResourceType;

interface ResourceTypeOption {
  type: ResourceType;
  label: string;
  icon: ElementType;
}

const resourceTypes: ResourceTypeOption[] = [
  {
    type: "material",
    label: "Materiales",
    icon: Boxes,
  },
  {
    type: "labor",
    label: "Mano de obra",
    icon: BriefcaseBusiness,
  },
  {
    type: "equipment",
    label: "Equipos",
    icon: Truck,
  },
  {
    type: "subcontract",
    label: "Subcontratos",
    icon: Building2,
  },
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
  const [importModalOpen, setImportModalOpen] =
    useState(false);

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
      resources.filter((resource) => resource.isFavorite)
        .length,
    [resources],
  );

  function countByType(type: ResourceType) {
    return resources.filter(
      (resource) => resource.type === type,
    ).length;
  }

  function clearForm() {
    setEditingResource(null);

    setResourceType(
      activeFilter !== "all" &&
        activeFilter !== "favorites"
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

  function openImportModal() {
    setImportModalOpen(true);
  }

  function closeImportModal() {
    setImportModalOpen(false);
  }

  function handleImported(
    _result: LibraryImportResult,
  ) {
    loadResources();
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

  function saveResource(
    event: FormEvent<HTMLFormElement>,
  ) {
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

  function selectAllResources() {
    setActiveFilter("all");
    setCategoryFilter("");
  }

  function selectFavorites() {
    setActiveFilter("favorites");
    setCategoryFilter("");
  }

  function selectResourceType(type: ResourceType) {
    setActiveFilter(type);
    setCategoryFilter("");
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
        <LibrarySidebar
          totalFavorites={totalFavorites}
          favoritesSelected={
            activeFilter === "favorites"
          }
          onSelectFavorites={selectFavorites}
        />

        <section className="min-w-0 flex-1 p-6 lg:p-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>

          <LibraryHeader
            onCreateResource={openCreateModal}
            onImportResources={openImportModal}
          />

          <LibraryStats
            activeFilter={activeFilter}
            countByType={countByType}
            onSelectType={selectResourceType}
          />

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <LibraryFilters
              activeFilter={activeFilter}
              categoryFilter={categoryFilter}
              searchTerm={searchTerm}
              availableCategories={
                availableCategories
              }
              visibleCount={filteredResources.length}
              onSelectAll={selectAllResources}
              onSelectFavorites={selectFavorites}
              onCategoryChange={setCategoryFilter}
              onSearchChange={setSearchTerm}
            />

            <LibraryTable
              resources={filteredResources}
              resourceTypes={resourceTypes}
              onToggleFavorite={toggleFavorite}
              onEdit={openEditModal}
              onDelete={deleteResource}
              onHistory={setHistoryResource}
            />

            {filteredResources.length === 0 && (
              <div className="border-t border-slate-100 px-6 pb-10 text-center">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
                >
                  Crear recurso
                </button>
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

      {importModalOpen && (
        <LibraryImportModal
          onClose={closeImportModal}
          onImported={handleImported}
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