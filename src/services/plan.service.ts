import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import { FileBlobService } from "@/services/fileBlob.service";
import type { ProjectDocument } from "@/types/document";

const KEY = "nexus-project-plans";

export class PlanService {
  static findByProject(projectId: string): ProjectDocument[] {
    return (LocalStorageRepository.get<ProjectDocument[]>(KEY) ?? []).filter((x) => x.projectId === projectId);
  }

  static async create(projectId: string, name: string, description: string, file: File): Promise<ProjectDocument> {
    const all = LocalStorageRepository.get<ProjectDocument[]>(KEY) ?? [];
    const now = new Date().toISOString();
    const item: ProjectDocument = {
      id: `PLN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId,
      name: name.trim() || file.name.replace(/\.[^.]+$/, ""),
      description: description.trim(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      createdAt: now,
    };
    await FileBlobService.save(item.id, file);
    LocalStorageRepository.save(KEY, [item, ...all]);
    return item;
  }

  static async open(id: string): Promise<boolean> {
    const blob = await FileBlobService.get(id);
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  }

  static async delete(id: string): Promise<void> {
    const all = LocalStorageRepository.get<ProjectDocument[]>(KEY) ?? [];
    LocalStorageRepository.save(KEY, all.filter((x) => x.id !== id));
    await FileBlobService.remove(id);
  }
}
