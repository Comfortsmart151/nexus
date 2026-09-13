export type BudgetDocumentStatus = "draft" | "review" | "issued" | "approved";
export interface BudgetDocumentEmission {
  id:string; projectId:string; revisionId:string; revisionNumber:number; documentCode:string;
  status:BudgetDocumentStatus; issuedAt:string; validityDays:number; validUntil:string;
  total:number; notes:string; companySnapshot:{commercialName:string;legalName:string;taxId:string;phone:string;email:string;address:string;responsibleName:string;responsibleTitle:string;logoDataUrl?:string};
}
