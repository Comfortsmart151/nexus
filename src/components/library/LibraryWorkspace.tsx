"use client";

import Link from "next/link";
import { librarySearchScore } from "@/services/librarySearch.service";

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

import LibraryFilters, { type AuditFilter } from "@/components/library/LibraryFilters";
import LibraryHeader from "@/components/library/LibraryHeader";
import LibraryImportModal from "@/components/library/LibraryImportModal";
import LibraryStats from "@/components/library/LibraryStats";
import LibraryTable from "@/components/library/LibraryTable";
import LibraryNormalizationPanel from "@/components/library/LibraryNormalizationPanel";
import PriceHistoryModal from "@/components/library/PriceHistoryModal";
import ResourceModal from "@/components/library/ResourceModal";

import { LibraryService } from "@/services/library.service";
import { LibraryAuditService } from "@/services/libraryAudit.service";
import { LibraryNormalizationService, type LibraryNormalizationProposal } from "@/services/libraryNormalization.service";

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
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");
  const [loaded, setLoaded] = useState(false);
  const [normalizationOpen, setNormalizationOpen] = useState(false);

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Biblioteca Maestra NEXUS 2026.09.07: migración completa, idempotente
    // y no destructiva para recursos locales creados por el usuario.
    LibraryService.migrateNexusMasterLibrary();
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

  const auditResults = useMemo(() => LibraryAuditService.audit(resources), [resources]);
  const normalizationProposals = useMemo(() => LibraryNormalizationService.proposals(resources), [resources]);

  const auditCounts = useMemo(() => {
    const counts: Record<AuditFilter, number> = {
      all: resources.length, validated: 0, "needs-validation": 0, "possible-duplicate": 0,
      "no-price": 0, "historical-price": 0, "review-unit": 0, "waste-in-name": 0, "review-classification": 0,
    };
    auditResults.forEach((audit) => {
      audit.flags.forEach((flag) => {
        if (flag in counts) {
          counts[flag as AuditFilter] += 1;
        }
      });
    });
    return counts;
  }, [resources, auditResults]);

  const filteredResources = useMemo(() => {

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
        if (auditFilter !== "all" && !auditResults.get(resource.id)?.flags.includes(auditFilter)) {
          return false;
        }
        return true;
      })
      .map((resource) => ({
        resource,
        searchScore: searchTerm.trim() ? librarySearchScore(resource, searchTerm) : 1,
      }))
      .filter(({ searchScore }) => searchScore > 0)
      .sort((a, b) => {
        if (searchTerm.trim() && a.searchScore !== b.searchScore) {
          return b.searchScore - a.searchScore;
        }
        if (a.resource.isFavorite !== b.resource.isFavorite) {
          return a.resource.isFavorite ? -1 : 1;
        }
        return a.resource.name.localeCompare(b.resource.name, "es");
      })
      .map(({ resource }) => resource);
  }, [
    resources,
    activeFilter,
    searchTerm,
    categoryFilter,
    auditFilter,
    auditResults,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

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


  function validateData(resource: LibraryResource) {
    const confirmed = window.confirm(`¿Confirmas que revisaste los datos y la clasificación de “${resource.name}”?`);
    if (!confirmed) return;
    LibraryService.update(resource.id, { dataReviewedAt: new Date().toISOString() });
    loadResources();
  }

  function validatePrice(resource: LibraryResource) {
    const confirmed = window.confirm(`¿Confirmas que RD$${resource.defaultUnitPrice.toLocaleString("es-DO", { minimumFractionDigits: 2 })} es un precio vigente para “${resource.name}”?`);
    if (!confirmed) return;
    LibraryService.update(resource.id, { priceValidatedAt: new Date().toISOString(), priceUpdatedAt: new Date().toISOString() });
    loadResources();
  }

  function mergeResource(resource: LibraryResource) {
    const audit = auditResults.get(resource.id);
    if (!audit || audit.duplicateIds.length === 0) return;
    const candidates = resources.filter((item) => audit.duplicateIds.includes(item.id));
    const target = [resource, ...candidates]
      .sort((a, b) => {
        const aWaste = /desp|merma|\+\s*\d+\s*%/i.test(a.name) ? 1 : 0;
        const bWaste = /desp|merma|\+\s*\d+\s*%/i.test(b.name) ? 1 : 0;
        return aWaste - bWaste || a.name.length - b.name.length;
      })[0];
    const sources = [resource, ...candidates].filter((item) => item.id !== target.id);
    const confirmed = window.confirm(
      `NEXUS propone conservar “${target.name}” como recurso maestro y archivar ${sources.length} variante(s): ${sources.map((item) => item.name).join(", ")}.\n\nNo se borrarán; quedarán inactivas y su historial de precios se conservará en el recurso maestro. ¿Continuar?`,
    );
    if (!confirmed) return;
    sources.forEach((source) => LibraryService.mergeInto(source.id, target.id));
    loadResources();
  }

  function applyNormalizations(selected: LibraryNormalizationProposal[]) {
    if (selected.length === 0) return;
    const byResource = new Map<string, LibraryNormalizationProposal[]>();
    selected.forEach((proposal) => byResource.set(proposal.resourceId, [...(byResource.get(proposal.resourceId) ?? []), proposal]));
    const items = Array.from(byResource.entries()).map(([resourceId, proposals]) => ({
      resourceId,
      changes: Object.assign({}, ...proposals.map((proposal) => proposal.changes)),
    }));
    const confirmed = window.confirm(`CONFIRMACIÓN DE NORMALIZACIÓN\n\nSe aplicarán ${selected.length} propuestas sobre ${items.length} recursos.\n\nEsta acción modificará nombres, clasificación, fuente y/o desperdicio sugerido según la selección. No se borrarán precios, códigos ni historial.\n\n¿Confirmas que deseas aplicar exactamente esta selección?`);
    if (!confirmed) return;
    LibraryService.applyNormalizations(items);
    loadResources();
    setNormalizationOpen(false);
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

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={selectFavorites}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeFilter === "favorites" ? "bg-amber-50 text-amber-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Favoritos ({totalFavorites})
            </button>
          </div>

          <LibraryStats
            activeFilter={activeFilter}
            countByType={countByType}
            onSelectType={selectResourceType}
          />

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div><p className="text-sm font-semibold text-slate-700">Normalización inteligente</p><p className="text-xs text-slate-500">{normalizationProposals.length} propuestas disponibles sin aplicar</p></div>
              <button type="button" onClick={() => setNormalizationOpen((value) => !value)} className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">{normalizationOpen ? "Ocultar propuestas" : "Revisar propuestas"}</button>
            </div>
            {normalizationOpen && <LibraryNormalizationPanel proposals={normalizationProposals} onApply={applyNormalizations} onClose={() => setNormalizationOpen(false)} />}
            <LibraryFilters
              activeFilter={activeFilter}
              categoryFilter={categoryFilter}
              searchTerm={searchTerm}
              availableCategories={
                availableCategories
              }
              visibleCount={filteredResources.length}
              auditFilter={auditFilter}
              auditCounts={auditCounts}
              onSelectAll={selectAllResources}
              onSelectFavorites={selectFavorites}
              onCategoryChange={setCategoryFilter}
              onSearchChange={setSearchTerm}
              onAuditFilterChange={setAuditFilter}
            />

            <LibraryTable
              resources={filteredResources}
              resourceTypes={resourceTypes}
              onToggleFavorite={toggleFavorite}
              onEdit={openEditModal}
              onDelete={deleteResource}
              onHistory={setHistoryResource}
              onMerge={mergeResource}
              onValidateData={validateData}
              onValidatePrice={validatePrice}
              auditResults={auditResults}
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