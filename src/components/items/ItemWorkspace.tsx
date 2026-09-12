"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import CreateItemForm from "@/components/items/CreateItemForm";
import ItemHeader from "@/components/items/ItemHeader";
import ItemsTable from "@/components/items/ItemsTable";
import NexusLogo from "@/components/ui/NexusLogo";
import { ChapterService } from "@/services/chapter.service";
import { ItemService } from "@/services/item.service";
import { ProjectService } from "@/services/project.service";
import type {
  BudgetChapter,
  BudgetItem,
} from "@/types/budget";
import type { Project } from "@/types/project";

interface ItemWorkspaceProps {
  projectId: string;
  chapterId: string;
}

interface CreateItemValues {
  name: string;
  unit: string;
  quantity: number;
}

export default function ItemWorkspace({
  projectId,
  chapterId,
}: ItemWorkspaceProps) {
  const [project, setProject] =
    useState<Project | null>(null);

  const [chapter, setChapter] =
    useState<BudgetChapter | null>(null);

  const [items, setItems] =
    useState<BudgetItem[]>([]);

  const [loaded, setLoaded] = useState(false);

  function loadItems() {
    setItems(
      ItemService.findByChapter(chapterId),
    );
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setProject(
      ProjectService.findById(projectId),
    );

    setChapter(
      ChapterService.findById(chapterId),
    );

    setItems(
      ItemService.findByChapter(chapterId),
    );

    setLoaded(true);
  }, [projectId, chapterId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function createItem(
    values: CreateItemValues,
  ) {
    if (!chapter) {
      return;
    }

    const itemNumber = items.length + 1;

    const chapterCode = String(
      chapter.order,
    ).padStart(2, "0");

    const itemCode = String(
      itemNumber,
    ).padStart(2, "0");

    ItemService.create({
      projectId,
      chapterId,
      code: `${chapterCode}.${itemCode}`,
      name: values.name,
      unit: values.unit,
      quantity: values.quantity,
    });

    loadItems();
  }

  function deleteItem(itemId: string) {
    const confirmed = window.confirm(
      "¿Deseas eliminar esta partida y todos los recursos de su APU?",
    );

    if (!confirmed) {
      return;
    }

    ItemService.delete(itemId);
    loadItems();
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">
          Cargando partidas...
        </p>
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

  const chaptersHref =
    `/projects/${project.id}/chapters`;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">

        <section className="min-w-0 flex-1 p-6 lg:p-10">
          <Link
            href={chaptersHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a capítulos
          </Link>

          <ItemHeader
            chapterOrder={chapter.order}
            chapterName={chapter.name}
          />

          <CreateItemForm
            onCreate={createItem}
          />

          <ItemsTable
            projectId={project.id}
            chapterId={chapter.id}
            items={items}
            onDelete={deleteItem}
          />
        </section>
      </div>
    </main>
  );
}