import Link from "next/link";
import {
  FileSpreadsheet,
  Layers3,
  ReceiptText,
} from "lucide-react";

import type { Project } from "@/types/project";

interface BudgetHeaderProps {
  project: Project;
}

export default function BudgetHeader({
  project,
}: BudgetHeaderProps) {
  return (
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
          Resumen consolidado de capítulos, partidas, precios
          unitarios y montos del proyecto.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
          title="Disponible en una próxima fase"
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
  );
}