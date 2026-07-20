import Link from "next/link";
import { Layers3 } from "lucide-react";

interface EmptyBudgetProps {
  projectId: string;
}

export default function EmptyBudget({
  projectId,
}: EmptyBudgetProps) {
  return (
    <div className="px-6 py-16 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Layers3 className="h-8 w-8 text-slate-400" />
      </span>

      <h3 className="mt-5 text-xl font-bold">
        El presupuesto está vacío
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-slate-500">
        Crea los capítulos y partidas del proyecto para comenzar a
        consolidar el presupuesto general.
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