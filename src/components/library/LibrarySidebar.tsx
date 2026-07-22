"use client";

import Link from "next/link";

import {
  ArrowLeft,
  Library,
  Star,
} from "lucide-react";

import NexusLogo from "@/components/ui/NexusLogo";

interface LibrarySidebarProps {
  totalFavorites: number;
  favoritesSelected: boolean;
  onSelectFavorites: () => void;
}

export default function LibrarySidebar({
  totalFavorites,
  favoritesSelected,
  onSelectFavorites,
}: LibrarySidebarProps) {
  return (
    <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
      <NexusLogo size="sm" />

      <Link
        href="/dashboard"
        className="mt-10 flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
      >
        <ArrowLeft className="h-5 w-5" />
        Volver al Dashboard
      </Link>

      <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
          <Library className="h-5 w-5" />
        </div>

        <p className="mt-5 text-xs uppercase tracking-wider text-slate-400">
          Biblioteca inteligente
        </p>

        <p className="mt-2 font-semibold">
          Recursos de costos
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Precios, categorías e historial reutilizable en todos los
          presupuestos.
        </p>
      </div>

      <button
        type="button"
        onClick={onSelectFavorites}
        className={`mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
          favoritesSelected
            ? "bg-amber-50 text-amber-700"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Favoritos
        </span>

        <span>{totalFavorites}</span>
      </button>

      <div className="mt-auto text-sm text-slate-500">
        Powered by Ingeniería González
      </div>
    </aside>
  );
}