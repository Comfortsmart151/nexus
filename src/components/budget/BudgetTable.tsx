import { ChevronDown } from "lucide-react";

import ChapterItemsTable from "@/components/budget/ChapterItemsTable";
import EmptyBudget from "@/components/budget/EmptyBudget";

import type {
  BudgetItemRow,
  InlineItemUpdate,
} from "@/components/budget/ChapterItemsTable";
import type { BudgetChapter } from "@/types/budget";

export interface BudgetChapterGroup {
  chapter: BudgetChapter;
  items: BudgetItemRow[];
  subtotal: number;
}

interface BudgetTableProps {
  projectId: string;
  chapterGroups: BudgetChapterGroup[];
  collapsedChapterIds: string[];
  onToggleChapter: (chapterId: string) => void;
  onUpdateItem: (
    itemId: string,
    input: InlineItemUpdate,
  ) => void;
  onUseApuPrice: (itemId: string) => void;
}

export default function BudgetTable({
  projectId,
  chapterGroups,
  collapsedChapterIds,
  onToggleChapter,
  onUpdateItem,
  onUseApuPrice,
}: BudgetTableProps) {
  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <h2 className="text-lg font-bold">
          Detalle del presupuesto
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Edita cantidades, unidades y precios directamente desde
          el presupuesto general.
        </p>
      </div>

      {chapterGroups.length === 0 ? (
        <EmptyBudget projectId={projectId} />
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
                    onToggleChapter(group.chapter.id)
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
                    projectId={projectId}
                    chapter={group.chapter}
                    items={group.items}
                    onUpdateItem={onUpdateItem}
                    onUseApuPrice={onUseApuPrice}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatChapterOrder(order: number): string {
  return String(order).padStart(2, "0");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}