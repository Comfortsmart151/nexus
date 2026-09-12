import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { ApuValidationService } from "@/services/apuValidation.service";
import type { BudgetItem } from "@/types/budget";

export default function ApuValidationPanel({projectId,items}:{projectId:string;items:BudgetItem[]}){
 const results=items.map(item=>({item,result:ApuValidationService.validate(item)}));
 const blocked=results.filter(x=>x.result.status==="blocked"); const review=results.filter(x=>x.result.status==="review"); const valid=results.filter(x=>x.result.status==="valid");
 return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-600"/><h2 className="text-lg font-bold">Validación técnica de APU</h2></div><p className="mt-1 text-sm text-slate-500">Control semántico, precios faltantes, cantidades y desperdicios antes de cerrar el presupuesto.</p></div><div className="flex flex-wrap gap-2"><Badge text={`${valid.length} válidos`} kind="ok"/><Badge text={`${review.length} revisar`} kind="warn"/><Badge text={`${blocked.length} bloqueados`} kind="bad"/></div></div>
  {(blocked.length||review.length)?<div className="mt-5 space-y-3">{results.filter(x=>x.result.status!=="valid").map(({item,result})=>{
   const href=`/projects/${projectId}/chapters/${item.chapterId}/items/${item.id}`;
   return <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="font-semibold">{item.code?`${item.code} · `:""}{item.name}</div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${result.status==="blocked"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>{result.score}/100</span><Link href={href} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">Corregir en APU<ExternalLink className="h-3.5 w-3.5"/></Link></div></div><div className="mt-3 space-y-2">{result.issues.filter(i=>i.severity!=="info").map(i=><div key={i.id} className="flex gap-2 text-sm text-slate-600">{i.severity==="error"?<XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500"/>:<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/>}<span>{i.resourceName?<b>{i.resourceName}: </b>:null}{i.message}</span></div>)}</div></div>})}</div>:<div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5"/>Todos los APU superan las reglas técnicas automáticas actuales.</div>}
 </section>
}
function Badge({text,kind}:{text:string;kind:"ok"|"warn"|"bad"}){const c=kind==="ok"?"bg-emerald-50 text-emerald-700":kind==="warn"?"bg-amber-50 text-amber-700":"bg-red-50 text-red-700";return <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${c}`}>{text}</span>}
