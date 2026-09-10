"use client";

import { CheckCircle2, Filter, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { LibraryNormalizationProposal, NormalizationConfidence, NormalizationKind } from "@/services/libraryNormalization.service";

type KindFilter = "all" | NormalizationKind;
type ConfidenceFilter = "all" | NormalizationConfidence;

interface Props {
  proposals: LibraryNormalizationProposal[];
  onApply: (selected: LibraryNormalizationProposal[]) => void;
  onClose: () => void;
}

const kindLabel: Record<NormalizationKind, string> = { source: "Fuente", waste: "Desperdicio", classification: "Clasificación" };
const confidenceLabel: Record<NormalizationConfidence, string> = { high: "Alta", medium: "Media" };

function changePreview(p: LibraryNormalizationProposal) {
  if (p.kind === "source") return { before: "Clasificación: Banco APU", after: `Fuente: ${p.changes.source ?? "Banco APU"}` };
  if (p.kind === "waste") return { before: p.resourceName, after: `${p.changes.name ?? p.resourceName} · Desperdicio sugerido: ${p.changes.suggestedWastePercent ?? 0}%` };
  return { before: p.summary.split("→")[0]?.trim() || "Clasificación actual", after: p.summary.split("→")[1]?.trim() || String(p.changes.category ?? "") };
}

export default function LibraryNormalizationPanel({ proposals, onApply, onClose }: Props) {
  // Seguridad v0.4.2: ninguna propuesta viene seleccionada por defecto.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");

  const visible = useMemo(() => proposals.filter((p) =>
    (kindFilter === "all" || p.kind === kindFilter) &&
    (confidenceFilter === "all" || p.confidence === confidenceFilter)
  ), [proposals, kindFilter, confidenceFilter]);

  const selectedProposals = useMemo(() => proposals.filter((p) => selected.has(p.id)), [proposals, selected]);
  const affectedResources = useMemo(() => new Set(selectedProposals.map((p) => p.resourceId)).size, [selectedProposals]);
  const counts = useMemo(() => ({
    source: proposals.filter((p) => p.kind === "source").length,
    waste: proposals.filter((p) => p.kind === "waste").length,
    classification: proposals.filter((p) => p.kind === "classification").length,
  }), [proposals]);

  function toggle(id: string) {
    setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function selectVisible() { setSelected((current) => new Set([...current, ...visible.map((p) => p.id)])); }
  function selectHighConfidence() { setSelected(new Set(proposals.filter((p) => p.confidence === "high").map((p) => p.id))); }
  function clearSelection() { setSelected(new Set()); }

  return (
    <div className="border-b border-blue-100 bg-blue-50/60 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700"><Sparkles className="h-5 w-5" /><h3 className="font-bold">Propuestas de normalización</h3></div>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Nada viene seleccionado por defecto. Revisa, filtra y aprueba explícitamente cada lote. Se preservan precios, historial y códigos.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white px-3 py-1.5 text-slate-600">Fuente {counts.source}</span>
            <span className="rounded-full bg-white px-3 py-1.5 text-slate-600">Desperdicio {counts.waste}</span>
            <span className="rounded-full bg-white px-3 py-1.5 text-slate-600">Clasificación {counts.classification}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={selectHighConfidence} className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-blue-700">Seleccionar alta confianza</button>
          <button type="button" onClick={clearSelection} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600">Deseleccionar todo</button>
          <button type="button" onClick={() => onApply(selectedProposals)} disabled={selectedProposals.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 className="h-4 w-4" />Aplicar seleccionados ({selectedProposals.length})</button>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100 bg-white p-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as KindFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">Todos los tipos</option><option value="source">Fuente</option><option value="waste">Desperdicio</option><option value="classification">Clasificación</option>
        </select>
        <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceFilter)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">Toda confianza</option><option value="high">Alta confianza</option><option value="medium">Media confianza</option>
        </select>
        <button type="button" onClick={selectVisible} disabled={visible.length === 0} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40">Seleccionar visibles ({visible.length})</button>
        <span className="ml-auto text-xs font-semibold text-slate-500">Seleccionadas: {selectedProposals.length} propuestas · {affectedResources} recursos</span>
      </div>

      <div className="mt-4 max-h-96 overflow-auto rounded-2xl border border-blue-100 bg-white">
        {visible.length === 0 ? <p className="p-6 text-sm text-slate-500">No hay propuestas con estos filtros.</p> : visible.map((proposal) => {
          const preview = changePreview(proposal);
          return <label key={proposal.id} className="flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50">
            <input type="checkbox" checked={selected.has(proposal.id)} onChange={() => toggle(proposal.id)} className="mt-1 h-4 w-4" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">{proposal.resourceCode} — {proposal.resourceName}</span><span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{kindLabel[proposal.kind]}</span><span className={proposal.confidence === "high" ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700" : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700"}>{confidenceLabel[proposal.confidence]} confianza</span></div>
              <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center"><div className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="mr-2 text-xs font-bold text-slate-400">ANTES</span>{preview.before}</div><span className="hidden text-slate-400 md:block">→</span><div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><span className="mr-2 text-xs font-bold text-emerald-600">DESPUÉS</span>{preview.after}</div></div>
            </div>
          </label>;
        })}
      </div>
    </div>
  );
}
