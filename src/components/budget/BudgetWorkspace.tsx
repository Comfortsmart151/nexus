"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileSpreadsheet,
  FolderKanban,
  Layers3,
  ReceiptText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import NexusLogo from "@/components/ui/NexusLogo";
import { ApuService } from "@/services/apu.service";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";
import type {
  BudgetChapter,
  BudgetItem,
} from "@/types/budget";
import type { Project } from "@/types/project";

interface BudgetWorkspaceProps {
  projectId: string;
}

interface BudgetItemRow {
  item: BudgetItem;
  unitPrice: number;
  amount: number;
  isCalculated: boolean;
}

interface BudgetChapterGroup {
  chapter: BudgetChapter;
  items: BudgetItemRow[];
  subtotal: number;
}

export default function BudgetWorkspace({
  projectId,
}: BudgetWorkspaceProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<BudgetChapter[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [collapsedChapterIds, setCollapsedChapterIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    setProject(ProjectService.findById(projectId));
    setChapters(ChapterService.findByProject(projectId));
    setItems(ItemService.findByProject(projectId));
    setLoaded(true);
  }, [projectId]);

  const chapterGroups = useMemo<BudgetChapterGroup[]>(() => {
    return chapters.map((chapter) => {
      const chapterItems = items
        .filter((item) => item.chapterId === chapter.id)
        .map((item) => {
          const calculation = ApuService.calculate(item.id);
          const unitPrice =
            calculation?.finalUnitPrice ?? item.unitPrice ?? 0;

          return {
            item,
            unitPrice,
            amount: unitPrice * item.quantity,
            isCalculated: calculation?.isCalculated ?? false,
          };
        });

      return {
        chapter,
        items: chapterItems,
        subtotal: chapterItems.reduce(
          (total, currentItem) => total + currentItem.amount,
          0,
        ),
      };
    });
  }, [chapters, items]);

  const budgetSummary = useMemo(() => {
    const itemsCount = chapterGroups.reduce(
      (total, group) => total + group.items.length,
      0,
    );

    const pricedItemsCount = chapterGroups.reduce(
      (total, group) =>
        total +
        group.items.filter(
          ({ unitPrice, isCalculated }) =>
            isCalculated && unitPrice > 0,
        ).length,
      0,
    );

    const total = chapterGroups.reduce(
      (currentTotal, group) =>
        currentTotal + group.subtotal,
      0,
    );

    return {
      chaptersCount: chapterGroups.length,
      itemsCount,
      pricedItemsCount,
      total,
      completion:
        itemsCount > 0
          ? (pricedItemsCount / itemsCount) * 100
          : 0,
    };
  }, [chapterGroups]);

  function toggleChapter(chapterId: string) {
    setCollapsedChapterIds((currentIds) =>
      currentIds.includes(chapterId)
        ? currentIds.filter((id) => id !== chapterId)
        : [...currentIds, chapterId],
    );
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Cargando presupuesto...
        </p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            No encontramos este proyecto
          </h1>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <NexusLogo size="sm" />

          <Link
            href={`/projects/${project.id}`}
            className="mt-10 flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al proyecto
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
              Estado del presupuesto
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium">
                En desarrollo
              </span>
            </div>
          </div>

          <div className="mt-auto text-sm text-slate-500">
            Powered by Ingeniería González
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-5 sm:p-7 lg:p-10">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al proyecto
          </Link>

          <header className="mt-5 flex flex-col gap-6 xl:mt-0 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                <ReceiptText className="h-4 w-4" />
                Presupuesto General
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {project.name}
              </h1>

              <p className="mt-2 max-w-3xl text-slate-500">
                Resumen consolidado de capítulos, partidas,
                precios unitarios y montos del proyecto.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                title="Disponible en la siguiente fase"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar
              </button>

              <Link
                href={`/projects/${project.id}/chapters`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                <Layers3 className="h-4 w-4" />
                Administrar capítulos
              </Link>
            </div>
          </header>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <SummaryCard
              icon={Layers3}
              label="Capítulos"
              value={String(budgetSummary.chaptersCount)}
              detail="Estructura del presupuesto"
            />

            <SummaryCard
              icon={FolderKanban}
              label="Partidas"
              value={String(budgetSummary.itemsCount)}
              detail={`${budgetSummary.pricedItemsCount} con precio`}
            />

            <SummaryCard
              icon={CheckCircle2}
              label="Avance"
              value={`${formatNumber(
                budgetSummary.completion,
                1,
              )}%`}
              detail="APU completados"
            />

            <SummaryCard
              icon={CircleDollarSign}
              label="Total general"
              value={formatCurrency(budgetSummary.total)}
              detail="Suma de todas las partidas"
              emphasized
            />
          </section>

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <h2 className="text-lg font-bold">
                Detalle del presupuesto
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Los precios unitarios se calculan directamente
                desde cada APU.
              </p>
            </div>

            {chapterGroups.length === 0 ? (
              <EmptyBudget projectId={project.id} />
            ) : (
              <div className="divide-y divide-slate-200">
                {chapterGroups.map((group) => {
                  const isCollapsed =
                    collapsedChapterIds.includes(
                      group.chapter.id,
                    );

                  return (
                    <article key={group.chapter.id}>
                      <button
                        type="button"
                        onClick={() =>
                          toggleChapter(group.chapter.id)
                        }
                        className="flex w-full items-center justify-between gap-5 bg-slate-950 px-5 py-5 text-left text-white transition hover:bg-slate-900 sm:px-7"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black">
                            {formatChapterOrder(
                              group.chapter.order,
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-bold">
                              {group.chapter.code
                                ? `${group.chapter.code} · `
                                : ""}
                              {group.chapter.name}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {group.items.length}{" "}
                              {group.items.length === 1
                                ? "partida"
                                : "partidas"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wider text-slate-400">
                              Subtotal
                            </p>

                            <p className="mt-1 font-bold">
                              {formatCurrency(group.subtotal)}
                            </p>
                          </div>

                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 transition ${
                              isCollapsed
                                ? "-rotate-90"
                                : ""
                            }`}
                          />
                        </div>
                      </button>

                      {!isCollapsed && (
                        <ChapterItemsTable
                          projectId={project.id}
                          chapter={group.chapter}
                          items={group.items}
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {chapterGroups.length > 0 && (
            <section className="mt-6 flex justify-end">
              <div className="w-full rounded-3xl bg-blue-600 p-7 text-white shadow-xl sm:max-w-xl">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-blue-100">
                      Total del presupuesto
                    </p>

                    <p className="mt-2 text-3xl font-black sm:text-4xl">
                      {formatCurrency(budgetSummary.total)}
                    </p>
                  </div>

                  <CircleDollarSign className="h-12 w-12 text-blue-200" />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-5 text-sm">
                  <div>
                    <p className="text-blue-100">
                      Capítulos
                    </p>
                    <p className="mt-1 font-bold">
                      {budgetSummary.chaptersCount}
                    </p>
                  </div>

                  <div>
                    <p className="text-blue-100">
                      Partidas
                    </p>
                    <p className="mt-1 font-bold">
                      {budgetSummary.itemsCount}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function ChapterItemsTable({
  projectId,
  chapter,
  items,
}: {
  projectId: string;
  chapter: BudgetChapter;
  items: BudgetItemRow[];
}) {
  if (items.length === 0) {
    return (
      <div className="px-5 py-10 text-center sm:px-7">
        <p className="font-medium text-slate-600">
          Este capítulo todavía no tiene partidas.
        </p>

        <Link
          href={`/projects/${projectId}/chapters/${chapter.id}/items`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
        >
          Agregar partidas
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-6 py-4 font-semibold">
              Código
            </th>
            <th className="px-6 py-4 font-semibold">
              Partida
            </th>
            <th className="px-6 py-4 text-right font-semibold">
              Cantidad
            </th>
            <th className="px-6 py-4 font-semibold">
              Unidad
            </th>
            <th className="px-6 py-4 text-right font-semibold">
              Precio unitario
            </th>
            <th className="px-6 py-4 text-right font-semibold">
              Importe
            </th>
            <th className="px-6 py-4 text-center font-semibold">
              APU
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {items.map(
            ({ item, unitPrice, amount, isCalculated }) => (
              <tr
                key={item.id}
                className="transition hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-500">
                  {item.code || "—"}
                </td>

                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">
                    {item.name}
                  </p>

                  {item.description && (
                    <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                      {item.description}
                    </p>
                  )}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-right font-medium">
                  {formatNumber(item.quantity, 4)}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                  {item.unit}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-right font-semibold">
                  {formatCurrency(unitPrice)}
                </td>

                <td className="whitespace-nowrap px-6 py-4 text-right font-bold text-slate-950">
                  {formatCurrency(amount)}
                </td>

                <td className="px-6 py-4 text-center">
                  <Link
                    href={
                      `/projects/${projectId}` +
                      `/chapters/${chapter.id}` +
                      `/items/${item.id}/analysis`
                    }
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isCalculated
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    <Calculator className="h-4 w-4" />
                    {isCalculated ? "Revisar" : "Completar"}
                  </Link>
                </td>
              </tr>
            ),
          )}
        </tbody>

        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50">
            <td
              colSpan={5}
              className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider text-slate-500"
            >
              Subtotal del capítulo
            </td>

            <td className="whitespace-nowrap px-6 py-4 text-right text-lg font-black">
              {formatCurrency(
                items.reduce(
                  (total, currentItem) =>
                    total + currentItem.amount,
                  0,
                ),
              )}
            </td>

            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  emphasized = false,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
  detail: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        emphasized
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm font-medium ${
              emphasized
                ? "text-blue-100"
                : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p className="mt-2 text-2xl font-black">
            {value}
          </p>
        </div>

        <span
          className={`rounded-xl p-3 ${
            emphasized
              ? "bg-white/15 text-white"
              : "bg-slate-100 text-blue-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p
        className={`mt-4 text-xs ${
          emphasized
            ? "text-blue-100"
            : "text-slate-400"
        }`}
      >
        {detail}
      </p>
    </div>
  );
}

function EmptyBudget({
  projectId,
}: {
  projectId: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Layers3 className="h-8 w-8 text-slate-400" />
      </span>

      <h3 className="mt-5 text-xl font-bold">
        El presupuesto está vacío
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-slate-500">
        Crea los capítulos y partidas del proyecto para
        comenzar a consolidar el presupuesto general.
      </p>

      <Link
        href={`/projects/${projectId}/chapters`}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
      >
        <Layers3 className="h-5 w-5" />
        Crear estructura
      </Link>
    </div>
  );
}

function formatChapterOrder(order: number): string {
  return String(order).padStart(2, "0");
}

function formatNumber(
  value: number,
  maximumFractionDigits = 2,
): string {
  return value.toLocaleString("es-DO", {
    maximumFractionDigits,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}