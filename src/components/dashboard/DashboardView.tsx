"use client";

import Link from "next/link";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  Library,
  Plus,
  Settings,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

import ProjectCard from "@/components/projects/ProjectCard";
import NexusLogo from "@/components/ui/NexusLogo";
import { ProjectService } from "@/services/project.service";
import type { Project } from "@/types/project";

export default function DashboardView() {
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
            <NavigationItem
              href="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              active
            />

            <NavigationItem
              href="/dashboard"
              icon={FolderKanban}
              label="Proyectos"
            />

            <NavigationItem
              href="/library"
              icon={Library}
              label="Biblioteca"
            />

            <NavigationItem
              href="/dashboard"
              icon={FileSpreadsheet}
              label="Presupuestos"
            />

            <NavigationItem
              href="/dashboard"
              icon={BarChart3}
              label="Reportes"
            />

            <NavigationItem
              href="/dashboard"
              icon={Settings}
              label="Configuración"
            />
          </nav>

          <div className="mt-auto rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-400">Powered by</p>
            <p className="mt-1 font-semibold">Ingeniería González</p>
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-10">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Bienvenido a NEXUS
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                ¿Qué deseas hacer hoy?
              </h1>

              <p className="mt-2 text-slate-500">
                Gestiona tus proyectos, presupuestos y recursos desde un
                solo lugar.
              </p>
            </div>

            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500"
            >
              <Plus className="h-5 w-5" />
              Nuevo proyecto
            </Link>
          </header>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <MetricCard
              title="Proyectos activos"
              value={projects.length.toString()}
              color="blue"
            />

            <MetricCard
              title="Presupuestos"
              value="0"
              color="emerald"
            />

            <MetricCard
              title="Valor presupuestado"
              value="RD$ 0"
              color="amber"
            />
          </div>

          {projects.length === 0 ? (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-2xl font-bold">
                  Comienza tu primer proyecto
                </h2>

                <p className="mt-2 text-slate-500">
                  Todo presupuesto inicia creando un proyecto.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <ActionCard
                  icon={Plus}
                  title="Crear proyecto"
                  description="Registra una nueva obra en menos de un minuto."
                  href="/projects/new"
                />

                <ActionCard
                  icon={Library}
                  title="Abrir biblioteca"
                  description="Registra materiales, mano de obra y equipos."
                  href="/library"
                />

                <ActionCard
                  icon={Upload}
                  title="Importar presupuesto"
                  description="Importa un presupuesto desde Excel."
                />
              </div>
            </section>
          ) : (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Continúa donde lo dejaste
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Haz clic sobre un proyecto para continuar.
                  </p>
                </div>

                <Link
                  href="/library"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  <Library className="h-4 w-4" />
                  Abrir biblioteca
                </Link>
              </div>

              <div className="mt-8 space-y-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function NavigationItem({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
        active
          ? "bg-blue-50 font-semibold text-blue-700"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "blue" | "emerald" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div
        className={`inline-flex rounded-xl px-3 py-2 text-sm font-semibold ${colors[color]}`}
      >
        {title}
      </div>

      <h3 className="mt-5 text-4xl font-black tracking-tight">{value}</h3>
    </article>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="group h-full rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-6 text-lg font-semibold">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}