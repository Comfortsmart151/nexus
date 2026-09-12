"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileSearch,
  Loader2,
  Ruler,
  ScanLine,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PlanAnalysisService } from "@/services/planAnalysis.service";
import type { PlanAnalysis } from "@/types/planAnalysis";

function formatNumber(value?: number, decimals = 2) {
  if (value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-DO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function PlanAnalysisWorkspace({
  projectId,
  planId,
}: {
  projectId: string;
  planId: string;
}) {
  const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAnalysis(PlanAnalysisService.find(planId));
    setReady(true);
  }, [planId]);

  async function analyze() {
    setBusy(true);
    setError("");
    try {
      setAnalysis(await PlanAnalysisService.analyze(planId, projectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar el plano.");
    } finally {
      setBusy(false);
    }
  }

  function decide(id: string, decision: "accepted" | "rejected") {
    setAnalysis(PlanAnalysisService.setDecision(planId, id, decision));
  }

  function updateProposal(
    id: string,
    patch: Parameters<typeof PlanAnalysisService.updateProposal>[2],
  ) {
    setAnalysis(PlanAnalysisService.updateProposal(planId, id, patch));
  }

  function approve() {
    try {
      setAnalysis(PlanAnalysisService.approveAccepted(planId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo incorporar.");
    }
  }

  if (!ready) {
    return <main className="min-h-screen bg-slate-100 p-10">Cargando análisis...</main>;
  }

  const geometry = analysis?.geometry;

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/projects/${projectId}/plans`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a planos
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">NEXUS · Motor de Planos v3</p>
            <h1 className="mt-1 text-3xl font-bold">Interpretación geométrica y partidas</h1>
            <p className="mt-2 max-w-3xl text-slate-500">
              NEXUS usa texto, posición de cotas, rótulos y elevaciones del PDF para reconstruir
              mediciones defendibles antes de proponer partidas.
            </p>
          </div>
          {analysis && (
            <button
              onClick={analyze}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-5 py-3 font-semibold shadow-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
              {busy ? "Reanalizando..." : "Reanalizar con v3"}
            </button>
          )}
        </div>

        {!analysis && (
          <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
            <FileSearch className="h-10 w-10 text-blue-600" />
            <h2 className="mt-4 text-xl font-bold">Plano pendiente de análisis</h2>
            <p className="mt-2 max-w-2xl text-slate-500">
              Esta versión reconoce cotas CAD independientes por su posición en la lámina, además de
              dimensiones escritas como A × B, rótulos de espacios y alturas repetidas en elevaciones.
            </p>
            <button
              onClick={analyze}
              disabled={busy}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSearch className="h-5 w-5" />}
              {busy ? "Analizando..." : "Analizar plano"}
            </button>
          </section>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {analysis && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                ["Disciplina", analysis.discipline],
                ["Escala", analysis.scale],
                ["Nivel", analysis.level],
                ["Láminas", String(analysis.pages)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border bg-white p-5">
                  <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
                  <p className="mt-2 font-bold">{value}</p>
                </div>
              ))}
            </section>

            {geometry && (
              <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-600">Reconstrucción espacial</p>
                    <h2 className="mt-1 text-xl font-bold">Geometría interpretada</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Confianza {geometry.confidence}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">Huella general</p>
                    <p className="mt-2 text-lg font-bold">
                      {formatNumber(geometry.overallLength, 3)} × {formatNumber(geometry.overallWidth, 3)} m
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Página {geometry.sourcePage}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">Área bruta</p>
                    <p className="mt-2 text-lg font-bold">{formatNumber(geometry.grossArea)} m²</p>
                    <p className="mt-1 text-xs text-slate-500">Cotas maestras</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">Área útil inferida</p>
                    <p className="mt-2 text-lg font-bold">{formatNumber(geometry.netFloorArea)} m²</p>
                    <p className="mt-1 text-xs text-slate-500">Tramos interiores × ancho libre</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-400">Altura útil</p>
                    <p className="mt-2 text-lg font-bold">{formatNumber(geometry.clearHeight, 3)} m</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {geometry.elevationPage ? `Elevaciones · pág. ${geometry.elevationPage}` : "No detectada"}
                    </p>
                  </div>
                </div>

                {!!geometry.horizontalSegments.length && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                    <div className="flex items-start gap-3">
                      <Ruler className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">Cadena interior detectada</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {geometry.horizontalSegments.map((x) => formatNumber(x, 3)).join(" + ")} m
                          {geometry.clearWidth ? ` · ancho libre repetido ${formatNumber(geometry.clearWidth, 3)} m` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!!geometry.spaces.length && (
                  <div className="mt-5">
                    <p className="text-sm font-bold">Espacios reconocidos</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {geometry.spaces.map((space) => (
                        <span key={space.name} className="rounded-full border bg-white px-3 py-1.5 text-sm font-medium">
                          {space.name} × {space.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!!geometry.notes.length && (
                  <ul className="mt-5 space-y-1 text-sm text-slate-500">
                    {geometry.notes.map((note) => <li key={note}>• {note}</li>)}
                  </ul>
                )}
              </section>
            )}

            <section className="mt-6 rounded-3xl border bg-white p-6">
              <h2 className="text-xl font-bold">Mediciones detectadas</h2>
              <div className="mt-4 grid gap-3">
                {analysis.measurements.map((m) => (
                  <div key={m.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold">{m.label}</span>
                      <span className="font-bold">{m.quantity} {m.unit}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{m.source} · Confianza {m.confidence}</p>
                  </div>
                ))}
                {!analysis.measurements.length && (
                  <p className="text-slate-500">Sin mediciones automáticas defendibles.</p>
                )}
              </div>
            </section>

            <section className="mt-6 rounded-3xl border bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Partidas propuestas</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Revisa cantidades y ajustes. Aceptar no incorpora todavía: usa “Incorporar aceptadas” al terminar.
                  </p>
                </div>
                <button
                  onClick={approve}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white"
                >
                  Incorporar aceptadas
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {analysis.proposals.map((p) => (
                  <article key={p.id} className="rounded-2xl border p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-blue-600">{p.code} · Confianza {p.confidence}</p>
                        <h3 className="mt-1 font-bold">{p.name}</h3>
                        <p className="mt-2 text-sm text-slate-500">{p.rationale}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(p.id, "accepted")}
                          className={`inline-flex items-center gap-1 rounded-xl px-4 py-2 font-semibold ${p.decision === "accepted" ? "bg-emerald-600 text-white" : "border"}`}
                        >
                          <Check className="h-4 w-4" />
                          Aceptar
                        </button>
                        <button
                          onClick={() => decide(p.id, "rejected")}
                          className={`inline-flex items-center gap-1 rounded-xl px-4 py-2 font-semibold ${p.decision === "rejected" ? "bg-red-600 text-white" : "border"}`}
                        >
                          <X className="h-4 w-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="text-xs font-semibold text-slate-600">
                        Cantidad detectada
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={p.quantity}
                          onChange={(e) => updateProposal(p.id, { quantity: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Unidad
                        <input
                          value={p.unit}
                          onChange={(e) => updateProposal(p.id, { unit: e.target.value })}
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Desperdicio adicional %
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={p.wastePercentage ?? 0}
                          onChange={(e) => updateProposal(p.id, { wastePercentage: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Ajuste de precio %
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={p.priceAdjustmentPercentage ?? 0}
                          onChange={(e) => updateProposal(p.id, { priceAdjustmentPercentage: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-4">
                        Nota manual
                        <input
                          value={p.manualNote ?? ""}
                          onChange={(e) => updateProposal(p.id, { manualNote: e.target.value })}
                          placeholder="Ej.: descontar huecos, aumentar por cortes complejos, confirmar material..."
                          className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium"
                        />
                      </label>
                      <div className="flex flex-wrap gap-4 border-t pt-3 text-sm sm:col-span-2 lg:col-span-4">
                        <span>
                          <b>Cantidad a incorporar:</b>{" "}
                          {(p.quantity * (1 + (p.wastePercentage ?? 0) / 100)).toFixed(2)} {p.unit}
                        </span>
                        {(p.priceAdjustmentPercentage ?? 0) > 0 && (
                          <span className="text-amber-700">
                            <b>Precio APU:</b> +{p.priceAdjustmentPercentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {!analysis.proposals.length && <p className="text-slate-500">No se generaron partidas.</p>}
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="flex items-center gap-2 font-bold text-amber-900">
                <TriangleAlert className="h-5 w-5" />
                Incidencias y límites
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {analysis.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
