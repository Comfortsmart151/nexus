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
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(ProjectService.findAll());
  }, []);

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
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}