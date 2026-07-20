"use client";

import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import BudgetHeader from "@/components/budget/BudgetHeader";
import BudgetSummaryCards from "@/components/budget/BudgetSummaryCards";
import BudgetTable from "@/components/budget/BudgetTable";
import BudgetTotals from "@/components/budget/BudgetTotals";
import NexusLogo from "@/components/ui/NexusLogo";

import { ApuService } from "@/services/apu.service";
import { BudgetService } from "@/services/budget.service";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";

import type {
  BudgetItemRow,
  InlineItemUpdate,
} from "@/components/budget/ChapterItemsTable";
import type {
  BudgetChapterGroup,
} from "@/components/budget/BudgetTable";
import type {
  BudgetTotalsResult,
  BudgetTotalsValues,
} from "@/components/budget/BudgetTotals";
import type {
  Budget,
  BudgetChapter,
  BudgetItem,
} from "@/types/budget";
import type {
  Project,
} from "@/types/project";

interface BudgetWorkspaceProps {
  projectId: string;
}

export default function BudgetWorkspace({
  projectId,
}: BudgetWorkspaceProps) {
  const [project, setProject] =
    useState<Project | null>(
      null,
    );

  const [budget, setBudget] =
    useState<Budget | null>(
      null,
    );

  const [chapters, setChapters] =
    useState<BudgetChapter[]>(
      [],
    );

  const [items, setItems] =
    useState<BudgetItem[]>(
      [],
    );

  const [loaded, setLoaded] =
    useState(false);

  const [
    collapsedChapterIds,
    setCollapsedChapterIds,
  ] = useState<string[]>(
    [],
  );

  useEffect(() => {
    const currentProject =
      ProjectService.findById(
        projectId,
      );

    setProject(
      currentProject,
    );

    if (currentProject) {
      const currentBudget =
        BudgetService.findOrCreateByProject(
          projectId,
          currentProject.name,
        );

      setBudget(
        currentBudget,
      );
    }

    setChapters(
      ChapterService.findByProject(
        projectId,
      ),
    );

    setItems(
      ItemService.findByProject(
        projectId,
      ),
    );

    setLoaded(true);
  }, [projectId]);

  const chapterGroups =
    useMemo<
      BudgetChapterGroup[]
    >(() => {
      return chapters.map(
        (chapter) => {
          const chapterItems =
            items
              .filter(
                (item) =>
                  item.chapterId ===
                  chapter.id,
              )
              .map<BudgetItemRow>(
                (item) => {
                  const calculation =
                    ApuService.calculate(
                      item.id,
                    );

                  const apuUnitPrice =
                    calculation
                      ?.finalUnitPrice ??
                    0;

                  const unitPrice =
                    item.priceSource ===
                    "manual"
                      ? item.unitPrice
                      : apuUnitPrice ||
                        item.unitPrice ||
                        0;

                  return {
                    item,
                    unitPrice,
                    amount:
                      unitPrice *
                      item.quantity,
                    isCalculated:
                      calculation
                        ?.isCalculated ??
                      false,
                  };
                },
              );

          const subtotal =
            chapterItems.reduce(
              (
                total,
                currentItem,
              ) =>
                total +
                currentItem.amount,
              0,
            );

          return {
            chapter,
            items:
              chapterItems,
            subtotal,
          };
        },
      );
    }, [chapters, items]);

  const budgetSummary =
    useMemo(() => {
      const itemsCount =
        chapterGroups.reduce(
          (
            total,
            group,
          ) =>
            total +
            group.items.length,
          0,
        );

      const pricedItemsCount =
        chapterGroups.reduce(
          (
            total,
            group,
          ) =>
            total +
            group.items.filter(
              ({
                unitPrice,
              }) =>
                unitPrice > 0,
            ).length,
          0,
        );

      const directCost =
        chapterGroups.reduce(
          (
            total,
            group,
          ) =>
            total +
            group.subtotal,
          0,
        );

      const completion =
        itemsCount > 0
          ? (pricedItemsCount /
              itemsCount) *
            100
          : 0;

      return {
        chaptersCount:
          chapterGroups.length,
        itemsCount,
        pricedItemsCount,
        directCost,
        completion,
      };
    }, [chapterGroups]);

  const totalsValues =
    useMemo<
      BudgetTotalsValues | null
    >(() => {
      if (!budget) {
        return null;
      }

      return {
        generalExpensesPercentage:
          budget.adjustments
            .generalExpensesPercentage,
        contingencyPercentage:
          budget.adjustments
            .contingencyPercentage,
        profitPercentage:
          budget.adjustments
            .profitPercentage,
        itbisPercentage:
          budget.adjustments
            .itbisPercentage,
        exchangeRate:
          budget.exchangeRate,
      };
    }, [budget]);

  function toggleChapter(
    chapterId: string,
  ) {
    setCollapsedChapterIds(
      (currentIds) =>
        currentIds.includes(
          chapterId,
        )
          ? currentIds.filter(
              (id) =>
                id !== chapterId,
            )
          : [
              ...currentIds,
              chapterId,
            ],
    );
  }

  function handleUpdateItem(
    itemId: string,
    input: InlineItemUpdate,
  ) {
    const updatedItem =
      ItemService.update(
        itemId,
        input,
      );

    if (!updatedItem) {
      return;
    }

    setItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
            item.id ===
            updatedItem.id
              ? updatedItem
              : item,
        ),
    );
  }

  function handleUseApuPrice(
    itemId: string,
  ) {
    const updatedItem =
      ItemService.useApuPrice(
        itemId,
      );

    if (!updatedItem) {
      return;
    }

    setItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
            item.id ===
            updatedItem.id
              ? updatedItem
              : item,
        ),
    );
  }

  function handleTotalsChange(
    values: BudgetTotalsValues,
    _result: BudgetTotalsResult,
  ) {
    if (!budget) {
      return;
    }

    const updatedBudget =
      BudgetService.update(
        budget.id,
        {
          exchangeRate:
            values.exchangeRate,
          adjustments: {
            generalExpensesPercentage:
              values.generalExpensesPercentage,
            contingencyPercentage:
              values.contingencyPercentage,
            profitPercentage:
              values.profitPercentage,
            itbisPercentage:
              values.itbisPercentage,
          },
        },
      );

    if (updatedBudget) {
      setBudget(
        updatedBudget,
      );
    }
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

  if (
    !project ||
    !budget
  ) {
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
              Presupuesto
            </p>

            <p className="mt-2 text-sm font-semibold">
              Versión{" "}
              {budget.version}
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

          <BudgetHeader
            project={project}
          />

          <BudgetSummaryCards
            chaptersCount={
              budgetSummary.chaptersCount
            }
            itemsCount={
              budgetSummary.itemsCount
            }
            pricedItemsCount={
              budgetSummary.pricedItemsCount
            }
            completion={
              budgetSummary.completion
            }
            directCost={
              budgetSummary.directCost
            }
          />

          <BudgetTable
            projectId={
              project.id
            }
            chapterGroups={
              chapterGroups
            }
            collapsedChapterIds={
              collapsedChapterIds
            }
            onToggleChapter={
              toggleChapter
            }
            onUpdateItem={
              handleUpdateItem
            }
            onUseApuPrice={
              handleUseApuPrice
            }
          />

          {chapterGroups.length >
            0 &&
            totalsValues && (
              <div className="mt-8">
                <BudgetTotals
                  directCost={
                    budgetSummary.directCost
                  }
                  values={
                    totalsValues
                  }
                  onChange={
                    handleTotalsChange
                  }
                />
              </div>
            )}
        </section>
      </div>
    </main>
  );
}