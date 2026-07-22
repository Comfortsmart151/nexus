"use client";

import {
  AlertCircle,
  Check,
  Sparkles,
} from "lucide-react";

import type {
  NexusAiGenerationRequest,
} from "@/types/nexus-ai";

const UNIT_OPTIONS = [
  "ud",
  "m",
  "m²",
  "m³",
  "kg",
  "lb",
  "ton",
  "gal",
  "litro",
  "funda",
  "día",
  "hora",
  "global",
];

const DESCRIPTION_EXAMPLES = [
  'Construcción de muro de bloques de 6" con mortero, incluyendo mano de obra y herramientas.',
  "Aplicación de pañete liso en muros interiores, incluyendo materiales y mano de obra.",
  "Suministro y aplicación de pintura acrílica interior en dos manos.",
  "Vaciado de hormigón estructural de 3,000 PSI, incluyendo mano de obra y equipos.",
  "Colocación de piso de cerámica, incluyendo adhesivo, derretido y mano de obra.",
];

export interface AiPromptEditorProps {
  request: NexusAiGenerationRequest;
  onChange: (
    request: NexusAiGenerationRequest,
  ) => void;
  error?: string | null;
  disabled?: boolean;
  showExamples?: boolean;
  autoFocus?: boolean;
}

interface OptionToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (
    checked: boolean,
  ) => void;
}

function normalizeQuantity(
  value: string,
): number {
  if (!value.trim()) {
    return 0;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return parsedValue;
}

function OptionToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: OptionToggleProps) {
  return (
    <label
      className={[
        "rounded-2xl border p-4 transition",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer",
        checked
          ? "border-violet-300 bg-violet-50"
          : "border-slate-200 bg-white",
        !disabled && !checked
          ? "hover:border-slate-300 hover:bg-slate-50"
          : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
            checked
              ? "border-violet-600 bg-violet-600 text-white"
              : "border-slate-300 bg-white text-transparent",
          ].join(" ")}
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" />
        </span>

        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.checked,
            )
          }
          className="sr-only"
        />

        <div>
          <div className="text-sm font-bold text-slate-900">
            {label}
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </label>
  );
}

export function AiPromptEditor({
  request,
  onChange,
  error = null,
  disabled = false,
  showExamples = true,
  autoFocus = false,
}: AiPromptEditorProps) {
  const updateRequest = (
    values: Partial<NexusAiGenerationRequest>,
  ) => {
    onChange({
      ...request,
      ...values,
    });
  };

  const handleExampleClick = (
    description: string,
  ) => {
    if (disabled) {
      return;
    }

    updateRequest({
      description,
    });
  };

  return (
    <section className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="nexus-ai-description"
            className="text-sm font-bold text-slate-800"
          >
            Describe la partida
          </label>

          <span className="text-xs font-medium text-slate-400">
            {request.description.length} caracteres
          </span>
        </div>

        <div className="relative">
          <textarea
            id="nexus-ai-description"
            value={request.description}
            disabled={disabled}
            autoFocus={autoFocus}
            rows={8}
            placeholder={'Ejemplo: Construcción de muro de bloques de 6" con mortero, incluyendo mano de obra y herramientas.'}
            onChange={(event) =>
              updateRequest({
                description:
                  event.target.value,
              })
            }
            className={[
              "w-full resize-none rounded-2xl border bg-white px-4 py-4 pr-12 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100",
              disabled
                ? "cursor-not-allowed bg-slate-100 text-slate-500"
                : "",
            ].join(" ")}
          />

          <div className="pointer-events-none absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Incluye el tipo de trabajo, material,
          dimensión, resistencia, ubicación o
          terminación cuando aplique.
        </p>
      </div>

      {showExamples ? (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Ejemplos rápidos
          </p>

          <div className="flex flex-wrap gap-2">
            {DESCRIPTION_EXAMPLES.map(
              (description, index) => (
                <button
                  key={description}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    handleExampleClick(
                      description,
                    )
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ejemplo {index + 1}
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="nexus-ai-quantity"
            className="mb-2 block text-sm font-bold text-slate-800"
          >
            Cantidad
          </label>

          <input
            id="nexus-ai-quantity"
            type="number"
            min="0.000001"
            step="any"
            disabled={disabled}
            value={request.quantity ?? ""}
            onChange={(event) =>
              updateRequest({
                quantity:
                  normalizeQuantity(
                    event.target.value,
                  ),
              })
            }
            className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Cantidad total de la partida dentro del
            presupuesto.
          </p>
        </div>

        <div>
          <label
            htmlFor="nexus-ai-unit"
            className="mb-2 block text-sm font-bold text-slate-800"
          >
            Unidad
          </label>

          <select
            id="nexus-ai-unit"
            value={request.unit ?? ""}
            disabled={disabled}
            onChange={(event) =>
              updateRequest({
                unit:
                  event.target.value ||
                  undefined,
              })
            }
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">
              Detectar automáticamente
            </option>

            {UNIT_OPTIONS.map((unit) => (
              <option
                key={unit}
                value={unit}
              >
                {unit}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-500">
            NEXUS puede detectarla a partir de la
            descripción.
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-800">
          Elementos que debe considerar
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <OptionToggle
            label="Desperdicio"
            description="Aplica los porcentajes definidos en la regla constructiva."
            checked={
              request.includeWaste !== false
            }
            disabled={disabled}
            onChange={(checked) =>
              updateRequest({
                includeWaste: checked,
              })
            }
          />

          <OptionToggle
            label="Herramientas"
            description="Incluye equipos y herramientas opcionales."
            checked={
              request.includeTools !== false
            }
            disabled={disabled}
            onChange={(checked) =>
              updateRequest({
                includeTools: checked,
              })
            }
          />

          <OptionToggle
            label="Transporte"
            description="Incluye acarreo o transporte cuando la regla lo contemple."
            checked={
              request.includeTransportation ===
              true
            }
            disabled={disabled}
            onChange={(checked) =>
              updateRequest({
                includeTransportation:
                  checked,
              })
            }
          />
        </div>
      </div>

      {error ? (
        <div
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="leading-6">
            {error}
          </p>
        </div>
      ) : null}
    </section>
  );
}