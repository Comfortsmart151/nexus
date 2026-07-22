"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  PackageSearch,
  RotateCcw,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AiConfidenceBadge,
} from "@/components/analysis/ai/AiConfidenceBadge";

import {
  NexusAiGeneratorService,
} from "@/services/nexusAiGenerator.service";

import type {
  NexusAiApuProposal,
  NexusAiGenerationProgress,
  NexusAiGenerationRequest,
} from "@/types/nexus-ai";

interface NexusAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    proposal: NexusAiApuProposal,
  ) => void;
  initialDescription?: string;
  initialUnit?: string;
  initialQuantity?: number;
}

type ModalStep =
  | "prompt"
  | "generating"
  | "result";

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

function createInitialRequest(
  description = "",
  unit = "",
  quantity = 1,
): NexusAiGenerationRequest {
  return {
    description,
    unit: unit || undefined,
    quantity,
    countryCode: "DO",
    currencyCode: "DOP",
    includeWaste: true,
    includeTools: true,
    includeTransportation: false,
  };
}

function formatCurrency(
  value: number,
  currencyCode = "DOP",
): string {
  return new Intl.NumberFormat(
    "es-DO",
    {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatQuantity(
  value: number,
): string {
  return new Intl.NumberFormat(
    "es-DO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    },
  ).format(value);
}

export function NexusAiGeneratorModal({
  isOpen,
  onClose,
  onApply,
  initialDescription = "",
  initialUnit = "",
  initialQuantity = 1,
}: NexusAiGeneratorModalProps) {
  const [step, setStep] =
    useState<ModalStep>("prompt");

  const [request, setRequest] =
    useState<NexusAiGenerationRequest>(
      createInitialRequest(
        initialDescription,
        initialUnit,
        initialQuantity,
      ),
    );

  const [proposal, setProposal] =
    useState<NexusAiApuProposal | null>(
      null,
    );

  const [progress, setProgress] =
    useState<NexusAiGenerationProgress | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [isApplying, setIsApplying] =
    useState(false);

  const canGenerate = useMemo(() => {
    return (
      request.description.trim().length >=
        3 &&
      Number.isFinite(request.quantity) &&
      (request.quantity ?? 0) > 0
    );
  }, [
    request.description,
    request.quantity,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRequest(
      createInitialRequest(
        initialDescription,
        initialUnit,
        initialQuantity,
      ),
    );

    setStep("prompt");
    setProposal(null);
    setProgress(null);
    setError(null);
    setIsApplying(false);
  }, [
    isOpen,
    initialDescription,
    initialUnit,
    initialQuantity,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleGenerate = () => {
    if (!canGenerate) {
      setError(
        "Escribe una descripción válida y una cantidad mayor que cero.",
      );

      return;
    }

    setStep("generating");
    setProposal(null);
    setError(null);

    setProgress({
      status: "analyzing",
      percentage: 5,
      message:
        "Preparando el análisis de la partida...",
    });

    window.setTimeout(() => {
      try {
        const result =
          NexusAiGeneratorService.generate(
            {
              ...request,
              description:
                request.description.trim(),
              quantity:
                request.quantity ?? 1,
            },
            {
              allowIncompleteApu: true,
              includeOptionalResources: true,
              onProgress: (
                nextProgress,
              ) => {
                setProgress(
                  nextProgress,
                );
              },
            },
          );

        if (
          !result.success ||
          !result.proposal
        ) {
          const message =
            result.errors
              .map(
                (generationError) =>
                  generationError.message,
              )
              .filter(Boolean)
              .join(" ") ||
            "No fue posible generar el APU.";

          setError(message);
          setStep("prompt");

          return;
        }

        setProposal(result.proposal);
        setStep("result");
      } catch (generationError) {
        const message =
          generationError instanceof Error
            ? generationError.message
            : "Ocurrió un error inesperado al generar el APU.";

        setError(message);
        setStep("prompt");
      }
    }, 150);
  };

  const handleReset = () => {
    setProposal(null);
    setProgress(null);
    setError(null);
    setStep("prompt");
  };

  const handleApply = () => {
    if (!proposal) {
      return;
    }

    setIsApplying(true);

    try {
      onApply(proposal);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nexus-ai-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar generador"
        onClick={onClose}
      />

      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
              <WandSparkles className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="nexus-ai-modal-title"
                  className="truncate text-xl font-bold text-slate-950"
                >
                  Generador de APU con NEXUS AI
                </h2>

                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
                  Beta
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Describe una partida y NEXUS
                propondrá sus recursos,
                coeficientes y costos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {step === "prompt" ? (
            <div className="grid flex-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="space-y-6">
                <div>
                  <label
                    htmlFor="nexus-ai-description"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Describe la partida
                  </label>

                  <textarea
                    id="nexus-ai-description"
                    value={
                      request.description
                    }
                    onChange={(event) => {
                      setRequest(
                        (current) => ({
                          ...current,
                          description:
                            event.target.value,
                        }),
                      );

                      setError(null);
                    }}
                    rows={8}
                    autoFocus
                    placeholder={'Ejemplo: Construcción de muro de bloques de 6" con mortero, incluyendo mano de obra y herramientas.'}
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />

                  <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                    <span>
                      Incluye material, dimensión,
                      resistencia o tipo de
                      terminación cuando aplique.
                    </span>

                    <span>
                      {
                        request.description
                          .length
                      }{" "}
                      caracteres
                    </span>
                  </div>
                </div>

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
                      value={
                        request.quantity ?? 1
                      }
                      onChange={(event) => {
                        const value =
                          Number(
                            event.target.value,
                          );

                        setRequest(
                          (current) => ({
                            ...current,
                            quantity: value,
                          }),
                        );
                      }}
                      className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
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
                      value={
                        request.unit ?? ""
                      }
                      onChange={(event) => {
                        setRequest(
                          (current) => ({
                            ...current,
                            unit:
                              event.target
                                .value ||
                              undefined,
                          }),
                        );
                      }}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="">
                        Detectar automáticamente
                      </option>

                      {UNIT_OPTIONS.map(
                        (unit) => (
                          <option
                            key={unit}
                            value={unit}
                          >
                            {unit}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    Elementos que debe considerar
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <OptionToggle
                      label="Desperdicio"
                      description="Aplica los porcentajes definidos."
                      checked={
                        request.includeWaste !==
                        false
                      }
                      onChange={(checked) =>
                        setRequest(
                          (current) => ({
                            ...current,
                            includeWaste:
                              checked,
                          }),
                        )
                      }
                    />

                    <OptionToggle
                      label="Herramientas"
                      description="Incluye equipos opcionales."
                      checked={
                        request.includeTools !==
                        false
                      }
                      onChange={(checked) =>
                        setRequest(
                          (current) => ({
                            ...current,
                            includeTools:
                              checked,
                          }),
                        )
                      }
                    />

                    <OptionToggle
                      label="Transporte"
                      description="Incluye acarreo cuando exista."
                      checked={
                        request.includeTransportation ===
                        true
                      }
                      onChange={(checked) =>
                        setRequest(
                          (current) => ({
                            ...current,
                            includeTransportation:
                              checked,
                          }),
                        )
                      }
                    />
                  </div>
                </div>

                {error ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : null}
              </section>

              <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h3 className="mt-4 font-bold text-slate-950">
                  ¿Qué hará NEXUS?
                </h3>

                <div className="mt-5 space-y-4">
                  <ProcessItem
                    number="1"
                    title="Interpretar la descripción"
                    description="Detectará categoría, unidad, medidas y atributos."
                  />

                  <ProcessItem
                    number="2"
                    title="Buscar una regla"
                    description="Comparará la partida con la base de conocimiento."
                  />

                  <ProcessItem
                    number="3"
                    title="Vincular recursos"
                    description="Buscará materiales y mano de obra en tu biblioteca."
                  />

                  <ProcessItem
                    number="4"
                    title="Calcular el APU"
                    description="Aplicará coeficientes, desperdicios, precios y subtotales."
                  />
                </div>

                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  La propuesta debe revisarse antes
                  de incorporarse al presupuesto
                  definitivo.
                </div>
              </aside>
            </div>
          ) : null}

          {step === "generating" ? (
            <div className="flex min-h-[480px] flex-col items-center justify-center p-8 text-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-violet-100 text-violet-700">
                <Loader2 className="h-11 w-11 animate-spin" />

                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-bold text-slate-950">
                Construyendo el APU
              </h3>

              <p className="mt-2 max-w-lg text-slate-500">
                {progress?.message ??
                  "NEXUS está analizando la partida."}
              </p>

              <div className="mt-8 w-full max-w-xl">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>
                    Progreso del análisis
                  </span>

                  <span>
                    {Math.round(
                      progress?.percentage ??
                        0,
                    )}
                    %
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-violet-600 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          progress?.percentage ??
                            0,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === "result" &&
          proposal ? (
            <div className="space-y-6 p-6">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-lg bg-slate-950 px-2.5 py-1 font-mono text-xs font-bold text-white">
                        {proposal.code}
                      </span>

                      <AiConfidenceBadge
                        confidence={
                          proposal.confidence
                        }
                        confidenceLevel={
                          proposal.confidenceLevel
                        }
                      />
                    </div>

                    <h3 className="mt-3 text-xl font-bold text-slate-950">
                      {proposal.name}
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {proposal.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:min-w-[240px]">
                    <ResultMetric
                      label="Cantidad"
                      value={formatQuantity(
                        proposal.quantity,
                      )}
                    />

                    <ResultMetric
                      label="Unidad"
                      value={proposal.unit}
                    />
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                  <div>
                    <h3 className="font-bold text-slate-950">
                      Recursos propuestos
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        proposal.resources
                          .length
                      }{" "}
                      recursos incluidos en el
                      análisis.
                    </p>
                  </div>

                  <PackageSearch className="h-5 w-5 text-slate-400" />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3">
                          Recurso
                        </th>

                        <th className="px-4 py-3">
                          Tipo
                        </th>

                        <th className="px-4 py-3 text-right">
                          Cantidad
                        </th>

                        <th className="px-4 py-3">
                          Unidad
                        </th>

                        <th className="px-4 py-3 text-right">
                          Precio
                        </th>

                        <th className="px-5 py-3 text-right">
                          Subtotal
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {proposal.resources.map(
                        (resource) => (
                          <tr
                            key={resource.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">
                                {resource.name}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                {resource.resourceCode ? (
                                  <span>
                                    {
                                      resource.resourceCode
                                    }
                                  </span>
                                ) : null}

                                {resource.requiresReview ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                                    Revisar
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-emerald-700">
                                    <Check className="h-3.5 w-3.5" />
                                    Vinculado
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {NexusAiGeneratorService.getResourceTypeLabel(
                                resource.resourceType,
                              )}
                            </td>

                            <td className="px-4 py-4 text-right font-medium text-slate-900">
                              {formatQuantity(
                                resource.finalQuantity,
                              )}
                            </td>

                            <td className="px-4 py-4 text-slate-600">
                              {resource.unit}
                            </td>

                            <td className="px-4 py-4 text-right text-slate-700">
                              {formatCurrency(
                                resource.unitPrice,
                                proposal.request
                                  .currencyCode,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right font-bold text-slate-950">
                              {formatCurrency(
                                resource.subtotal,
                                proposal.request
                                  .currencyCode,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="space-y-4">
                  {proposal.warnings.length >
                  0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <h3 className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertCircle className="h-5 w-5" />
                        Advertencias
                      </h3>

                      <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
                        {proposal.warnings.map(
                          (warning) => (
                            <li
                              key={warning}
                              className="flex gap-2"
                            >
                              <span>•</span>
                              <span>
                                {warning}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : null}

                  {proposal.assumptions.length >
                  0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h3 className="font-bold text-slate-950">
                        Supuestos del análisis
                      </h3>

                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                        {proposal.assumptions.map(
                          (assumption) => (
                            <li
                              key={assumption}
                              className="flex gap-2"
                            >
                              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-600" />
                              <span>
                                {assumption}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : null}
                </section>

                <aside className="h-fit rounded-2xl bg-slate-950 p-5 text-white shadow-xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Resumen del APU
                  </p>

                  <div className="mt-5 space-y-3 text-sm">
                    <SummaryRow
                      label="Materiales"
                      value={formatCurrency(
                        proposal.summary
                          .materialsCost,
                        proposal.request
                          .currencyCode,
                      )}
                    />

                    <SummaryRow
                      label="Mano de obra"
                      value={formatCurrency(
                        proposal.summary
                          .laborCost,
                        proposal.request
                          .currencyCode,
                      )}
                    />

                    <SummaryRow
                      label="Equipos"
                      value={formatCurrency(
                        proposal.summary
                          .equipmentCost,
                        proposal.request
                          .currencyCode,
                      )}
                    />

                    <SummaryRow
                      label="Subcontratos"
                      value={formatCurrency(
                        proposal.summary
                          .subcontractCost,
                        proposal.request
                          .currencyCode,
                      )}
                    />
                  </div>

                  <div className="my-5 h-px bg-slate-700" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-400">
                        Costo directo unitario
                      </p>

                      <p className="mt-1 text-2xl font-black">
                        {formatCurrency(
                          proposal.summary
                            .suggestedUnitPrice,
                          proposal.request
                            .currencyCode,
                        )}
                      </p>
                    </div>
                  </div>

                  {proposal.requiresReview ? (
                    <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
                      Esta propuesta contiene
                      elementos que requieren
                      revisión.
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-200">
                      Los recursos principales
                      fueron vinculados
                      correctamente.
                    </div>
                  )}
                </aside>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center">
          <div>
            {step === "result" ? (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Modificar descripción
              </button>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            {step === "prompt" ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <Sparkles className="h-4 w-4" />
                Generar APU
              </button>
            ) : null}

            {step === "generating" ? (
              <button
                type="button"
                disabled
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white opacity-80"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando
              </button>
            ) : null}

            {step === "result" ? (
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}

                Incorporar al APU
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}

interface OptionToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean,
  ) => void;
}

function OptionToggle({
  label,
  description,
  checked,
  onChange,
}: OptionToggleProps) {
  return (
    <label
      className={[
        "cursor-pointer rounded-2xl border p-4 transition",
        checked
          ? "border-violet-300 bg-violet-50"
          : "border-slate-200 bg-white hover:border-slate-300",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            onChange(
              event.target.checked,
            )
          }
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
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

interface ProcessItemProps {
  number: string;
  title: string;
  description: string;
}

function ProcessItem({
  number,
  title,
  description,
}: ProcessItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
        {number}
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-900">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

interface ResultMetricProps {
  label: string;
  value: string;
}

function ResultMetric({
  label,
  value,
}: ResultMetricProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-400">
        {label}
      </span>

      <span className="font-semibold text-white">
        {value}
      </span>
    </div>
  );
}