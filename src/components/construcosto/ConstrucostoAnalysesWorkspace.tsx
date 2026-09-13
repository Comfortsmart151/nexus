"use client";

import { Fragment, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Database, Search } from "lucide-react";
import { PRICE_REGIONS, RegionalPricingService } from "@/services/regionalPricing.service";
import type { ProjectPriceRegion } from "@/types/construcosto";

function money(value: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 }).format(value);
}

function qty(value: number) {
  return new Intl.NumberFormat("es-DO", { maximumFractionDigits: 8 }).format(value);
}

export default function ConstrucostoAnalysesWorkspace() {
  const [region, setRegion] = useState<ProjectPriceRegion>("santiago-cibao");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rows = useMemo(() => RegionalPricingService.getCostAnalyses(region, search), [region, search]);
  const stats = RegionalPricingService.getStats();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><Database className="h-4 w-4" /> Construcosto · agosto 2026</div>
            <h1 className="mt-2 text-3xl font-bold">Banco de análisis de costos</h1>
            <p className="mt-2 max-w-4xl text-slate-500">
              {stats.detailedAnalyses.toLocaleString("es-DO")} APU con desglose interno para Santo Domingo, Santiago–Cibao y Punta Cana. El banco detallado contiene {stats.detailedResourceLines.toLocaleString("es-DO")} líneas de recursos normalizadas por unidad de partida.
            </p>
          </div>
          <label className="text-sm font-semibold text-slate-700">Región de precios
            <select value={region} onChange={(event) => { setRegion(event.target.value as ProjectPriceRegion); setExpandedId(null); }} className="mt-2 block min-w-56 rounded-xl border border-slate-200 bg-white px-4 py-3">
              {PRICE_REGIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">APU detallados</div><div className="mt-1 text-2xl font-bold">{stats.detailedAnalyses.toLocaleString("es-DO")}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Líneas vinculadas a biblioteca</div><div className="mt-1 text-2xl font-bold">{stats.mappedDetailedLines.toLocaleString("es-DO")}</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Líneas conservadas desde fuente</div><div className="mt-1 text-2xl font-bold">{stats.unmappedDetailedLines.toLocaleString("es-DO")}</div></div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código, grupo o partida..." className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-blue-400" />
            </div>
            <p className="mt-3 text-xs text-slate-500">{rows.length.toLocaleString("es-DO")} resultados · Pulsa “Ver APU” para revisar volumen base, recursos, coeficientes normalizados y precios de la región seleccionada.</p>
          </div>
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-4">Código</th><th className="px-5 py-4">Grupo</th><th className="px-5 py-4">Análisis</th><th className="px-5 py-4">Unidad</th><th className="px-5 py-4 text-right">Precio regional</th><th className="px-5 py-4 text-right">Detalle</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const open = expandedId === row.id;
                  const detail = open ? RegionalPricingService.getDetailedApu(row.code, row.name, region) : null;
                  return (
                    <Fragment key={row.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-blue-700">{row.code}</td>
                        <td className="px-5 py-4 text-slate-500">{row.group}</td>
                        <td className="px-5 py-4 font-medium">{row.name}</td>
                        <td className="px-5 py-4">{row.unit}</td>
                        <td className="px-5 py-4 text-right font-bold">{money(row.regionalPrice)}</td>
                        <td className="px-5 py-4 text-right">
                          {row.hasDetailedApu ? (
                            <button onClick={() => setExpandedId(open ? null : row.id)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} Ver APU
                            </button>
                          ) : <span className="text-xs text-slate-400">Sin detalle</span>}
                        </td>
                      </tr>
                      {open && detail && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50 px-5 py-5">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> APU Construcosto desglosado</div>
                                  <div className="mt-2 font-semibold">{detail.subtitle || detail.name}</div>
                                  <div className="mt-1 text-xs text-slate-500">Volumen fuente: {qty(detail.baseQuantity)} {detail.baseUnit}{detail.yield ? ` · Rendimiento: ${qty(detail.yield)} ${detail.yieldUnit ?? ""}` : ""} · {detail.period}</div>
                                </div>
                                <div className="text-right"><div className="text-xs uppercase text-slate-400">Costo unitario publicado</div><div className="text-xl font-bold">{money(detail.listedUnitPrice)}</div></div>
                              </div>
                              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                                <table className="w-full min-w-[900px] text-xs">
                                  <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-3 text-left">Tipo</th><th className="px-3 py-3 text-left">Recurso</th><th className="px-3 py-3 text-right">Cant. fuente</th><th className="px-3 py-3 text-left">Und</th><th className="px-3 py-3 text-right">Coef./unidad</th><th className="px-3 py-3 text-right">P. unitario</th><th className="px-3 py-3 text-right">Subtotal/unidad</th><th className="px-3 py-3 text-left">Biblioteca</th></tr></thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {detail.resources.map((resource, index) => (
                                      <tr key={`${resource.name}-${index}`}>
                                        <td className="px-3 py-3 capitalize text-slate-500">{resource.type}</td>
                                        <td className="px-3 py-3 font-medium">{resource.name}</td>
                                        <td className="px-3 py-3 text-right">{qty(resource.sourceQuantity)}</td>
                                        <td className="px-3 py-3">{resource.unit}</td>
                                        <td className="px-3 py-3 text-right font-mono">{qty(resource.normalizedQuantity)}</td>
                                        <td className="px-3 py-3 text-right">{money(resource.unitPrice)}</td>
                                        <td className="px-3 py-3 text-right font-semibold">{money(resource.normalizedQuantity * resource.unitPrice)}</td>
                                        <td className="px-3 py-3 text-slate-500">{resource.libraryResourceCode ?? "Fuente Construcosto"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
