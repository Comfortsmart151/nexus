"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";
import type { BudgetChapter, BudgetItem } from "@/types/budget";
import type { Project } from "@/types/project";

export default function ProjectItemsOverview({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<BudgetChapter[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  useEffect(() => {
    setProject(ProjectService.findById(projectId));
    setChapters(ChapterService.findByProject(projectId));
    setItems(ItemService.findByProject(projectId));
  }, [projectId]);
  const chapterMap = useMemo(() => new Map(chapters.map((c) => [c.id, c])), [chapters]);
  if (!project) return <main className="min-h-screen bg-slate-100 p-8">Cargando...</main>;
  return <main className="min-h-screen bg-slate-100 p-6 lg:p-10 text-slate-950">
    <div className="mx-auto max-w-6xl">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4"/>Proyecto</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">Paso 3</p><h1 className="text-3xl font-bold">Partidas del proyecto</h1><p className="mt-2 text-slate-500">Vista global de todas las actividades, sin perder su capítulo de origen.</p></div><Link href={`/projects/${projectId}/chapters`} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Agregar partidas</Link></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3"><Stat label="Partidas" value={items.length}/><Stat label="Con cantidad" value={items.filter(i=>i.quantity>0).length}/><Stat label="Con precio" value={items.filter(i=>i.status==="priced").length}/></div>
      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {items.length === 0 ? <div className="p-10 text-center"><ListChecks className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 font-semibold">Aún no hay partidas.</p><p className="text-sm text-slate-500">Créelas dentro de un capítulo para verlas aquí.</p></div> : items.map(item => <div key={item.id} className="flex flex-col gap-3 border-b border-slate-100 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm text-slate-400">{item.code ?? "—"}</span><strong>{item.name}</strong><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{chapterMap.get(item.chapterId)?.name ?? "Sin capítulo"}</span></div><p className="mt-1 text-sm text-slate-500">{item.quantity} {item.unit} · {item.status === "priced" ? "APU valorizado" : item.status === "in-progress" ? "APU en proceso" : "APU pendiente"}</p>{item.description?.includes("[PLAN:") && <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">Origen: Plano</span>{(item.planWastePercentage??0)>0&&<span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Desperdicio {item.planWastePercentage}%</span>}{(item.manualPriceAdjustmentPercentage??0)>0&&<span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Ajuste PU +{item.manualPriceAdjustmentPercentage}%</span>}</div>}</div><Link href={`/projects/${projectId}/chapters/${item.chapterId}/items/${item.id}`} className="inline-flex items-center gap-2 font-semibold text-blue-600">Abrir partida <ArrowRight className="h-4 w-4"/></Link></div>)}
      </section>
    </div>
  </main>;
}
function Stat({label,value}:{label:string;value:number}) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
