"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  BriefcaseBusiness,
  Hammer,
  Sparkles,
  Truck,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import AnalysisHeader from "@/components/analysis/AnalysisHeader";
import AnalysisSummaryCards from "@/components/analysis/AnalysisSummaryCards";
import ApuAdjustmentsPanel from "@/components/analysis/ApuAdjustmentsPanel";
import ApuSummarySidebar from "@/components/analysis/ApuSummarySidebar";
import EditResourceModal from "@/components/analysis/EditResourceModal";
import { NexusAiGeneratorModal } from "@/components/analysis/NexusAiGeneratorModal";
import ResourceSection from "@/components/analysis/ResourceSection";
import ResourceFormModal, {
  type ResourceCreationMode,
} from "@/components/analysis/ResourceFormModal";
import NexusLogo from "@/components/ui/NexusLogo";
import { ApuService } from "@/services/apu.service";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";
import type {
  ApuAdjustments,
  BudgetChapter,
  BudgetItem,
  CostResource,
  ResourceType,
} from "@/types/budget";
import type { LibraryResource } from "@/types/library";
import type { NexusAiApuProposal } from "@/types/nexus-ai";
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
  icon: LucideIcon;
}

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

  const [isAiModalOpen, setIsAiModalOpen] =
    useState(false);

  const [aiSuccessMessage, setAiSuccessMessage] =
    useState<string | null>(null);

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

  function openAiGenerator() {
    setAiSuccessMessage(null);
    setIsAiModalOpen(true);
  }

  function closeAiGenerator() {
    setIsAiModalOpen(false);
  }

  function applyAiProposal(
    proposal: NexusAiApuProposal,
  ) {
    if (resources.length > 0) {
      const confirmed = window.confirm(
        "Esta partida ya tiene recursos. Si aplicas la propuesta de NEXUS AI, los recursos actuales serán reemplazados. ¿Deseas continuar?",
      );

      if (!confirmed) {
        return;
      }

      resources.forEach((resource) => {
        ApuService.deleteResource(resource.id);
      });
    }

    proposal.resources.forEach((resource) => {
      ApuService.addResource({
        itemId,
        libraryResourceId:
          resource.resourceId ?? undefined,
        type: resource.resourceType,
        code:
          resource.resourceCode.trim() ||
          undefined,
        name: resource.name,
        unit: resource.unit,

        /*
         * Se utiliza quantity y no finalQuantity porque
         * ApuService aplica el porcentaje de desperdicio
         * durante el cálculo del APU.
         */
        quantity: resource.quantity,
        unitPrice: resource.unitPrice,
        wastePercentage:
          resource.resourceType === "material"
            ? resource.wastePercentage
            : 0,
      });
    });

    ItemService.update(itemId, {
      name: proposal.name,
      description: proposal.description,
      unit: proposal.unit,
      quantity: proposal.quantity,
      status: "priced",
      priceSource: "apu",
    });

    refreshAnalysis();
    setIsAiModalOpen(false);

    setAiSuccessMessage(
      `NEXUS AI agregó ${proposal.resources.length} recursos al análisis.`,
    );
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

          <AnalysisHeader
            item={item}
            analysisComplete={analysisComplete}
          />

          {aiSuccessMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Propuesta aplicada correctamente
                </p>

                <p className="mt-1 text-sm">
                  {aiSuccessMessage}
                </p>
              </div>
            </div>
          )}

          <section className="mt-6 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-300/40">
            <div className="relative p-6 sm:p-8">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-950/40">
                    <WandSparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                      NEXUS AI Engine
                    </p>

                    <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                      Generar este APU con inteligencia artificial
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      NEXUS analizará la partida, identificará
                      los recursos necesarios y preparará una
                      propuesta de materiales, mano de obra,
                      equipos y subcontratos.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openAiGenerator}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-500"
                >
                  <WandSparkles className="h-5 w-5" />
                  Generar con IA
                </button>
              </div>
            </div>
          </section>

          <AnalysisSummaryCards
            materialsTotal={materialsTotal}
            laborTotal={laborTotal}
            equipmentTotal={equipmentTotal}
            subcontractTotal={subcontractTotal}
          />

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

              <ApuSummarySidebar
                materialsTotal={materialsTotal}
                laborTotal={laborTotal}
                equipmentTotal={equipmentTotal}
                subcontractTotal={subcontractTotal}
                directCost={directCost}
                indirectCostsAmount={indirectCostsAmount}
                contingencyAmount={contingencyAmount}
                profitAmount={profitAmount}
                taxAmount={taxAmount}
                unitPriceBeforeTax={unitPriceBeforeTax}
                unitPrice={unitPrice}
                itemTotal={itemTotal}
                quantity={item.quantity}
                unit={item.unit}
                adjustments={item.adjustments}
                analysisComplete={analysisComplete}
                resourceCount={resources.length}
              />
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

      <NexusAiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={closeAiGenerator}
        onApply={applyAiProposal}
        initialDescription={
          item.description?.trim() || item.name
        }
        initialUnit={item.unit}
        initialQuantity={item.quantity}
      />
    </main>
  );
}