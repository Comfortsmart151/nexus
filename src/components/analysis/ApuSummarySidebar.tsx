"use client";

import {
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  Hammer,
  Truck,
  type LucideIcon,
} from "lucide-react";

interface ApuSummarySidebarProps {
  materialsTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  subcontractTotal: number;
  directCost: number;
  analysisVolume: number;
  unitPrice: number;
  itemTotal: number;
  quantity: number;
  unit: string;
  analysisComplete: boolean;
  resourceCount: number;
  missingPriceCount: number;
  referentialPriceCount: number;
  invalidQuantityCount: number;
}

interface CostCategory {
  label: string;
  value: number;
  icon: LucideIcon;
  barClassName: string;
  iconClassName: string;
}

export default function ApuSummarySidebar({
  materialsTotal,
  laborTotal,
  equipmentTotal,
  subcontractTotal,
  directCost,
  analysisVolume,
  unitPrice,
  itemTotal,
  quantity,
  unit,
  analysisComplete,
  resourceCount,
  missingPriceCount,
  referentialPriceCount,
  invalidQuantityCount,
}: ApuSummarySidebarProps) {
  const categories: CostCategory[] = [
    {
      label: "Materiales",
      value: materialsTotal,
      icon: Boxes,
      barClassName: "bg-blue-500",
      iconClassName: "bg-blue-500/15 text-blue-300",
    },
    {
      label: "Mano de obra",
      value: laborTotal,
      icon: BriefcaseBusiness,
      barClassName: "bg-emerald-500",
      iconClassName: "bg-emerald-500/15 text-emerald-300",
    },
    {
      label: "Equipos",
      value: equipmentTotal,
      icon: Truck,
      barClassName: "bg-amber-400",
      iconClassName: "bg-amber-400/15 text-amber-300",
    },
    {
      label: "Subcontratos",
      value: subcontractTotal,
      icon: Hammer,
      barClassName: "bg-violet-500",
      iconClassName: "bg-violet-500/15 text-violet-300",
    },
  ];

  const status = getAnalysisStatus({
    analysisComplete,
    directCost,
    resourceCount,
    missingPriceCount,
    referentialPriceCount,
    invalidQuantityCount,
  });

  return (
    <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
      <div className="border-b border-slate-800 px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Resumen del APU
            </p>
            <h2 className="mt-2 text-xl font-bold">
              Composición del costo
            </h2>
          </div>

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${status.iconClassName}`}
          >
            <status.icon className="h-5 w-5" />
          </div>
        </div>

        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${status.badgeClassName}`}
        >
          <span className={`h-2 w-2 rounded-full ${status.dotClassName}`} />
          {status.label}
        </div>

        {(missingPriceCount > 0 || invalidQuantityCount > 0) && (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-100">
            {missingPriceCount > 0 && (
              <p>{missingPriceCount} recurso(s) sin precio válido.</p>
            )}
            {invalidQuantityCount > 0 && (
              <p>{invalidQuantityCount} recurso(s) con cantidad pendiente.</p>
            )}
            <p className="mt-1 text-amber-200/70">El costo mostrado es parcial hasta completar estos datos.</p>
          </div>
        )}
      </div>

      <div className="px-7 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Costos directos
        </p>

        <div className="mt-5 space-y-5">
          {categories.map((category) => (
            <CostCategoryRow
              key={category.label}
              category={category}
              directCost={directCost}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-slate-400">
              Costo total del análisis
            </span>
            <span className="text-lg font-bold">
              {formatCurrency(directCost)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-7 py-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-400">Volumen del análisis</span>
          <span className="font-semibold">
            {formatQuantity(analysisVolume)} {unit}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {formatCurrency(directCost)} ÷ {formatQuantity(analysisVolume)} {unit} = {formatCurrency(unitPrice)} / {unit}
        </p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Criterio de cálculo
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Este APU contiene únicamente costos directos. Los gastos
          generales, contingencia, utilidad e impuestos se aplican
          una sola vez en el presupuesto general.
        </p>
      </div>

      <div className="border-t border-blue-400/20 bg-gradient-to-br from-blue-600 to-blue-700 px-7 py-7">
        <div className="flex items-center gap-2 text-blue-100">
          <CircleDollarSign className="h-5 w-5" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            Precio unitario
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
          <p className="text-3xl font-black tracking-tight sm:text-4xl">
            {formatCurrency(unitPrice)}
          </p>
          <span className="pb-1 text-sm font-medium text-blue-100">
            / {unit}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-800 px-7 py-7">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-400">Cantidad</span>
          <span className="font-semibold">
            {formatQuantity(quantity)} {unit}
          </span>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Total de la partida
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-50">
            {formatCurrency(itemTotal)}
          </p>
          <p className="mt-2 text-xs text-emerald-200/70">
            {formatQuantity(quantity)} {unit} × {formatCurrency(unitPrice)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CostCategoryRow({
  category,
  directCost,
}: {
  category: CostCategory;
  directCost: number;
}) {
  const Icon = category.icon;
  const percentage = calculatePercentage(category.value, directCost);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${category.iconClassName}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-300">
              {category.label}
            </span>
            <span className="shrink-0 font-semibold">
              {formatCurrency(category.value)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${category.barClassName}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-12 text-right text-xs font-semibold text-slate-500">
              {formatPercentage(percentage)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAnalysisStatus({
  analysisComplete,
  directCost,
  resourceCount,
  missingPriceCount,
  referentialPriceCount,
  invalidQuantityCount,
}: {
  analysisComplete: boolean;
  directCost: number;
  resourceCount: number;
  missingPriceCount: number;
  referentialPriceCount: number;
  invalidQuantityCount: number;
}) {
  if (analysisComplete && directCost > 0 && referentialPriceCount > 0) {
    return {
      label: `APU costeado · ${referentialPriceCount} precio(s) por validar`,
      icon: CircleAlert,
      iconClassName: "bg-amber-400/15 text-amber-300",
      badgeClassName: "bg-amber-400/10 text-amber-300",
      dotClassName: "bg-amber-300",
    };
  }

  if (analysisComplete && directCost > 0) {
    return {
      label: "APU completo · precios validados",
      icon: CheckCircle2,
      iconClassName: "bg-emerald-500/15 text-emerald-300",
      badgeClassName: "bg-emerald-500/10 text-emerald-300",
      dotClassName: "bg-emerald-400",
    };
  }

  if (resourceCount > 0) {
    const pendingCount = missingPriceCount + invalidQuantityCount;
    return {
      label: pendingCount > 0
        ? `APU parcial · ${pendingCount} dato(s) pendiente(s)`
        : "APU en revisión",
      icon: CircleAlert,
      iconClassName: "bg-amber-400/15 text-amber-300",
      badgeClassName: "bg-amber-400/10 text-amber-300",
      dotClassName: "bg-amber-300",
    };
  }

  return {
    label: "Sin recursos agregados",
    icon: CircleAlert,
    iconClassName: "bg-rose-500/15 text-rose-300",
    badgeClassName: "bg-rose-500/10 text-rose-300",
    dotClassName: "bg-rose-400",
  };
}

function calculatePercentage(value: number, total: number): number {
  if (total <= 0 || value <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (value / total) * 100));
}

function formatPercentage(value: number): string {
  return `${value.toLocaleString("es-DO", {
    maximumFractionDigits: 1,
  })}%`;
}

function formatQuantity(value: number): string {
  return value.toLocaleString("es-DO", {
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}