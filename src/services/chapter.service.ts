import { getTemplate } from "@/core/chapters/defaultTemplates";
import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import type { BudgetChapter } from "@/types/budget";
import type { Project } from "@/types/project";
import { generateChapterId } from "@/utils/idGenerator";

const CHAPTERS_KEY = "nexus-chapters";
const CHAPTER_COUNTER_KEY = "nexus-chapter-counter";

export interface CreateChapterInput {
  projectId: string;
  name: string;
  description?: string;
}

export interface UpdateChapterInput {
  name?: string;
  description?: string;
  order?: number;
}

export class ChapterService {
  static findAll(): BudgetChapter[] {
    return LocalStorageRepository.get<BudgetChapter[]>(CHAPTERS_KEY) ?? [];
  }

  static findByProject(projectId: string): BudgetChapter[] {
    return ChapterService.findAll()
      .filter((chapter) => chapter.budgetId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  static findById(chapterId: string): BudgetChapter | null {
    return (
      ChapterService.findAll().find(
        (chapter) => chapter.id === chapterId,
      ) ?? null
    );
  }

  static create(input: CreateChapterInput): BudgetChapter {
    const chapters = ChapterService.findAll();
    const projectChapters = ChapterService.findByProject(input.projectId);

    const currentCounter =
      LocalStorageRepository.get<number>(CHAPTER_COUNTER_KEY) ?? 0;

    const nextCounter = currentCounter + 1;
    const now = new Date().toISOString();

    const chapter: BudgetChapter = {
      id: generateChapterId(nextCounter),
      budgetId: input.projectId,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      order: projectChapters.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    LocalStorageRepository.save(CHAPTERS_KEY, [...chapters, chapter]);
    LocalStorageRepository.save(CHAPTER_COUNTER_KEY, nextCounter);

    return chapter;
  }

  static createFromTemplate(project: Project): BudgetChapter[] {
    const existingChapters = ChapterService.findByProject(project.id);

    if (existingChapters.length > 0) {
      return existingChapters;
    }

    const template = getTemplate(project.projectType);

    return template.map((chapter) =>
      ChapterService.create({
        projectId: project.id,
        name: chapter.name,
      }),
    );
  }

  static update(
    chapterId: string,
    input: UpdateChapterInput,
  ): BudgetChapter | null {
    const chapters = ChapterService.findAll();

    const chapterIndex = chapters.findIndex(
      (chapter) => chapter.id === chapterId,
    );

    if (chapterIndex === -1) return null;

    const currentChapter = chapters[chapterIndex];

    const updatedChapter: BudgetChapter = {
      ...currentChapter,
      name: input.name?.trim() ?? currentChapter.name,
      description:
        input.description?.trim() ?? currentChapter.description,
      order: input.order ?? currentChapter.order,
      updatedAt: new Date().toISOString(),
    };

    chapters[chapterIndex] = updatedChapter;

    LocalStorageRepository.save(CHAPTERS_KEY, chapters);

    return updatedChapter;
  }

  static delete(chapterId: string): boolean {
    const chapters = ChapterService.findAll();
    const chapter = chapters.find((item) => item.id === chapterId);

    if (!chapter) return false;

    const otherProjectChapters = chapters.filter(
      (item) => item.budgetId !== chapter.budgetId,
    );

    const remainingProjectChapters = chapters
      .filter(
        (item) =>
          item.budgetId === chapter.budgetId &&
          item.id !== chapterId,
      )
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        ...item,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));

    LocalStorageRepository.save(CHAPTERS_KEY, [
      ...otherProjectChapters,
      ...remainingProjectChapters,
    ]);

    return true;
  }
}