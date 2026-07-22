"use client";

import { Search, Star } from "lucide-react";

import type { ResourceType } from "@/types/budget";

type LibraryFilter = "all" | "favorites" | ResourceType;

interface LibraryFiltersProps {
  activeFilter: LibraryFilter;
  categoryFilter: string;
  searchTerm: string;
  availableCategories: string[];
  visibleCount: number;
  onSelectAll: () => void;
  onSelectFavorites: () => void;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export default function LibraryFilters({
  activeFilter,
  categoryFilter,
  searchTerm,
  availableCategories,
  visibleCount,
  onSelectAll,
  onSelectFavorites,
  onCategoryChange,
  onSearchChange,
}: LibraryFiltersProps) {
  return (
    <div className="border-b border-slate-200 p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Recursos registrados
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {visibleCount}{" "}
            {visibleCount === 1
              ? "recurso visible"
              : "recursos visibles"}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <button
            type="button"
            onClick={onSelectAll}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              activeFilter === "all"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            Ver todos
          </button>

          <button
            type="button"
            onClick={onSelectFavorites}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              activeFilter === "favorites"
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-slate-200 text-slate-600 hover:border-amber-300"
            }`}
          >
            <Star className="h-4 w-4" />
            Favoritos
          </button>

          <select
            value={categoryFilter}
            onChange={(event) =>
              onCategoryChange(event.target.value)
            }
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">Todas las categorías</option>

            {availableCategories.map((currentCategory) => (
              <option
                key={currentCategory}
                value={currentCategory}
              >
                {currentCategory}
              </option>
            ))}
          </select>

          <div className="relative min-w-0 lg:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={searchTerm}
              onChange={(event) =>
                onSearchChange(event.target.value)
              }
              placeholder="Buscar recurso, marca o etiqueta..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}