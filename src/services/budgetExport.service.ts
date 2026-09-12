import * as XLSX from "xlsx";
import { calculateBudgetTotals, type BudgetTotalsValues } from "@/components/budget/BudgetTotals";
import { ApuService } from "@/services/apu.service";
import { ApuValidationService } from "@/services/apuValidation.service";
import { ResourceService } from "@/services/resource.service";
import type { Budget, BudgetChapter, BudgetItem, CostResource } from "@/types/budget";
import type { Project } from "@/types/project";

export interface BudgetExportInput { project:Project; budget:Budget; chapters:BudgetChapter[]; items:BudgetItem[]; values:BudgetTotalsValues; }
type DetailRow={chapter:BudgetChapter;item:BudgetItem;unitPrice:number;amount:number};
function safeName(v:string){return v.replace(/[\\/:*?"<>|]+/g,"-").trim().slice(0,80)||"NEXUS";}
function itemPrice(item:BudgetItem){const c=ApuService.calculate(item.id);return item.priceSource==="manual"?item.unitPrice:(c?.finalUnitPrice||item.unitPrice||0);}
function money(n:number){return new Intl.NumberFormat("es-DO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
function rows(input:BudgetExportInput):DetailRow[]{return input.chapters.flatMap(ch=>input.items.filter(i=>i.chapterId===ch.id).map(i=>({chapter:ch,item:i,unitPrice:itemPrice(i),amount:itemPrice(i)*i.quantity})));}
function totalsFor(input:BudgetExportInput,detail=rows(input)){const direct=detail.reduce((s,r)=>s+r.amount,0);return calculateBudgetTotals(direct,input.values);}
function actualResourceQty(item:BudgetItem,res:CostResource){const volume=ApuService.calculate(item.id)?.analysisVolume||1;return (res.quantity/volume)*item.quantity*(1+(res.wastePercentage||0)/100);}
function resourceCost(item:BudgetItem,res:CostResource){return actualResourceQty(item,res)*res.unitPrice;}
function baseWorkbook(input:BudgetExportInput,technical:boolean){
 const detail=rows(input), totals=totalsFor(input,detail), wb=XLSX.utils.book_new();
 const summary:any[][]=[[`NEXUS - ${technical?"PRESUPUESTO TÉCNICO":"PRESUPUESTO PARA CLIENTE"}`],["Proyecto",input.project.name],["Código",input.project.code],["Cliente",input.project.client],["Ubicación",input.project.location],[],["RESUMEN ECONÓMICO","RD$"] ,["Costo directo",totals.directCost],[`Gastos generales (${input.values.generalExpensesPercentage}%)`,totals.generalExpenses],[`Imprevistos (${input.values.contingencyPercentage}%)`,totals.contingency],[`Utilidad (${input.values.profitPercentage}%)`,totals.profit],["Subtotal antes de ITBIS",totals.subtotalBeforeItbis],[`ITBIS (${input.values.itbisPercentage}%)`,totals.itbis],["TOTAL GENERAL",totals.totalDop]];
 const sws=XLSX.utils.aoa_to_sheet(summary); sws["!cols"]=[{wch:42},{wch:22}]; XLSX.utils.book_append_sheet(wb,sws,"Resumen");
 const budgetRows:any[][]=[["CAPÍTULO","CÓDIGO","PARTIDA / ALCANCE","UND","CANTIDAD","PRECIO UNITARIO RD$","IMPORTE RD$"]];
 for(const ch of input.chapters){const cr=detail.filter(r=>r.chapter.id===ch.id);budgetRows.push([`${ch.code||""} ${ch.name}`]);for(const r of cr)budgetRows.push([ch.name,r.item.code||"",r.item.name,r.item.unit,r.item.quantity,r.unitPrice,r.amount]);budgetRows.push(["SUBTOTAL "+ch.name,"","","","","",cr.reduce((s,r)=>s+r.amount,0)]);}
 budgetRows.push([], ["Costo directo","","","","","",totals.directCost],[`Gastos generales (${input.values.generalExpensesPercentage}%)`,"","","","","",totals.generalExpenses],[`Imprevistos (${input.values.contingencyPercentage}%)`,"","","","","",totals.contingency],[`Utilidad (${input.values.profitPercentage}%)`,"","","","","",totals.profit],["Subtotal antes de ITBIS","","","","","",totals.subtotalBeforeItbis],[`ITBIS (${input.values.itbisPercentage}%)`,"","","","","",totals.itbis],["TOTAL GENERAL RD$","","","","","",totals.totalDop]);
 const bws=XLSX.utils.aoa_to_sheet(budgetRows);bws["!cols"]=[{wch:28},{wch:14},{wch:52},{wch:10},{wch:14},{wch:20},{wch:20}];XLSX.utils.book_append_sheet(wb,bws,"Presupuesto");
 return {wb,detail,totals};
}
function addTechnicalSheets(wb:XLSX.WorkBook,detail:DetailRow[]){
 const apu:any[][]=[["CAPÍTULO","PARTIDA","UND PARTIDA","CANT. PARTIDA","TIPO","CÓDIGO RECURSO","RECURSO","UND RECURSO","CANT. APU","VOLUMEN APU","DESPERDICIO %","PRECIO RD$","CANT. PROYECTO","COSTO PROYECTO RD$","FUENTE"]];
 const consolidated=new Map<string,{type:string;code:string;name:string;unit:string;qty:number;cost:number;source:string}>();
 const alerts:any[][]=[["CAPÍTULO","PARTIDA","ESTADO","PUNTAJE","SEVERIDAD","RECURSO","OBSERVACIÓN"]];
 for(const r of detail){
  const volume=ApuService.calculate(r.item.id)?.analysisVolume||1;
  for(const res of ResourceService.findByItem(r.item.id)){
   const qty=actualResourceQty(r.item,res),cost=resourceCost(r.item,res);
   apu.push([r.chapter.name,r.item.name,r.item.unit,r.item.quantity,res.type,res.code||"",res.name,res.unit,res.quantity,volume,res.wastePercentage,res.unitPrice,qty,cost,res.priceSource||""]);
   const key=res.libraryResourceId||`${res.type}|${res.code||res.name}|${res.unit}`;
   const cur=consolidated.get(key)||{type:res.type,code:res.code||"",name:res.name,unit:res.unit,qty:0,cost:0,source:res.priceSource||""};cur.qty+=qty;cur.cost+=cost;consolidated.set(key,cur);
  }
  const validation=ApuValidationService.validate(r.item);
  if(!validation.issues.length)alerts.push([r.chapter.name,r.item.name,validation.status,validation.score,"OK","","Sin incidencias detectadas"]);
  else for(const x of validation.issues)alerts.push([r.chapter.name,r.item.name,validation.status,validation.score,x.severity,x.resourceName||"",x.message]);
 }
 const aws=XLSX.utils.aoa_to_sheet(apu);aws["!cols"]=[{wch:25},{wch:45},{wch:12},{wch:14},{wch:14},{wch:18},{wch:48},{wch:14},{wch:14},{wch:14},{wch:15},{wch:18},{wch:18},{wch:22},{wch:28}];XLSX.utils.book_append_sheet(wb,aws,"APU");
 const cres:any[][]=[["TIPO","CÓDIGO","RECURSO","UND","CANTIDAD TOTAL","COSTO TOTAL RD$","PRECIO PROMEDIO RD$","FUENTE"]];for(const v of consolidated.values())cres.push([v.type,v.code,v.name,v.unit,v.qty,v.cost,v.qty?v.cost/v.qty:0,v.source]);
 const cws=XLSX.utils.aoa_to_sheet(cres);cws["!cols"]=[{wch:14},{wch:18},{wch:50},{wch:12},{wch:18},{wch:20},{wch:22},{wch:30}];XLSX.utils.book_append_sheet(wb,cws,"Recursos consolidados");
 const vws=XLSX.utils.aoa_to_sheet(alerts);vws["!cols"]=[{wch:25},{wch:45},{wch:14},{wch:10},{wch:14},{wch:42},{wch:75}];XLSX.utils.book_append_sheet(wb,vws,"Alertas y validaciones");
}
async function pdfBase(input:BudgetExportInput,title:string){const {jsPDF}=await import("jspdf");const autoTable=(await import("jspdf-autotable")).default;const detail=rows(input),totals=totalsFor(input,detail);const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text("NEXUS",14,18);doc.setFontSize(13);doc.text(title,14,26);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(`Proyecto: ${input.project.name}`,14,34);doc.text(`Cliente: ${input.project.client}`,14,39);doc.text(`Ubicación: ${input.project.location}`,14,44);doc.text(`Código: ${input.project.code}`,14,49);return {doc,autoTable,detail,totals};}
function footer(doc:any){const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFontSize(7);doc.setTextColor(100);doc.text(`NEXUS · Powered by Ingeniería González · Página ${p} de ${pages}`,14,290);}}
function totalsTable(doc:any,autoTable:any,startY:number,input:BudgetExportInput,totals:any){autoTable(doc,{startY,theme:"plain",body:[["Costo directo",money(totals.directCost)],[`Gastos generales (${input.values.generalExpensesPercentage}%)`,money(totals.generalExpenses)],[`Imprevistos (${input.values.contingencyPercentage}%)`,money(totals.contingency)],[`Utilidad (${input.values.profitPercentage}%)`,money(totals.profit)],["Subtotal antes de ITBIS",money(totals.subtotalBeforeItbis)],[`ITBIS (${input.values.itbisPercentage}%)`,money(totals.itbis)],["TOTAL GENERAL RD$",money(totals.totalDop)]],styles:{fontSize:9},columnStyles:{0:{cellWidth:55,fontStyle:"bold"},1:{cellWidth:35,halign:"right"}},margin:{left:105}});}
export class BudgetExportService{
 static exportClientExcel(input:BudgetExportInput){const {wb}=baseWorkbook(input,false);XLSX.writeFile(wb,`${safeName(input.project.name)}_Presupuesto_Cliente_NEXUS.xlsx`);}
 static exportTechnicalExcel(input:BudgetExportInput){const {wb,detail}=baseWorkbook(input,true);addTechnicalSheets(wb,detail);XLSX.writeFile(wb,`${safeName(input.project.name)}_Presupuesto_Tecnico_NEXUS.xlsx`);}
 static async exportClientPdf(input:BudgetExportInput){const {doc,autoTable,detail,totals}=await pdfBase(input,"PRESUPUESTO PARA CLIENTE");autoTable(doc,{startY:56,head:[["Capítulo / Partida","Und","Cantidad","P. Unit. RD$","Importe RD$"]],body:detail.map(r=>[`${r.chapter.name}\n${r.item.code||""} ${r.item.name}`,r.item.unit,money(r.item.quantity),money(r.unitPrice),money(r.amount)]),styles:{fontSize:7.5,cellPadding:2},headStyles:{fillColor:[15,23,42]},columnStyles:{0:{cellWidth:88},1:{cellWidth:14},2:{cellWidth:20,halign:"right"},3:{cellWidth:28,halign:"right"},4:{cellWidth:30,halign:"right"}}});totalsTable(doc,autoTable,(doc as any).lastAutoTable.finalY+7,input,totals);footer(doc);doc.save(`${safeName(input.project.name)}_Presupuesto_Cliente_NEXUS.pdf`);}
 static async exportTechnicalPdf(input:BudgetExportInput){const {doc,autoTable,detail,totals}=await pdfBase(input,"PRESUPUESTO TÉCNICO DETALLADO");autoTable(doc,{startY:56,head:[["Capítulo / Partida","Und","Cantidad","P. Unit. RD$","Importe RD$"]],body:detail.map(r=>[`${r.chapter.name}\n${r.item.code||""} ${r.item.name}`,r.item.unit,money(r.item.quantity),money(r.unitPrice),money(r.amount)]),styles:{fontSize:7.2,cellPadding:2},headStyles:{fillColor:[15,23,42]}});totalsTable(doc,autoTable,(doc as any).lastAutoTable.finalY+7,input,totals);
  for(const r of detail){doc.addPage();doc.setTextColor(0);doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text(`${r.item.code||""} ${r.item.name}`.trim(),14,18);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(`Capítulo: ${r.chapter.name} · Cantidad: ${money(r.item.quantity)} ${r.item.unit} · P.U.: RD$ ${money(r.unitPrice)}`,14,24);const calc=ApuService.calculate(r.item.id);const volume=calc?.analysisVolume||1;const resources=ResourceService.findByItem(r.item.id);autoTable(doc,{startY:30,head:[["Tipo","Recurso","Und","Cant. APU","Desp. %","Precio RD$","Costo APU RD$"]],body:resources.map(res=>[res.type,res.name,res.unit,money(res.quantity),money(res.wastePercentage||0),money(res.unitPrice),money(ResourceService.calculateResourceTotal(res))]),styles:{fontSize:6.8,cellPadding:1.7},headStyles:{fillColor:[30,41,59]}});const validation=ApuValidationService.validate(r.item);const y=(doc as any).lastAutoTable.finalY+5;doc.setFontSize(8);doc.text(`Volumen de análisis: ${money(volume)} · Validación: ${validation.status.toUpperCase()} · Puntaje: ${validation.score}%`,14,y);if(validation.issues.length)autoTable(doc,{startY:y+3,head:[["Severidad","Recurso","Observación"]],body:validation.issues.map(x=>[x.severity.toUpperCase(),x.resourceName||"",x.message]),styles:{fontSize:6.5,cellPadding:1.5}});
  }
  doc.addPage();doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text("RECURSOS CONSOLIDADOS DEL PROYECTO",14,18);const map=new Map<string,{type:string;name:string;unit:string;qty:number;cost:number}>();for(const r of detail)for(const res of ResourceService.findByItem(r.item.id)){const key=res.libraryResourceId||`${res.type}|${res.code||res.name}|${res.unit}`;const cur=map.get(key)||{type:res.type,name:res.name,unit:res.unit,qty:0,cost:0};cur.qty+=actualResourceQty(r.item,res);cur.cost+=resourceCost(r.item,res);map.set(key,cur);}autoTable(doc,{startY:24,head:[["Tipo","Recurso","Und","Cantidad total","Costo total RD$"]],body:[...map.values()].map(v=>[v.type,v.name,v.unit,money(v.qty),money(v.cost)]),styles:{fontSize:7,cellPadding:1.8},headStyles:{fillColor:[15,23,42]}});footer(doc);doc.save(`${safeName(input.project.name)}_Presupuesto_Tecnico_NEXUS.pdf`);}
 static exportExcel(input:BudgetExportInput){return this.exportClientExcel(input);}
 static async exportPdf(input:BudgetExportInput){return this.exportClientPdf(input);}
}
