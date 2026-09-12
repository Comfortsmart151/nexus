import { ApuService } from "@/services/apu.service";
import { ResourceService } from "@/services/resource.service";
import type { BudgetItem, CostResource } from "@/types/budget";

export type ApuValidationSeverity = "error" | "warning" | "info";
export interface ApuValidationIssue { id:string; severity:ApuValidationSeverity; resourceId?:string; resourceName?:string; message:string; }
export interface ApuValidationResult { itemId:string; score:number; status:"valid"|"review"|"blocked"; issues:ApuValidationIssue[]; }

const incompatibilities: Array<{item:RegExp; resource:RegExp; severity:ApuValidationSeverity; message:string}> = [
  { item:/cer[aá]mica|porcelanato|piso|revestimiento/i, resource:/andamio/i, severity:"error", message:"Recurso de andamio incompatible con una partida de piso/revestimiento. Debe sustituirse o eliminarse antes de cerrar el APU." },
  { item:/pintura/i, resource:/cer[aá]mica|porcelanato|hormig[oó]n|varilla/i, severity:"warning", message:"El recurso parece pertenecer a otra actividad y requiere revisión." },
  { item:/hormig[oó]n|concreto/i, resource:/cer[aá]mica|porcelanato|pintura/i, severity:"warning", message:"El recurso parece incompatible con una partida de hormigón/concreto." },
];

function issue(id:string,severity:ApuValidationSeverity,message:string,r?:CostResource):ApuValidationIssue { return {id,severity,message,resourceId:r?.id,resourceName:r?.name}; }

export class ApuValidationService {
  static validate(item: BudgetItem): ApuValidationResult {
    const resources = ResourceService.findByItem(item.id);
    const calc = ApuService.calculate(item.id);
    const issues:ApuValidationIssue[]=[];
    if (!resources.length) issues.push(issue("no-resources","error","La partida no tiene recursos en su APU."));
    for (const r of resources) {
      if (!Number.isFinite(r.quantity) || r.quantity <= 0) issues.push(issue(`qty-${r.id}`,"error","Cantidad de recurso inválida o igual a cero.",r));
      if (!Number.isFinite(r.unitPrice) || r.unitPrice <= 0) issues.push(issue(`price-${r.id}`,"error","Recurso sin precio válido. El APU no debe considerarse definitivo.",r));
      if (r.priceStatus === "referential") issues.push(issue(`ref-${r.id}`,"info","Precio referencial: debe confirmarse antes de cerrar el presupuesto.",r));
      if (r.wastePercentage > 30) issues.push(issue(`waste-${r.id}`,"warning",`Desperdicio de ${r.wastePercentage}% inusualmente alto.`,r));
      for (const rule of incompatibilities) if (rule.item.test(item.name) && rule.resource.test(r.name)) issues.push(issue(`semantic-${r.id}-${rule.resource.source}`,rule.severity,rule.message,r));
    }
    if (calc && calc.analysisVolume <= 0) issues.push(issue("volume","error","Volumen de análisis inválido."));
    const errors=issues.filter(x=>x.severity==="error").length;
    const warnings=issues.filter(x=>x.severity==="warning").length;
    const score=Math.max(0,100-errors*30-warnings*12);
    return {itemId:item.id,score,status:errors?"blocked":warnings?"review":"valid",issues};
  }
}
