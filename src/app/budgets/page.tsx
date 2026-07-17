"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CircleDollarSign,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import NexusLogo from "@/components/ui/NexusLogo";
import { ApuService } from "@/services/apu.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";
import type { Project } from "@/types/project";

interface ProjectBudgetRow {
  project: Project;
  itemsCount: number;
  pricedItemsCount: number;
  total: number;
}

export default function BudgetsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(ProjectService.findAll());
  }, []);

  const rows = useMemo<ProjectBudgetRow[]>(() => {
    return projects.map((project) => {
      const items = ItemService.findByProject(project.id);

      const pricedItemsCount = items.filter((item) => {
        const calculation = ApuService.calculate(item.id);
        return (
          calculation?.isCalculated &&
          (calculation.finalUnitPrice ?? 0) > 0
        );
      }).length;

      const total = items.reduce((sum, item) => {
        const calculation = ApuService.calculate(item.id);
        const unitPrice =
          calculation?.finalUnitPrice ?? item.unitPrice ?? 0;

        return sum + unitPrice * item.quantity;
      }, 0);

      return {
        project,
        itemsCount: items.length,
        pricedItemsCount,
        total,
      };
    });
  }, [projects]);

  const totalGeneral = rows.reduce(
    (sum, row) => sum + row.total,
    0,
  );

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
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
            >
              <FolderKanban className="h-5 w-5" />
              Proyectos
            </Link>

            <Link
              href="/budgets"
              className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-700"
            >
              <FileSpreadsheet className="h-5 w-5" />
              Presupuestos
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

          <header className="mt-5 sm:mt-0">
            <p className="text-sm font-semibold text-blue-600">
              Consolidación financiera
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Presupuestos
            </h1>

            <p className="mt-2 text-slate-500">
              Consulta el valor presupuestado de cada proyecto.
            </p>
          </header>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <MetricCard
              label="Proyectos"
              value={rows.length.toString()}
            />

            <MetricCard
              label="Valor total presupuestado"
              value={formatCurrency(totalGeneral)}
              emphasized
            />
          </div>

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
                <h2 className="mt-4 text-xl font-bold">
                  No hay presupuestos disponibles
                </h2>
                <p className="mt-2 text-slate-500">
                  Crea un proyecto y agrega partidas para comenzar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {rows.map((row) => (
                  <Link
                    key={row.project.id}
                    href={`/projects/${row.project.id}/budget`}
                    className="flex flex-col gap-5 px-6 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <FileSpreadsheet className="h-6 w-6" />
                      </span>

                      <div>
                        <p className="font-bold text-slate-950">
                          {row.project.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {row.project.code} · {row.itemsCount} partidas ·{" "}
                          {row.pricedItemsCount} con precio
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total
                      </p>

                      <p className="mt-1 text-xl font-black text-slate-950">
                        {formatCurrency(row.total)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        emphasized
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p
            className={`text-sm font-medium ${
              emphasized ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p className="mt-2 text-3xl font-black">
            {value}
          </p>
        </div>

        <CircleDollarSign
          className={`h-8 w-8 ${
            emphasized ? "text-blue-100" : "text-blue-600"
          }`}
        />
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 2,
  }).format(value);
}