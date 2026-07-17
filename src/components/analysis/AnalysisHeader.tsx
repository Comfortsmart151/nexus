import {
  Calculator,
  CheckCircle2,
} from "lucide-react";

import type { BudgetItem } from "@/types/budget";

interface AnalysisHeaderProps {
  item: BudgetItem;
  analysisComplete: boolean;
}

export default function AnalysisHeader({
  item,
  analysisComplete,
}: AnalysisHeaderProps) {
  return (
    <header className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Análisis de precio unitario
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {item.name}
        </h1>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
            Código: {item.code ?? item.id}
          </span>

          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
            Unidad: {item.unit}
          </span>

          <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
            Cantidad:{" "}
            {item.quantity.toLocaleString("es-DO", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {analysisComplete ? (
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          APU calculado
        </span>
      ) : (
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          <Calculator className="h-4 w-4" />
          Sin analizar
        </span>
      )}
    </header>
  );
}