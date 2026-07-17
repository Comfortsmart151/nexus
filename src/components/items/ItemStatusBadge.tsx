import {
  Calculator,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import type { BudgetItem } from "@/types/budget";

interface ItemStatusBadgeProps {
  status: BudgetItem["status"];
}

export default function ItemStatusBadge({
  status,
}: ItemStatusBadgeProps) {
  if (status === "priced") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Analizada
      </span>
    );
  }

  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
        <Clock3 className="h-3.5 w-3.5" />
        En proceso
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
      <Calculator className="h-3.5 w-3.5" />
      Sin analizar
    </span>
  );
}