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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import NexusLogo from "@/components/ui/NexusLogo";
import { ProjectService } from "@/services/project.service";
import { ProjectDeletionService } from "@/services/projectDeletion.service";
import type { Project } from "@/types/project";

interface ProjectWorkspaceProps {
  projectId: string;
}

const stages = [
  {
    id: "general",
    title: "Información general",
    description: "Datos principales de la obra y del cliente.",
    icon: FileText,
    status: "completed",
  },
  {
    id: "chapters",
    title: "Capítulos",
    description: "Organiza la estructura principal del presupuesto.",
    icon: ListTree,
    status: "current",
  },
  {
    id: "items",
    title: "Partidas",
    description: "Agrega las actividades que componen cada capítulo.",
    icon: ReceiptText,
    status: "pending",
  },
  {
    id: "costs",
    title: "Análisis de precios",
    description: "Define materiales, mano de obra y equipos.",
    icon: WalletCards,
    status: "pending",
  },
  {
    id: "summary",
    title: "Resumen y presupuesto",
    description: "Revisa totales y prepara el documento final.",
    icon: Building2,
    status: "pending",
  },
] as const;

export default function ProjectWorkspace({
  projectId,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const selectedProject = ProjectService.findById(projectId);

    setProject(selectedProject);
    setLoaded(true);
  }, [projectId]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const progress = project.progress ?? 20;
  const chaptersHref = `/projects/${project.id}/chapters`;

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
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Proyecto actual
            </p>

            <p className="mt-2 font-semibold">{project.name}</p>

            <p className="mt-1 text-sm text-slate-400">
              {project.code}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {project.projectType}
            </p>
          </div>

          <div className="mt-auto text-sm text-slate-500">
            Powered by Ingeniería González
          </div>
        </aside>

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
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50">
                <Trash2 className="h-5 w-5" /> Eliminar
              </button>
              <Link href={`/projects/${project.id}/plans`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50">
                <FileUp className="h-5 w-5" /> Subir planos
              </Link>
              <Link href={`/projects/${project.id}/contracts`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                <FileSignature className="h-5 w-5" /> Contratos
              </Link>
              <Link href={chaptersHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500">
                Crear capítulos <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </header>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Progreso del proyecto
                </p>

                <p className="mt-2 text-3xl font-bold">{progress}%</p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                En preparación
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

                    {stage.id === "chapters" ? (
                      <Link
                        href={chaptersHref}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
                      >
                        Crear capítulos
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    ) : completed ? (
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        Revisar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Circle className="h-4 w-4" />
                        Paso {index + 1}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </div>
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