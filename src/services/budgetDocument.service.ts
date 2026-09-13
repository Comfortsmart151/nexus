import { LocalStorageRepository } from "@/repositories/localStorage.repository";
import { RevisionService } from "@/services/revision.service";
import { SettingsService } from "@/services/settings.service";
import type { BudgetDocumentEmission, BudgetDocumentStatus } from "@/types/budgetDocument";
const KEY="nexus-budget-documents";
export class BudgetDocumentService {
 static findByProject(projectId:string){return (LocalStorageRepository.get<BudgetDocumentEmission[]>(KEY)??[]).filter(x=>x.projectId===projectId).sort((a,b)=>b.issuedAt.localeCompare(a.issuedAt));}
 static issue(projectId:string,total:number,notes?:string):BudgetDocumentEmission|null{const revisions=RevisionService.findByProject(projectId);const revision=revisions[0]??RevisionService.create(projectId,"Emisión comercial");if(!revision)return null;const c=SettingsService.get();const issued=new Date();const valid=new Date(issued);valid.setDate(valid.getDate()+c.defaultValidityDays);const x:BudgetDocumentEmission={id:`DOC-${projectId}-${Date.now()}`,projectId,revisionId:revision.id,revisionNumber:revision.number,documentCode:revision.documentCode,status:"issued",issuedAt:issued.toISOString(),validityDays:c.defaultValidityDays,validUntil:valid.toISOString(),total,notes:notes??c.defaultNotes,companySnapshot:{commercialName:c.commercialName,legalName:c.legalName,taxId:c.taxId,phone:c.phone,email:c.email,address:c.address,responsibleName:c.responsibleName,responsibleTitle:c.responsibleTitle,logoDataUrl:c.logoDataUrl}};LocalStorageRepository.save(KEY,[x,...(LocalStorageRepository.get<BudgetDocumentEmission[]>(KEY)??[])]);return x;}
 static updateStatus(id:string,status:BudgetDocumentStatus){const all=LocalStorageRepository.get<BudgetDocumentEmission[]>(KEY)??[];const next=all.map(x=>x.id===id?{...x,status}:x);LocalStorageRepository.save(KEY,next);return next.find(x=>x.id===id)??null;}
}
