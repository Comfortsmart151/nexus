"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import NexusLogo from "@/components/ui/NexusLogo";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";
import type { BudgetChapter, BudgetItem } from "@/types/budget";
import type { Project } from "@/types/project";

interface ItemWorkspaceProps {
  projectId: string;
  chapterId: string;
}

const units = [
  "ud",
  "m",
  "m²",
  "m³",
  "kg",
  "lb",
  "ton",
  "gal",
  "día",
  "hora",
  "global",
];

export default function ItemWorkspace({
  projectId,
  chapterId,
}: ItemWorkspaceProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [chapter, setChapter] = useState<BudgetChapter | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("ud");
  const [quantity, setQuantity] = useState("1");
  const [loaded, setLoaded] = useState(false);

  function loadItems() {
    setItems(ItemService.findByChapter(chapterId));
  }

  useEffect(() => {
    setProject(ProjectService.findById(projectId));
    setChapter(ChapterService.findById(chapterId));
    setItems(ItemService.findByChapter(chapterId));
    setLoaded(true);
  }, [projectId, chapterId]);

  function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chapter || !name.trim() || !unit.trim()) return;

    const parsedQuantity = Number(quantity);
    const itemNumber = items.length + 1;

    const code = `${String(chapter.order).padStart(2, "0")}.${String(
      itemNumber,
    ).padStart(2, "0")}`;

    ItemService.create({
      projectId,
      chapterId,
      code,
      name,
      unit,
      quantity:
        Number.isFinite(parsedQuantity) && parsedQuantity >= 0
          ? parsedQuantity
          : 0,
    });

    setName("");
    setUnit("ud");
    setQuantity("1");
    loadItems();
  }

  function deleteItem(itemId: string) {
    const confirmed = window.confirm(
      "¿Deseas eliminar esta partida?",
    );

    if (!confirmed) return;

    ItemService.delete(itemId);
    loadItems();
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Cargando partidas...</p>
      </main>
    );
  }

  if (!project || !chapter) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">
            Proyecto o capítulo no encontrado
          </h1>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <NexusLogo size="sm" />

          <Link
            href={`/projects/${project.id}/chapters`}
            className="mt-10 flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a capítulos
          </Link>

          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Proyecto actual
            </p>

            <p className="mt-2 font-semibold">{project.name}</p>

            <p className="mt-1 text-sm text-slate-400">
              {project.code}
            </p>

            <div className="my-4 h-px bg-slate-800" />

            <p className="text-xs uppercase tracking-wider text-slate-400">
              Capítulo
            </p>

            <p className="mt-2 text-sm font-medium">
              {chapter.name}
            </p>
          </div>

          <div className="mt-auto text-sm text-slate-500">
            Powered by Ingeniería González
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-10">
          <Link
            href={`/projects/${project.id}/chapters`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a capítulos
          </Link>

          <header className="mt-5">
            <p className="text-sm font-semibold text-blue-600">
              Capítulo {String(chapter.order).padStart(2, "0")}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {chapter.name}
            </h1>

            <p className="mt-3 max-w-2xl text-slate-500">
              Agrega las partidas, unidades y cantidades que forman este
              capítulo.
            </p>
          </header>

          <form
            onSubmit={createItem}
            className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_140px_160px_auto]"
          >
            <div>
              <label className="text-sm font-medium text-slate-700">
                Descripción de la partida
              </label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Excavación manual en terreno natural"
                className="nexus-input mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Unidad
              </label>

              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="nexus-input mt-2"
              >
                {units.map((currentUnit) => (
                  <option key={currentUnit} value={currentUnit}>
                    {currentUnit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Cantidad
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="nexus-input mt-2"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="mt-auto inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
              Agregar
            </button>
          </form>

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Partidas del capítulo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {items.length}{" "}
                  {items.length === 1
                    ? "partida registrada"
                    : "partidas registradas"}
                </p>
              </div>

              {items.length > 0 && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Guardado automáticamente
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ClipboardList className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  Aún no hay partidas
                </h3>

                <p className="mt-2 max-w-md text-slate-500">
                  Agrega la primera partida de este capítulo para
                  comenzar a construir el presupuesto.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Código</th>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4 text-right">
                        Cantidad
                      </th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const analysisHref =
                        `/projects/${project.id}` +
                        `/chapters/${chapter.id}` +
                        `/items/${item.id}`;

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5 font-semibold text-blue-700">
                            {item.code ?? item.id}
                          </td>

                          <td className="px-6 py-5">
                            <p className="font-medium text-slate-900">
                              {item.name}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-slate-600">
                            {item.unit}
                          </td>

                          <td className="px-6 py-5 text-right font-medium">
                            {item.quantity.toLocaleString("es-DO", {
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td className="px-6 py-5">
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                              <Calculator className="h-3.5 w-3.5" />
                              Sin analizar
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={analysisHref}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                              >
                                Abrir APU
                                <ArrowRight className="h-4 w-4" />
                              </Link>

                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}