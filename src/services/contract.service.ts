import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import { FileBlobService } from "@/services/fileBlob.service";
import type { Contract, ContractStatus } from "@/types/document";

const KEY = "nexus-contracts";
export interface CreateContractInput { projectId:string; title:string; contractor:string; client:string; amount:number; startDate:string; endDate:string; status:ContractStatus; notes:string; file?:File | null; }

export class ContractService {
  static findByProject(projectId: string): Contract[] {
    return (LocalStorageRepository.get<Contract[]>(KEY) ?? []).filter((x) => x.projectId === projectId);
  }
  static async create(input: CreateContractInput): Promise<Contract> {
    const all = LocalStorageRepository.get<Contract[]>(KEY) ?? [];
    const now = new Date().toISOString();
    const id = `CTR-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const item: Contract = { id, projectId:input.projectId, title:input.title.trim(), contractor:input.contractor.trim(), client:input.client.trim(), amount:input.amount || 0, startDate:input.startDate, endDate:input.endDate, status:input.status, notes:input.notes.trim(), attachmentName:input.file?.name, attachmentType:input.file?.type, attachmentSize:input.file?.size, createdAt:now, updatedAt:now };
    if (input.file) await FileBlobService.save(id, input.file);
    LocalStorageRepository.save(KEY, [item, ...all]);
    return item;
  }
  static async openAttachment(id:string): Promise<boolean> {
    const blob = await FileBlobService.get(id); if (!blob) return false;
    const url = URL.createObjectURL(blob); window.open(url,"_blank","noopener,noreferrer"); window.setTimeout(()=>URL.revokeObjectURL(url),60_000); return true;
  }
  static async delete(id:string): Promise<void> {
    const all = LocalStorageRepository.get<Contract[]>(KEY) ?? []; LocalStorageRepository.save(KEY, all.filter(x=>x.id!==id)); await FileBlobService.remove(id);
  }
}
