"use client";

import {
  Download,
  FileDown,
  FileSpreadsheet,
  Plus,
} from "lucide-react";

import { LibraryExportService } from "@/services/libraryExport.service";
import { LibraryTemplateService } from "@/services/libraryTemplate.service";

interface LibraryHeaderProps {
  onCreateResource: () => void;
  onImportResources: () => void;
}

export default function LibraryHeader({
  onCreateResource,
  onImportResources,
}: LibraryHeaderProps) {
  function handleDownloadTemplate() {
    LibraryTemplateService.downloadTemplate();
  }

  function handleExportLibrary() {
    try {
      LibraryExportService.exportAll();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible exportar la biblioteca.";

      window.alert(message);
    }
  }

  return (
    <header className="mt-6 flex flex-col gap-5 lg:mt-0 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
          Biblioteca de costos
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
          Recursos
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 lg:text-base">
          Administra materiales, mano de obra, equipos y
          subcontratos reutilizables en los presupuestos de
          NEXUS.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <Download className="h-5 w-5" />
          Descargar plantilla
        </button>

        <button
          type="button"
          onClick={onImportResources}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
        >
          <FileSpreadsheet className="h-5 w-5" />
          Importar Excel
        </button>

        <button
          type="button"
          onClick={handleExportLibrary}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
        >
          <FileDown className="h-5 w-5" />
          Exportar biblioteca
        </button>

        <button
          type="button"
          onClick={onCreateResource}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          <Plus className="h-5 w-5" />
          Nuevo recurso
        </button>
      </div>
    </header>
  );
}