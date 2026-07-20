import {
  CheckCircle2,
  CircleDollarSign,
  FolderKanban,
  Layers3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface BudgetSummaryCardsProps {
  chaptersCount: number;
  itemsCount: number;
  pricedItemsCount: number;
  completion: number;
  directCost: number;
}

export default function BudgetSummaryCards({
  chaptersCount,
  itemsCount,
  pricedItemsCount,
  completion,
  directCost,
}: BudgetSummaryCardsProps) {
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <SummaryCard
        icon={Layers3}
        label="Capítulos"
        value={String(chaptersCount)}
        detail="Estructura del presupuesto"
      />

      <SummaryCard
        icon={FolderKanban}
        label="Partidas"
        value={String(itemsCount)}
        detail={`${pricedItemsCount} con precio`}
      />

      <SummaryCard
        icon={CheckCircle2}
        label="Avance"
        value={`${formatNumber(completion, 1)}%`}
        detail="APU completados"
      />

      <SummaryCard
        icon={CircleDollarSign}
        label="Costo directo"
        value={formatCurrency(directCost)}
        detail="Suma de todas las partidas"
        emphasized
      />
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  emphasized = false,
}: {
  icon: LucideIcon;
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
              emphasized ? "text-blue-100" : "text-slate-500"
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
          emphasized ? "text-blue-100" : "text-slate-400"
        }`}
      >
        {detail}
      </p>
    </div>
  );
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