"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Circle,
  FileText,
  FileUp,
  FileSignature,
  ListTree,
  MapPin,
  ReceiptText,
  UserRound,
  WalletCards,
  Trash2,
  Pencil,
  X,
  Save,
  ShieldCheck,
  Copy,
  History,
  BadgeDollarSign,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import NexusLogo from "@/components/ui/NexusLogo";
import { ProjectService } from "@/services/project.service";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import type { BudgetChapter, BudgetItem } from "@/types/budget";
import { PRICE_REGIONS, RegionalPricingService } from "@/services/regionalPricing.service";
import type { ProjectPriceRegion } from "@/types/construcosto";
import { ProjectDeletionService } from "@/services/projectDeletion.service";
import type { Project } from "@/types/project";
import { BudgetService } from "@/services/budget.service";
import { ProjectReviewService } from "@/services/projectReview.service";
import { ProjectDuplicateService } from "@/services/projectDuplicate.service";

interface ProjectWorkspaceProps {
  projectId: string;
}



export default function ProjectWorkspace({
  projectId,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [chapters, setChapters] = useState<BudgetChapter[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateOptions, setDuplicateOptions] = useState({ structure:true, apu:true, economic:true });
  const [projectDraft, setProjectDraft] = useState({ name:"", client:"", clientTaxId:"", clientContact:"", clientPhone:"", clientEmail:"", clientAddress:"", location:"", projectType:"" });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const selectedProject = ProjectService.findById(projectId);

    setProject(selectedProject);
    setChapters(ChapterService.findByProject(projectId));
    setItems(ItemService.findByProject(projectId));
    setLoaded(true);
  }, [projectId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function changePriceRegion(region: ProjectPriceRegion) {
    if (!project) return;
    const updated = ProjectService.update(project.id, { priceRegion: region });
    if (updated) {
      RegionalPricingService.repriceProject(project.id, region);
      setProject(updated);
    }
  }


  function openProjectEditor() {
    if (!project) return;
    setProjectDraft({ name: project.name, client: project.client, clientTaxId: project.clientTaxId || "", clientContact: project.clientContact || "", clientPhone: project.clientPhone || "", clientEmail: project.clientEmail || "", clientAddress: project.clientAddress || "", location: project.location, projectType: project.projectType });
    setEditingProject(true);
  }

  function saveProjectEditor() {
    if (!project) return;
    const updated = ProjectService.update(project.id, projectDraft);
    if (updated) setProject(updated);
    setEditingProject(false);
  }

  function duplicateCurrentProject() {
    if (!project || duplicating) return;
    setDuplicating(true);
    const duplicated = ProjectDuplicateService.duplicate(project.id, duplicateOptions);
    setDuplicating(false);
    setShowDuplicate(false);
    if (duplicated) router.push(`/projects/${duplicated.id}`);
  }

  async function deleteCurrentProject() {
    if (!project || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await ProjectDeletionService.deleteProject(project.id);
      router.push("/projects");
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleteError(error instanceof Error ? error.message : "No fue posible eliminar el proyecto.");
      setDeleting(false);
    }
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Cargando proyecto...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>

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

  const chaptersHref = `/projects/${project.id}/chapters`;
  const itemsHref = `/projects/${project.id}/items`;
  const analysesHref = `/projects/${project.id}/analyses`;
  const budgetHref = `/projects/${project.id}/budget`;
  const reviewHref = `/projects/${project.id}/review`;
  const revisionsHref = `/projects/${project.id}/revisions`;
  const pricedItems = items.filter((item) => item.status === "priced").length;
  const hasChapters = chapters.length > 0;
  const hasItems = items.length > 0;
  const apuRatio = hasItems ? pricedItems / items.length : 0;
  const budgetReady = hasItems && pricedItems === items.length;
  const review = ProjectReviewService.run(project.id);
  const budget = BudgetService.findByProject(project.id);
  const directCost = items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);
  const projectTotal = budget ? (() => { const a = budget.adjustments; const ge = directCost * a.generalExpensesPercentage / 100; const cont = (directCost + ge) * a.contingencyPercentage / 100; const profit = (directCost + ge + cont) * a.profitPercentage / 100; return (directCost + ge + cont + profit) * (1 + a.itbisPercentage / 100); })() : directCost;
  const progress = Math.round(20 + (hasChapters ? 20 : 0) + (hasItems ? 20 : 0) + (20 * apuRatio) + (budgetReady && review.critical === 0 ? 20 : 0));
  const stages = [
    { id:"general", title:"Información general", description:"Datos principales de la obra y del cliente.", icon:FileText, status:"completed", meta:"Datos del proyecto", href:`/projects/${project.id}` },
    { id:"chapters", title:"Capítulos", description:"Organiza la estructura principal del presupuesto.", icon:ListTree, status:hasChapters?"completed":"current", meta:`${chapters.length} capítulo${chapters.length===1?"":"s"}`, href:chaptersHref },
    { id:"items", title:"Partidas", description:"Vista global de las actividades que componen el proyecto.", icon:ReceiptText, status:hasItems?"completed":hasChapters?"current":"pending", meta:`${items.length} partida${items.length===1?"":"s"}`, href:itemsHref },
    { id:"costs", title:"Análisis de precios", description:"Centro de control de APU, materiales, mano de obra y equipos.", icon:WalletCards, status:budgetReady?"completed":hasItems?"current":"pending", meta:hasItems?`${pricedItems} de ${items.length} APU valorizados`:"Sin partidas", href:analysesHref },
    { id:"summary", title:"Resumen y presupuesto", description:"Ejecuta control de calidad, consolida totales y prepara el documento final.", icon:Building2, status:budgetReady?"current":"pending", meta:budgetReady?(review.critical===0?`${review.score}% validado`:`${review.critical} crítico(s)`):"Pendiente de APU", href:reviewHref },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">

        <section className="flex-1 p-6 lg:p-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <header className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Espacio de trabajo
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {project.name}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-blue-600" />
                  {project.client}
                </span>

                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {project.location}
                </span>

                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {project.projectType}
                </span>

                <label className="flex items-center gap-2">
                  <span className="font-medium text-slate-600">Precios:</span>
                  <select value={project.priceRegion} onChange={(event) => changePriceRegion(event.target.value as ProjectPriceRegion)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
                    {PRICE_REGIONS.map((region) => <option key={region.value} value={region.value}>{region.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={openProjectEditor} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"><Pencil className="h-5 w-5" /> Editar datos</button>
              <button type="button" onClick={() => setShowDuplicate(true)} disabled={duplicating} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><Copy className="h-5 w-5" /> {duplicating ? "Duplicando..." : "Duplicar"}</button>
              <Link href={revisionsHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"><History className="h-5 w-5" /> Revisiones</Link>
              <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50">
                <Trash2 className="h-5 w-5" /> Eliminar
              </button>
              <Link href={`/projects/${project.id}/plans`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50">
                <FileUp className="h-5 w-5" /> Subir planos
              </Link>
              <Link href={`/projects/${project.id}/contracts`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                <FileSignature className="h-5 w-5" /> Contratos
              </Link>
              <Link href={!hasChapters ? chaptersHref : !hasItems ? itemsHref : !budgetReady ? analysesHref : reviewHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500">
                {!hasChapters ? "Crear capítulos" : !hasItems ? "Continuar con partidas" : !budgetReady ? "Continuar con APU" : "Revisar proyecto"} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </header>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Proyecto</p><p className="mt-1 font-bold">{project.code}</p><p className="mt-1 text-xs text-slate-400">Actualizado {new Date(project.updatedAt).toLocaleDateString("es-DO")}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Estructura</p><p className="mt-1 text-2xl font-black">{chapters.length} <span className="text-sm font-medium text-slate-400">capítulos</span></p><p className="text-xs text-slate-400">{items.length} partidas · {pricedItems} APU listos</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="h-4 w-4"/>Calidad</div><p className="mt-1 text-2xl font-black">{review.score}%</p><Link href={reviewHref} className="mt-1 inline-flex text-xs font-semibold text-blue-600">{review.critical ? `${review.critical} crítico(s) por corregir` : "Sin bloqueos críticos"}</Link></div>
            <div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center gap-2 text-sm text-slate-400"><BadgeDollarSign className="h-4 w-4"/>Presupuesto actual</div><p className="mt-1 text-2xl font-black">RD$ {projectTotal.toLocaleString("es-DO", { maximumFractionDigits: 0 })}</p><Link href={budgetHref} className="mt-1 inline-flex text-xs font-semibold text-blue-300">Abrir presupuesto</Link></div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Progreso del proyecto
                </p>

                <p className="mt-2 text-3xl font-bold">{progress}%</p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {budgetReady ? "Presupuesto listo" : hasItems ? "En análisis" : hasChapters ? "Estructurando" : "En preparación"}
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="mt-8">
            <div>
              <h2 className="text-2xl font-bold">Continúa tu proyecto</h2>

              <p className="mt-2 text-slate-500">
                Completa cada etapa para generar el presupuesto.
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const completed = stage.status === "completed";
                const current = stage.status === "current";

                return (
                  <article
                    key={stage.id}
                    className={`flex flex-col gap-5 rounded-2xl border bg-white p-6 transition sm:flex-row sm:items-center sm:justify-between ${
                      current
                        ? "border-blue-300 shadow-md shadow-blue-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          completed
                            ? "bg-emerald-50 text-emerald-600"
                            : current
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {completed ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-semibold">{stage.title}</h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              completed
                                ? "bg-emerald-50 text-emerald-700"
                                : current
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {completed
                              ? "Completado"
                              : current
                                ? "Siguiente paso"
                                : "Pendiente"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="hidden text-sm text-slate-400 md:inline">{stage.meta}</span>
                      {stage.status !== "pending" ? (
                        <Link href={stage.href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${current ? "bg-blue-600 text-white hover:bg-blue-500" : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}>
                          {current ? (stage.id === "summary" ? "Revisar proyecto" : stage.id === "costs" ? "Continuar APU" : stage.id === "items" ? "Ver partidas" : "Continuar") : "Revisar"}
                          {current && <ArrowRight className="h-5 w-5" />}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-400"><Circle className="h-4 w-4" />Paso {index + 1}</div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </div>
      {editingProject ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-blue-600">Información general</p><h2 className="text-2xl font-black">Editar proyecto</h2></div><button onClick={()=>setEditingProject(false)}><X className="h-5 w-5"/></button></div><div className="mt-6 grid gap-4"><label className="text-sm font-medium">Nombre<input value={projectDraft.name} onChange={e=>setProjectDraft(v=>({...v,name:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label><label className="text-sm font-medium">Cliente / empresa<input value={projectDraft.client} onChange={e=>setProjectDraft(v=>({...v,client:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">RNC / Cédula<input value={projectDraft.clientTaxId} onChange={e=>setProjectDraft(v=>({...v,clientTaxId:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label><label className="text-sm font-medium">Contacto<input value={projectDraft.clientContact} onChange={e=>setProjectDraft(v=>({...v,clientContact:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label><label className="text-sm font-medium">Teléfono<input value={projectDraft.clientPhone} onChange={e=>setProjectDraft(v=>({...v,clientPhone:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label><label className="text-sm font-medium">Correo<input value={projectDraft.clientEmail} onChange={e=>setProjectDraft(v=>({...v,clientEmail:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label></div><label className="text-sm font-medium">Dirección del cliente<input value={projectDraft.clientAddress} onChange={e=>setProjectDraft(v=>({...v,clientAddress:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label><label className="text-sm font-medium">Ubicación<input value={projectDraft.location} onChange={e=>setProjectDraft(v=>({...v,location:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label><label className="text-sm font-medium">Tipo de proyecto<input value={projectDraft.projectType} onChange={e=>setProjectDraft(v=>({...v,projectType:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 p-3"/></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setEditingProject(false)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold">Cancelar</button><button onClick={saveProjectEditor} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white"><Save className="h-4 w-4"/>Guardar cambios</button></div></div></div>
      ) : null}
      {showDuplicate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-2xl font-black">Duplicar proyecto</h2><p className="mt-2 text-sm text-slate-500">Elige qué información quieres usar como plantilla.</p></div><button onClick={() => setShowDuplicate(false)}><X className="h-5 w-5"/></button></div><div className="mt-6 space-y-3">{[["structure","Capítulos y partidas","Copia estructura, cantidades y unidades."],["apu","Análisis de precios (APU)","Copia recursos y precios de las partidas."],["economic","Configuración económica","Copia moneda y porcentajes del presupuesto."]].map(([key,title,detail]) => <label key={key} className="flex gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" checked={duplicateOptions[key as keyof typeof duplicateOptions]} disabled={key==="apu"&&!duplicateOptions.structure} onChange={e=>setDuplicateOptions(v=>({...v,[key]:e.target.checked,...(key==="structure"&&!e.target.checked?{apu:false}:{})}))}/><span><strong className="block">{title}</strong><span className="text-sm text-slate-500">{detail}</span></span></label>)}</div><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setShowDuplicate(false)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold">Cancelar</button><button onClick={duplicateCurrentProject} disabled={duplicating} className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white">{duplicating?"Duplicando...":"Crear copia"}</button></div></div></div>
      ) : null}
      {confirmingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">Eliminar proyecto</p>
            <h2 className="mt-2 text-2xl font-bold">¿Eliminar “{project.name}”?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Se eliminarán también capítulos, partidas, recursos/APU, presupuestos, planos, análisis, contratos y archivos asociados. La Biblioteca Maestra permanecerá intacta.</p>
            {deleteError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{deleteError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={deleting} onClick={() => { setConfirmingDelete(false); setDeleteError(null); }} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={deleting} onClick={deleteCurrentProject} className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-60">{deleting ? "Eliminando..." : "Sí, eliminar proyecto"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}