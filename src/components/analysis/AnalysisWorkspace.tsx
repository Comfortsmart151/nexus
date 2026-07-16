"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CheckCircle2,
  Hammer,
  Library,
  Pencil,
  Plus,
  Search,
  Settings2,
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
import { ApuService } from "@/services/apu.service";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { LibraryService } from "@/services/library.service";
import { ProjectService } from "@/services/project.service";
import { ResourceService } from "@/services/resource.service";
import type {
  ApuAdjustments,
  BudgetChapter,
  BudgetItem,
  CostResource,
  ResourceType,
} from "@/types/budget";
import type { LibraryResource } from "@/types/library";
import type { Project } from "@/types/project";

interface AnalysisWorkspaceProps {
  projectId: string;
  chapterId: string;
  itemId: string;
}

interface ResourceSectionData {
  type: ResourceType;
  title: string;
  description: string;
  icon: ElementType;
}

type ResourceCreationMode = "library" | "manual";

type AdjustmentField = keyof ApuAdjustments;

const resourceSections: ResourceSectionData[] = [
  {
    type: "material",
    title: "Materiales",
    description:
      "Agrega cemento, arena, acero, bloques y otros materiales.",
    icon: Boxes,
  },
  {
    type: "labor",
    title: "Mano de obra",
    description:
      "Define personal, rendimiento, jornal y costo de trabajo.",
    icon: BriefcaseBusiness,
  },
  {
    type: "equipment",
    title: "Equipos",
    description:
      "Incluye herramientas, maquinarias y equipos necesarios.",
    icon: Truck,
  },
  {
    type: "subcontract",
    title: "Subcontratos",
    description:
      "Registra trabajos especializados contratados a terceros.",
    icon: Hammer,
  },
];

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

export default function AnalysisWorkspace({
  projectId,
  chapterId,
  itemId,
}: AnalysisWorkspaceProps) {
  const [project, setProject] =
    useState<Project | null>(null);

  const [chapter, setChapter] =
    useState<BudgetChapter | null>(null);

  const [item, setItem] =
    useState<BudgetItem | null>(null);

  const [resources, setResources] =
    useState<CostResource[]>([]);

  const [loaded, setLoaded] = useState(false);

  const [activeResourceType, setActiveResourceType] =
    useState<ResourceType | null>(null);

  const [editingResource, setEditingResource] =
    useState<CostResource | null>(null);

  const [resourceCreationMode, setResourceCreationMode] =
    useState<ResourceCreationMode>("library");

  const [librarySearch, setLibrarySearch] = useState("");

  const [
    selectedLibraryResourceId,
    setSelectedLibraryResourceId,
  ] = useState<string | null>(null);

  const [resourceCode, setResourceCode] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resourceUnit, setResourceUnit] = useState("ud");

  const [resourceQuantity, setResourceQuantity] =
    useState("1");

  const [resourceUnitPrice, setResourceUnitPrice] =
    useState("");

  const [wastePercentage, setWastePercentage] =
    useState("0");

  function refreshAnalysis() {
    setResources(ApuService.getResources(itemId));
    setItem(ItemService.findById(itemId));
  }

  useEffect(() => {
    setProject(ProjectService.findById(projectId));
    setChapter(ChapterService.findById(chapterId));
    setItem(ItemService.findById(itemId));
    setResources(ApuService.getResources(itemId));
    setLoaded(true);
  }, [projectId, chapterId, itemId]);

  function resetResourceForm(type?: ResourceType) {
    setLibrarySearch("");
    setSelectedLibraryResourceId(null);
    setResourceCode("");
    setResourceName("");

    setResourceUnit(
      type === "labor" ? "jornal" : "ud",
    );

    setResourceQuantity("1");
    setResourceUnitPrice("");
    setWastePercentage("0");
  }

  function openResourceForm(type: ResourceType) {
    setEditingResource(null);
    setActiveResourceType(type);
    setResourceCreationMode("library");
    resetResourceForm(type);
  }

  function closeResourceForm() {
    setActiveResourceType(null);
    setResourceCreationMode("library");
    resetResourceForm();
  }

  function openEditResourceForm(
    resource: CostResource,
  ) {
    setActiveResourceType(null);
    setEditingResource(resource);
    setResourceCode(resource.code ?? "");
    setResourceName(resource.name);
    setResourceUnit(resource.unit);
    setResourceQuantity(String(resource.quantity));
    setResourceUnitPrice(String(resource.unitPrice));

    setWastePercentage(
      String(resource.wastePercentage ?? 0),
    );
  }

  function closeEditResourceForm() {
    setEditingResource(null);
    resetResourceForm();
  }

  function selectLibraryResource(
    libraryResource: LibraryResource,
  ) {
    setSelectedLibraryResourceId(libraryResource.id);
    setResourceCode(libraryResource.code);
    setResourceName(libraryResource.name);
    setResourceUnit(libraryResource.unit);

    setResourceUnitPrice(
      String(libraryResource.defaultUnitPrice),
    );
  }

  function changeCreationMode(
    mode: ResourceCreationMode,
  ) {
    setResourceCreationMode(mode);
    resetResourceForm(activeResourceType ?? undefined);
  }

  function createResource(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!activeResourceType) {
      return;
    }

    if (!resourceName.trim()) {
      return;
    }

    const quantity = Number(resourceQuantity);
    const unitPrice = Number(resourceUnitPrice);
    const waste = Number(wastePercentage);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      return;
    }

    ApuService.addResource({
      itemId,
      libraryResourceId:
        resourceCreationMode === "library"
          ? selectedLibraryResourceId ?? undefined
          : undefined,
      type: activeResourceType,
      code: resourceCode.trim() || undefined,
      name: resourceName,
      unit: resourceUnit,
      quantity,
      unitPrice,
      wastePercentage:
        activeResourceType === "material" &&
        Number.isFinite(waste) &&
        waste >= 0
          ? waste
          : 0,
    });

    refreshAnalysis();
    closeResourceForm();
  }

  function updateResource(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingResource) {
      return;
    }

    const quantity = Number(resourceQuantity);
    const unitPrice = Number(resourceUnitPrice);
    const waste = Number(wastePercentage);

    if (
      !resourceName.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      return;
    }

    ApuService.updateResource(editingResource.id, {
      code: resourceCode.trim() || undefined,
      name: resourceName,
      unit: resourceUnit,
      quantity,
      unitPrice,
      wastePercentage:
        editingResource.type === "material" &&
        Number.isFinite(waste) &&
        waste >= 0
          ? waste
          : 0,
    });

    refreshAnalysis();
    closeEditResourceForm();
  }

  function deleteResource(resourceId: string) {
    const confirmed = window.confirm(
      "¿Deseas eliminar este recurso del análisis?",
    );

    if (!confirmed) {
      return;
    }

    ApuService.deleteResource(resourceId);
    refreshAnalysis();
  }

  function updateAdjustment(
    field: AdjustmentField,
    value: string,
  ) {
    const parsedValue = Number(value);

    const safeValue =
      Number.isFinite(parsedValue) && parsedValue >= 0
        ? parsedValue
        : 0;

    ApuService.updateAdjustments(itemId, {
      [field]: safeValue,
    });

    refreshAnalysis();
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Cargando análisis...
        </p>
      </main>
    );
  }

  if (!project || !chapter || !item) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">
            No encontramos la información del APU
          </h1>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const itemsHref =
    `/projects/${project.id}` +
    `/chapters/${chapter.id}` +
    `/items`;

  const calculation = ApuService.calculate(itemId);

  const materialsTotal =
    calculation?.materialsSubtotal ?? 0;

  const laborTotal =
    calculation?.laborSubtotal ?? 0;

  const equipmentTotal =
    calculation?.equipmentSubtotal ?? 0;

  const subcontractTotal =
    calculation?.subcontractSubtotal ?? 0;

  const directCost =
    calculation?.directCost ?? 0;

  const indirectCostsAmount =
    calculation?.indirectCostsAmount ?? 0;

  const contingencyAmount =
    calculation?.contingencyAmount ?? 0;

  const profitAmount =
    calculation?.profitAmount ?? 0;

  const taxAmount =
    calculation?.taxAmount ?? 0;

  const unitPriceBeforeTax =
    calculation?.unitPriceBeforeTax ?? 0;

  const unitPrice =
    calculation?.finalUnitPrice ?? 0;

  const itemTotal =
    calculation?.itemTotal ?? 0;

  const analysisComplete =
    calculation?.isCalculated ?? false;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <NexusLogo size="sm" />

          <Link
            href={itemsHref}
            className="mt-10 flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a partidas
          </Link>

          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Proyecto
            </p>

            <p className="mt-2 font-semibold">
              {project.name}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {project.code}
            </p>

            <div className="my-4 h-px bg-slate-800" />

            <p className="text-xs uppercase tracking-wider text-slate-400">
              Capítulo
            </p>

            <p className="mt-2 text-sm font-medium">
              {chapter.name}
            </p>

            <div className="my-4 h-px bg-slate-800" />

            <p className="text-xs uppercase tracking-wider text-slate-400">
              Partida
            </p>

            <p className="mt-2 text-sm font-medium">
              {item.code} · {item.name}
            </p>
          </div>

          <div className="mt-auto text-sm text-slate-500">
            Powered by Ingeniería González
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-10">
          <Link
            href={itemsHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a partidas
          </Link>

          <header className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Análisis de precio unitario
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {item.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                  Código: {item.code ?? item.id}
                </span>

                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                  Unidad: {item.unit}
                </span>

                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                  Cantidad:{" "}
                  {item.quantity.toLocaleString(
                    "es-DO",
                    {
                      maximumFractionDigits: 2,
                    },
                  )}
                </span>
              </div>
            </div>

            {analysisComplete ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                APU calculado
              </span>
            ) : (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                <Calculator className="h-4 w-4" />
                Sin analizar
              </span>
            )}
          </header>

          <div className="mt-8 grid gap-5 xl:grid-cols-4">
            <SummaryCard
              icon={Boxes}
              label="Materiales"
              value={materialsTotal}
            />

            <SummaryCard
              icon={BriefcaseBusiness}
              label="Mano de obra"
              value={laborTotal}
            />

            <SummaryCard
              icon={Truck}
              label="Equipos"
              value={equipmentTotal}
            />

            <SummaryCard
              icon={Building2}
              label="Subcontratos"
              value={subcontractTotal}
            />
          </div>

          <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              {resourceSections.map((section) => (
                <ResourceSection
                  key={section.type}
                  icon={section.icon}
                  title={section.title}
                  description={section.description}
                  resources={resources.filter(
                    (resource) =>
                      resource.type === section.type,
                  )}
                  onAdd={() =>
                    openResourceForm(section.type)
                  }
                  onEdit={openEditResourceForm}
                  onDelete={deleteResource}
                />
              ))}
            </div>

            <aside className="h-fit space-y-5 xl:sticky xl:top-8">
              <ApuAdjustmentsPanel
                adjustments={item.adjustments}
                onChange={updateAdjustment}
              />

              <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
                <p className="text-sm font-medium text-slate-400">
                  Resumen del APU
                </p>

                <div className="mt-7 space-y-4">
                  <TotalRow
                    label="Materiales"
                    value={materialsTotal}
                  />

                  <TotalRow
                    label="Mano de obra"
                    value={laborTotal}
                  />

                  <TotalRow
                    label="Equipos"
                    value={equipmentTotal}
                  />

                  <TotalRow
                    label="Subcontratos"
                    value={subcontractTotal}
                  />
                </div>

                <div className="my-6 h-px bg-slate-800" />

                <div className="space-y-4">
                  <TotalRow
                    label="Costo directo"
                    value={directCost}
                  />

                  <TotalRow
                    label={`Indirectos (${formatNumber(
                      item.adjustments
                        .indirectCostsPercentage,
                    )}%)`}
                    value={indirectCostsAmount}
                  />

                  <TotalRow
                    label={`Contingencia (${formatNumber(
                      item.adjustments
                        .contingencyPercentage,
                    )}%)`}
                    value={contingencyAmount}
                  />

                  <TotalRow
                    label={`Utilidad (${formatNumber(
                      item.adjustments
                        .profitPercentage,
                    )}%)`}
                    value={profitAmount}
                  />

                  <TotalRow
                    label="Precio antes de impuestos"
                    value={unitPriceBeforeTax}
                  />

                  <TotalRow
                    label={`Impuestos (${formatNumber(
                      item.adjustments.taxPercentage,
                    )}%)`}
                    value={taxAmount}
                  />
                </div>

                <div className="my-6 h-px bg-slate-800" />

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      Precio unitario
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {formatCurrency(unitPrice)}
                    </p>
                  </div>

                  <span className="text-sm text-slate-400">
                    / {item.unit}
                  </span>
                </div>

                <div className="mt-7 rounded-2xl bg-white/5 p-5">
                  <p className="text-sm text-slate-400">
                    Total de la partida
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatCurrency(itemTotal)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {item.quantity.toLocaleString(
                      "es-DO",
                      {
                        maximumFractionDigits: 2,
                      },
                    )}{" "}
                    {item.unit} ×{" "}
                    {formatCurrency(unitPrice)}
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </section>
      </div>

      {activeResourceType && (
        <ResourceFormModal
          type={activeResourceType}
          mode={resourceCreationMode}
          librarySearch={librarySearch}
          selectedLibraryResourceId={
            selectedLibraryResourceId
          }
          code={resourceCode}
          name={resourceName}
          unit={resourceUnit}
          quantity={resourceQuantity}
          unitPrice={resourceUnitPrice}
          wastePercentage={wastePercentage}
          onModeChange={changeCreationMode}
          onLibrarySearchChange={setLibrarySearch}
          onLibraryResourceSelect={selectLibraryResource}
          onCodeChange={setResourceCode}
          onNameChange={setResourceName}
          onUnitChange={setResourceUnit}
          onQuantityChange={setResourceQuantity}
          onUnitPriceChange={setResourceUnitPrice}
          onWasteChange={setWastePercentage}
          onSubmit={createResource}
          onClose={closeResourceForm}
        />
      )}

      {editingResource && (
        <EditResourceModal
          resource={editingResource}
          code={resourceCode}
          name={resourceName}
          unit={resourceUnit}
          quantity={resourceQuantity}
          unitPrice={resourceUnitPrice}
          wastePercentage={wastePercentage}
          onCodeChange={setResourceCode}
          onNameChange={setResourceName}
          onUnitChange={setResourceUnit}
          onQuantityChange={setResourceQuantity}
          onUnitPriceChange={setResourceUnitPrice}
          onWasteChange={setWastePercentage}
          onSubmit={updateResource}
          onClose={closeEditResourceForm}
        />
      )}
    </main>
  );
}

function ApuAdjustmentsPanel({
  adjustments,
  onChange,
}: {
  adjustments: ApuAdjustments;
  onChange: (
    field: AdjustmentField,
    value: string,
  ) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Settings2 className="h-5 w-5" />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Ajustes del APU
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Los cambios se calculan y guardan
            automáticamente.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <PercentageInput
          label="Costos indirectos"
          value={
            adjustments.indirectCostsPercentage
          }
          onChange={(value) =>
            onChange(
              "indirectCostsPercentage",
              value,
            )
          }
        />

        <PercentageInput
          label="Contingencia"
          value={adjustments.contingencyPercentage}
          onChange={(value) =>
            onChange(
              "contingencyPercentage",
              value,
            )
          }
        />

        <PercentageInput
          label="Utilidad"
          value={adjustments.profitPercentage}
          onChange={(value) =>
            onChange("profitPercentage", value)
          }
        />

        <PercentageInput
          label="Impuestos"
          value={adjustments.taxPercentage}
          onChange={(value) =>
            onChange("taxPercentage", value)
          }
        />
      </div>

      <div className="mt-5 rounded-2xl bg-amber-50 p-4">
        <p className="text-xs leading-5 text-amber-800">
          Estos porcentajes pertenecen únicamente a esta
          partida. No modifican otros APU del proyecto.
        </p>
      </div>
    </section>
  );
}

function PercentageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="nexus-input pr-11"
        />

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
          %
        </span>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {formatCurrency(value)}
      </p>
    </article>
  );
}

function ResourceSection({
  icon: Icon,
  title,
  description,
  resources,
  onAdd,
  onEdit,
  onDelete,
}: {
  icon: ElementType;
  title: string;
  description: string;
  resources: CostResource[];
  onAdd: () => void;
  onEdit: (resource: CostResource) => void;
  onDelete: (resourceId: string) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center">
          <p className="text-sm text-slate-400">
            Aún no hay recursos registrados.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Recurso</th>
                <th className="pb-3">Unidad</th>

                <th className="pb-3 text-right">
                  Cantidad
                </th>

                <th className="pb-3 text-right">
                  Precio
                </th>

                <th className="pb-3 text-right">
                  Desperdicio
                </th>

                <th className="pb-3 text-right">
                  Total
                </th>

                <th className="pb-3 text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td className="py-4">
                    <div className="flex items-start gap-3">
                      {resource.libraryResourceId && (
                        <div
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
                          title="Recurso agregado desde la biblioteca"
                        >
                          <Library className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div>
                        <p className="font-medium">
                          {resource.name}
                        </p>

                        {resource.code && (
                          <p className="mt-1 text-xs text-slate-400">
                            {resource.code}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-4 text-slate-500">
                    {resource.unit}
                  </td>

                  <td className="py-4 text-right">
                    {formatNumber(resource.quantity)}
                  </td>

                  <td className="py-4 text-right">
                    {formatCurrency(
                      resource.unitPrice,
                    )}
                  </td>

                  <td className="py-4 text-right">
                    {formatNumber(
                      resource.wastePercentage ?? 0,
                    )}
                    %
                  </td>

                  <td className="py-4 text-right font-semibold">
                    {formatCurrency(
                      ResourceService.calculateResourceTotal(
                        resource,
                      ),
                    )}
                  </td>

                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(resource)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onDelete(resource.id)
                        }
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function ResourceFormModal({
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
}: {
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
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onClose: () => void;
}) {
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
                  onLibrarySearchChange(
                    event.target.value,
                  )
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
                    Prueba otra búsqueda o utiliza la
                    opción de recurso manual.
                  </p>
                </div>
              ) : (
                libraryResources.map(
                  (libraryResource) => {
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
                              Unidad:{" "}
                              {libraryResource.unit}
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
                  },
                )
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

function EditResourceModal({
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
}: {
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
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onClose: () => void;
}) {
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
        <ModalHeader
          eyebrow="Editar recurso"
          title={resource.name}
          onClose={onClose}
        />

        {resource.libraryResourceId && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <Library className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                Recurso vinculado a la biblioteca
              </p>

              <p className="mt-1 text-sm text-blue-700">
                Los cambios realizados aquí solo afectarán
                este APU. El recurso original de la biblioteca
                permanecerá sin cambios.
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
                <option
                  key={currentUnit}
                  value={currentUnit}
                >
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
              className="nexus-input mt-2"
            />
          </div>
        </div>

        <ResourceCostFields
          type={resource.type}
          name={name}
          code={code}
          unit={unit}
          quantity={quantity}
          unitPrice={unitPrice}
          wastePercentage={wastePercentage}
          showSelectedResource={false}
          onQuantityChange={onQuantityChange}
          onUnitPriceChange={onUnitPriceChange}
          onWasteChange={onWasteChange}
        />

        <ModalActions
          submitLabel="Guardar cambios"
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
            <option
              key={currentUnit}
              value={currentUnit}
            >
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

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-400">
        {label}
      </span>

      <span className="font-semibold">
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function getResourceTypeLabel(
  type: ResourceType,
): string {
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

  return (
    Number.isFinite(parsedValue) &&
    parsedValue > 0
  );
}

function priceIsValid(value: string): boolean {
  if (!value.trim()) {
    return false;
  }

  const parsedValue = Number(value);

  return (
    Number.isFinite(parsedValue) &&
    parsedValue >= 0
  );
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

function formatNumber(value: number): string {
  return value.toLocaleString("es-DO", {
    maximumFractionDigits: 4,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}