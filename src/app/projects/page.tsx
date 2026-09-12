"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  LayoutDashboard,
  Library,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";

import ProjectCard from "@/components/projects/ProjectCard";
import NexusLogo from "@/components/ui/NexusLogo";
import { ProjectService } from "@/services/project.service";
import { ProjectDeletionService } from "@/services/projectDeletion.service";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setProjects(ProjectService.findAll());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function confirmDelete() {
    if (!projectToDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await ProjectDeletionService.deleteProject(projectToDelete.id);
      setProjects(ProjectService.findAll());
      setProjectToDelete(null);
    } catch (error) {
      console.error(error);
      setDeleteError(error instanceof Error ? error.message : "No fue posible eliminar el proyecto.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <NexusLogo size="sm" />

          <nav className="mt-10 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>

            <Link
              href="/projects"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-700"
            >
              <FolderKanban className="h-5 w-5" />
              Proyectos
            </Link>

            <Link
              href="/library"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
            >
              <Library className="h-5 w-5" />
              Biblioteca
            </Link>
          </nav>
        </aside>

        <section className="flex-1 p-6 lg:p-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>

          <header className="mt-5 flex flex-col gap-5 sm:mt-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Gestión de proyectos
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Proyectos
              </h1>

              <p className="mt-2 text-slate-500">
                Consulta y continúa todos los proyectos registrados.
              </p>
            </div>

            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus className="h-5 w-5" />
              Nuevo proyecto
            </Link>
          </header>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {projects.length === 0 ? (
              <div className="py-14 text-center">
                <FolderKanban className="mx-auto h-10 w-10 text-slate-300" />
                <h2 className="mt-4 text-xl font-bold">
                  No hay proyectos registrados
                </h2>
                <p className="mt-2 text-slate-500">
                  Crea el primer proyecto para comenzar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} onDelete={setProjectToDelete} deleting={deleting && projectToDelete?.id === project.id} />
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      {projectToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">Eliminar proyecto</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">¿Eliminar “{projectToDelete.name}”?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Esta acción elimina el proyecto y sus capítulos, partidas, recursos/APU, presupuestos, planos, análisis de planos, contratos y archivos asociados. La Biblioteca Maestra no se modifica.</p>
            {deleteError ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{deleteError}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={deleting} onClick={() => { setProjectToDelete(null); setDeleteError(null); }} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={deleting} onClick={confirmDelete} className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">{deleting ? "Eliminando..." : "Sí, eliminar proyecto"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}