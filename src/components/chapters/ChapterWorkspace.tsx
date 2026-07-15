"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import NexusLogo from "@/components/ui/NexusLogo";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";
import type { BudgetChapter } from "@/types/budget";
import type { Project } from "@/types/project";

interface ChapterWorkspaceProps {
  projectId: string;
}

export default function ChapterWorkspace({
  projectId,
}: ChapterWorkspaceProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<BudgetChapter[]>([]);
  const [chapterName, setChapterName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [startingFromZero, setStartingFromZero] = useState(false);

  function loadChapters() {
    setChapters(ChapterService.findByProject(projectId));
  }

  useEffect(() => {
    const selectedProject = ProjectService.findById(projectId);

    setProject(selectedProject);
    setChapters(ChapterService.findByProject(projectId));
    setLoaded(true);
  }, [projectId]);

  function createChapter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = chapterName.trim();

    if (!cleanName) return;

    ChapterService.create({
      projectId,
      name: cleanName,
    });

    setChapterName("");
    loadChapters();
  }

  function useSuggestedTemplate() {
    if (!project) return;

    ChapterService.createFromTemplate(project);
    setStartingFromZero(false);
    loadChapters();
  }

  function startFromZero() {
    setStartingFromZero(true);
  }

  function deleteChapter(chapterId: string) {
    const confirmed = window.confirm(
      "¿Deseas eliminar este capítulo?",
    );

    if (!confirmed) return;

    ChapterService.delete(chapterId);
    loadChapters();
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Cargando capítulos...</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">
            Proyecto no encontrado
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

  const showTemplateSuggestion =
    chapters.length === 0 && !startingFromZero;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <NexusLogo size="sm" />

          <Link
            href={`/projects/${project.id}`}
            className="mt-10 flex items-center gap-2 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al proyecto
          </Link>

          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Proyecto actual
            </p>

            <p className="mt-2 font-semibold">{project.name}</p>

            <p className="mt-1 text-sm text-slate-400">
              {project.code}
            </p>
          </div>

          <div className="mt-auto text-sm text-slate-500">
            Powered by Ingeniería González
          </div>
        </aside>

        <section className="flex-1 p-6 lg:p-10">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al proyecto
          </Link>

          <header className="mt-5">
            <p className="text-sm font-semibold text-blue-600">
              Estructura del presupuesto
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Capítulos
            </h1>

            <p className="mt-3 max-w-2xl text-slate-500">
              Organiza las áreas principales que compondrán el
              presupuesto de {project.name}.
            </p>
          </header>

          {showTemplateSuggestion ? (
            <section className="mt-8 overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-sky-500 p-8 text-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles className="h-7 w-7" />
                </div>

                <h2 className="mt-6 text-2xl font-bold">
                  NEXUS preparó una estructura para ti
                </h2>

                <p className="mt-3 max-w-2xl text-blue-50">
                  Detectamos que este proyecto es de tipo{" "}
                  <strong>{project.projectType}</strong>. Puedes
                  comenzar con una estructura sugerida o crear tus
                  capítulos desde cero.
                </p>
              </div>

              <div className="flex flex-col gap-4 p-8 sm:flex-row">
                <button
                  type="button"
                  onClick={useSuggestedTemplate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
                >
                  <Sparkles className="h-5 w-5" />
                  Usar plantilla sugerida
                </button>

                <button
                  type="button"
                  onClick={startFromZero}
                  className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                >
                  Comenzar desde cero
                </button>
              </div>
            </section>
          ) : (
            <>
              <form
                onSubmit={createChapter}
                className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row"
              >
                <input
                  value={chapterName}
                  onChange={(event) =>
                    setChapterName(event.target.value)
                  }
                  placeholder="Nombre del nuevo capítulo..."
                  className="nexus-input flex-1"
                />

                <button
                  type="submit"
                  disabled={!chapterName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-5 w-5" />
                  Agregar capítulo
                </button>
              </form>

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      Capítulos del presupuesto
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {chapters.length}{" "}
                      {chapters.length === 1
                        ? "capítulo creado"
                        : "capítulos creados"}
                    </p>
                  </div>

                  {chapters.length > 0 && (
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                      <Check className="h-4 w-4" />
                      Guardado automáticamente
                    </span>
                  )}
                </div>

                {chapters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <BookOpen className="h-8 w-8" />
                    </div>

                    <h3 className="mt-5 text-xl font-semibold">
                      Aún no hay capítulos
                    </h3>

                    <p className="mt-2 max-w-md text-slate-500">
                      Escribe el nombre del primer capítulo para
                      comenzar a organizar el presupuesto.
                    </p>
                  </div>
                ) : (
                  <div className="mt-7 space-y-3">
                    {chapters.map((chapter, index) => {
                      const itemCount = ItemService.countByChapter(
                        chapter.id,
                      );

                      return (
                        <article
                          key={chapter.id}
                          className="group flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                              {String(index + 1).padStart(2, "0")}
                            </div>

                            <div>
                              <h3 className="font-semibold">
                                {chapter.name}
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                {itemCount}{" "}
                                {itemCount === 1
                                  ? "partida"
                                  : "partidas"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              deleteChapter(chapter.id)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}