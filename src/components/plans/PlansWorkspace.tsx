"use client";

import Link from "next/link";
import { ArrowLeft, Eye, FileSearch, FileUp, Trash2, Upload } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { PlanService } from "@/services/plan.service";
import { ProjectService } from "@/services/project.service";
import type { ProjectDocument } from "@/types/document";
import type { Project } from "@/types/project";

export default function PlansWorkspace({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [items, setItems] = useState<ProjectDocument[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProject(ProjectService.findById(projectId) ?? null);
    setItems(PlanService.findByProject(projectId));
    setInitialized(true);
  }, [projectId]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || busy) return;

    setBusy(true);
    setError("");
    try {
      await PlanService.create(projectId, name, description, file);
      setItems(PlanService.findByProject(projectId));
      setName("");
      setDescription("");
      setFile(null);
      if (input.current) input.current.value = "";
    } catch (err) {
      console.error("Error al guardar el plano:", err);
      setError("No se pudo guardar el plano. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este plano?")) return;
    await PlanService.delete(id);
    setItems(PlanService.findByProject(projectId));
  }

  async function openPlan(id: string) {
    const opened = await PlanService.open(id);
    if (!opened) setError("No se encontró el archivo asociado a este plano.");
  }

  if (!initialized) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
        <div className="mx-auto max-w-6xl text-sm text-slate-500">Cargando proyecto...</div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
        <div className="mx-auto max-w-6xl">Proyecto no encontrado.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al proyecto
        </Link>

        <div className="mt-6 flex flex-col gap-2">
          <p className="text-sm font-semibold text-blue-600">{project.name}</p>
          <h1 className="text-3xl font-bold">Planos del proyecto</h1>
          <p className="text-slate-500">
            Carga PDF o imágenes y mantenlos asociados al proyecto. Los PDF pueden pasar directamente al Motor de Planos v2 para análisis y propuesta de partidas.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2"
        >
          <div>
            <label className="text-sm font-semibold">Nombre del plano</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Planta arquitectónica nivel 1"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Archivo *</label>
            <input
              ref={input}
              required
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-xl border border-slate-200 p-2.5 text-sm"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-semibold">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Disciplina, revisión, nivel o cualquier observación..."
            />
          </div>

          {error && <p className="lg:col-span-2 text-sm font-medium text-red-600">{error}</p>}

          <div className="lg:col-span-2">
            <button
              disabled={busy || !file}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              {busy ? "Guardando..." : "Subir plano"}
            </button>
          </div>
        </form>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Archivos cargados <span className="text-slate-400">({items.length})</span>
          </h2>

          {items.length === 0 ? (
            <div className="py-14 text-center text-slate-500">
              <FileUp className="mx-auto mb-3 h-10 w-10" />
              Aún no hay planos cargados.
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {items.map((x) => (
                <div
                  key={x.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{x.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {x.fileName} · {(x.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(x.createdAt).toLocaleDateString("es-DO")}
                    </p>
                    {x.description && <p className="mt-1 text-sm text-slate-600">{x.description}</p>}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/projects/${projectId}/plans/${x.id}/analysis`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white" title="Analizar plano">
                      <FileSearch className="h-5 w-5" />
                      <span className="hidden md:inline">Analizar</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => openPlan(x.id)}
                      className="rounded-xl border border-slate-200 p-2.5 hover:text-blue-600"
                      title="Abrir"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(x.id)}
                      className="rounded-xl border border-slate-200 p-2.5 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
