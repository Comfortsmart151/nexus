import { Settings2 } from "lucide-react";

import type { ApuAdjustments } from "@/types/budget";

export type AdjustmentField = keyof ApuAdjustments;

interface ApuAdjustmentsPanelProps {
  adjustments: ApuAdjustments;
  onChange: (
    field: AdjustmentField,
    value: string,
  ) => void;
}

export default function ApuAdjustmentsPanel({
  adjustments,
  onChange,
}: ApuAdjustmentsPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Settings2 className="h-5 w-5" />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Ajustes del APU
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Los cambios se calculan y guardan
            automáticamente.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <PercentageInput
          label="Costos indirectos"
          value={adjustments.indirectCostsPercentage}
          onChange={(value) =>
            onChange(
              "indirectCostsPercentage",
              value,
            )
          }
        />

        <PercentageInput
          label="Contingencia"
          value={adjustments.contingencyPercentage}
          onChange={(value) =>
            onChange(
              "contingencyPercentage",
              value,
            )
          }
        />

        <PercentageInput
          label="Utilidad"
          value={adjustments.profitPercentage}
          onChange={(value) =>
            onChange("profitPercentage", value)
          }
        />

        <PercentageInput
          label="Impuestos"
          value={adjustments.taxPercentage}
          onChange={(value) =>
            onChange("taxPercentage", value)
          }
        />
      </div>

      <div className="mt-5 rounded-2xl bg-amber-50 p-4">
        <p className="text-xs leading-5 text-amber-800">
          Estos porcentajes pertenecen únicamente a esta
          partida. No modifican otros APU del proyecto.
        </p>
      </div>
    </section>
  );
}

function PercentageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="nexus-input pr-11"
        />

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
          %
        </span>
      </div>
    </div>
  );
}