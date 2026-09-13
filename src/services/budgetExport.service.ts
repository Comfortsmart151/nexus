import * as XLSX from "xlsx";
import { calculateBudgetTotals, type BudgetTotalsValues } from "@/components/budget/BudgetTotals";
import { ApuService } from "@/services/apu.service";
import { ApuValidationService } from "@/services/apuValidation.service";
import { ResourceService } from "@/services/resource.service";
import type { Budget, BudgetChapter, BudgetItem, CostResource } from "@/types/budget";
import type { Project } from "@/types/project";
import { SettingsService } from "@/services/settings.service";
import { BudgetDocumentService } from "@/services/budgetDocument.service";

export interface BudgetExportInput { project:Project; budget:Budget; chapters:BudgetChapter[]; items:BudgetItem[]; values:BudgetTotalsValues; }
type DetailRow={chapter:BudgetChapter;item:BudgetItem;unitPrice:number;amount:number};

function hexRgb(hex:string,fallback:[number,number,number]):[number,number,number]{const m=(hex||"").match(/^#?([0-9a-f]{6})$/i);if(!m)return fallback;const n=parseInt(m[1],16);return[(n>>16)&255,(n>>8)&255,n&255];}
function documentPalette(company:ReturnType<typeof SettingsService.get>){
 const primary=hexRgb(company.documentPrimaryColor,[30,64,175]),secondary=hexRgb(company.documentSecondaryColor,[15,23,42]),accent=hexRgb(company.documentAccentColor,[37,99,235]);
 const byTemplate={corporate:{primary,secondary,accent},executive:{primary:secondary,secondary:[255,255,255] as [number,number,number],accent:primary},engineering:{primary:hexRgb(company.documentPrimaryColor,[51,65,85]),secondary:hexRgb(company.documentSecondaryColor,[30,41,59]),accent},modern:{primary,secondary,accent},classic:{primary:hexRgb(company.documentPrimaryColor,[51,65,85]),secondary:[255,255,255] as [number,number,number],accent:primary}};
 return byTemplate[company.budgetTemplate]||byTemplate.corporate;
}
function safeName(v:string){return v.replace(/[\\/:*?"<>|]+/g,"-").trim().slice(0,80)||"NEXUS";}
function itemPrice(item:BudgetItem){const c=ApuService.calculate(item.id);return item.priceSource==="manual"?item.unitPrice:(c?.finalUnitPrice||item.unitPrice||0);}
function money(n:number){return new Intl.NumberFormat("es-DO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
function rows(input:BudgetExportInput):DetailRow[]{return input.chapters.flatMap(ch=>input.items.filter(i=>i.chapterId===ch.id).map(i=>({chapter:ch,item:i,unitPrice:itemPrice(i),amount:itemPrice(i)*i.quantity})));}
function totalsFor(input:BudgetExportInput,detail=rows(input)){const direct=detail.reduce((s,r)=>s+r.amount,0);return calculateBudgetTotals(direct,input.values);}
function actualResourceQty(item:BudgetItem,res:CostResource){const volume=ApuService.calculate(item.id)?.analysisVolume||1;return (res.quantity/volume)*item.quantity*(1+(res.wastePercentage||0)/100);}
function resourceCost(item:BudgetItem,res:CostResource){return actualResourceQty(item,res)*res.unitPrice;}
function baseWorkbook(input:BudgetExportInput,technical:boolean){
 const detail=rows(input), totals=totalsFor(input,detail), wb=XLSX.utils.book_new(), company=SettingsService.get();
 const issued=BudgetDocumentService.findByProject(input.project.id)[0]; const summary:any[][]=[[company.commercialName || "NEXUS"],[`NEXUS - ${technical?"PRESUPUESTO TÉCNICO":"PRESUPUESTO PARA CLIENTE"}`],[company.legalName || "", company.taxId ? `RNC ${company.taxId}` : ""],[company.phone||"",company.email||""],[company.address||"",issued?.documentCode||"BORRADOR"],[],["Proyecto",input.project.name],["Código",input.project.code],["Cliente",input.project.client],["RNC / Cédula cliente",input.project.clientTaxId||""],["Contacto cliente",input.project.clientContact||""],["Teléfono cliente",input.project.clientPhone||""],["Correo cliente",input.project.clientEmail||""],["Dirección cliente",input.project.clientAddress||""],["Ubicación de obra",input.project.location],[],["RESUMEN ECONÓMICO","RD$"] ,["Costo directo",totals.directCost],[`Gastos generales (${input.values.generalExpensesPercentage}%)`,totals.generalExpenses],[`Imprevistos (${input.values.contingencyPercentage}%)`,totals.contingency],[`Beneficio (${input.values.profitPercentage}%)`,totals.profit],["Subtotal antes de ITBIS",totals.subtotalBeforeItbis],[`ITBIS (${input.values.itbisPercentage}%)`,totals.itbis],["TOTAL GENERAL",totals.totalDop],[],["Vigencia (días)",company.defaultValidityDays],["Condiciones / notas",company.defaultNotes],["Preparado por",`${company.responsibleName}${company.responsibleTitle?` · ${company.responsibleTitle}`:""}`]];
 const sws=XLSX.utils.aoa_to_sheet(summary); sws["!cols"]=[{wch:42},{wch:22}]; XLSX.utils.book_append_sheet(wb,sws,"Resumen");
 const budgetRows:any[][]=[["CAPÍTULO","CÓDIGO","PARTIDA / ALCANCE","UND","CANTIDAD","PRECIO UNITARIO RD$","IMPORTE RD$"]];
 for(const ch of input.chapters){const cr=detail.filter(r=>r.chapter.id===ch.id);budgetRows.push([`${ch.code||""} ${ch.name}`]);for(const r of cr)budgetRows.push([ch.name,r.item.code||"",r.item.name,r.item.unit,r.item.quantity,r.unitPrice,r.amount]);budgetRows.push(["SUBTOTAL "+ch.name,"","","","","",cr.reduce((s,r)=>s+r.amount,0)]);}
 budgetRows.push([], ["Costo directo","","","","","",totals.directCost],[`Gastos generales (${input.values.generalExpensesPercentage}%)`,"","","","","",totals.generalExpenses],[`Imprevistos (${input.values.contingencyPercentage}%)`,"","","","","",totals.contingency],[`Beneficio (${input.values.profitPercentage}%)`,"","","","","",totals.profit],["Subtotal antes de ITBIS","","","","","",totals.subtotalBeforeItbis],[`ITBIS (${input.values.itbisPercentage}%)`,"","","","","",totals.itbis],["TOTAL GENERAL RD$","","","","","",totals.totalDop]);
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
async function pdfBase(input:BudgetExportInput,title:string){const company=SettingsService.get();const issued=BudgetDocumentService.findByProject(input.project.id)[0];const {jsPDF}=await import("jspdf");const autoTable=(await import("jspdf-autotable")).default;const detail=rows(input),totals=totalsFor(input,detail);const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});if(company.logoDataUrl){try{doc.addImage(company.logoDataUrl,"PNG",14,10,28,18,undefined,"FAST");}catch{}}doc.setFont("helvetica","bold");doc.setFontSize(20);doc.text(company.commercialName || "NEXUS",company.logoDataUrl?47:14,18);doc.setFontSize(13);doc.text(title,company.logoDataUrl?47:14,26);doc.setFont("helvetica","normal");doc.setFontSize(8);const code=issued?.documentCode||"BORRADOR";doc.text(`Documento: ${code}${issued?` · ${issued.status.toUpperCase()}`:""}`,14,34);doc.text(`Proyecto: ${input.project.name}`,14,39);doc.text(`Cliente: ${input.project.client}`,14,44);doc.text(`Ubicación: ${input.project.location}`,14,49);if(company.taxId)doc.text(`RNC: ${company.taxId}`,140,34);if(company.phone)doc.text(`Tel.: ${company.phone}`,140,39);if(company.email)doc.text(company.email,140,44);if(company.address)doc.text(company.address.slice(0,42),140,49);return {doc,autoTable,detail,totals,company,issued};}
function footer(doc:any){const company=SettingsService.get();const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFontSize(7);doc.setTextColor(100);doc.text(`NEXUS · ${company.commercialName || "Ingeniería González"} · Página ${p} de ${pages}`,14,290);}}
function totalsTable(doc:any,autoTable:any,startY:number,input:BudgetExportInput,totals:any){autoTable(doc,{startY,theme:"plain",body:[["Costo directo",money(totals.directCost)],[`Gastos generales (${input.values.generalExpensesPercentage}%)`,money(totals.generalExpenses)],[`Imprevistos (${input.values.contingencyPercentage}%)`,money(totals.contingency)],[`Beneficio (${input.values.profitPercentage}%)`,money(totals.profit)],["Subtotal antes de ITBIS",money(totals.subtotalBeforeItbis)],[`ITBIS (${input.values.itbisPercentage}%)`,money(totals.itbis)],["TOTAL GENERAL RD$",money(totals.totalDop)]],styles:{fontSize:9},columnStyles:{0:{cellWidth:55,fontStyle:"bold"},1:{cellWidth:35,halign:"right"}},margin:{left:105}});}
export class BudgetExportService{
 static exportClientExcel(input:BudgetExportInput){const {wb}=baseWorkbook(input,false);XLSX.writeFile(wb,`${safeName(input.project.name)}_Presupuesto_Cliente_NEXUS.xlsx`);}
 static exportTechnicalExcel(input:BudgetExportInput){const {wb,detail}=baseWorkbook(input,true);addTechnicalSheets(wb,detail);XLSX.writeFile(wb,`${safeName(input.project.name)}_Presupuesto_Tecnico_NEXUS.xlsx`);}
 static async exportClientPdf(input:BudgetExportInput){
  const company=SettingsService.get(); const issued=BudgetDocumentService.findByProject(input.project.id)[0];
  const {jsPDF}=await import("jspdf"); const autoTable=(await import("jspdf-autotable")).default;
  const detail=rows(input), totals=totalsFor(input,detail); const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const code=issued?.documentCode||"BORRADOR"; const issuedDate=issued?.issuedAt?new Date(issued.issuedAt):new Date();
  const dateText=issuedDate.toLocaleDateString("es-DO",{day:"2-digit",month:"long",year:"numeric"});
  const palette=documentPalette(company); const [pr,pg,pb]=palette.primary,[sr,sg,sb]=palette.secondary,[ar,ag,ab]=palette.accent;
  // PORTADA
  doc.setFillColor(sr,sg,sb); doc.rect(0,0,210,78,"F");
  if(company.documentShowLogo&&company.logoDataUrl){try{doc.addImage((company.darkLogoDataUrl||company.logoDataUrl),"PNG",15,14,34,22,undefined,"FAST");}catch{}}
  doc.setTextColor(255); doc.setFont("helvetica","bold"); doc.setFontSize(22); doc.text(company.commercialName||"NEXUS",company.documentShowLogo&&company.logoDataUrl?55:15,25);
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text(company.legalName||"",company.documentShowLogo&&company.logoDataUrl?55:15,32);
  doc.setTextColor(ar,ag,ab); doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.text("PROPUESTA ECONÓMICA",15,96);
  doc.setTextColor(15,23,42); doc.setFontSize(24); const projectLines=doc.splitTextToSize(input.project.name,175); doc.text(projectLines,15,108);
  let y=108+projectLines.length*10+5; doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(71,85,105);
  doc.text(`Preparada para: ${input.project.client}`,15,y); y+=7; doc.text(`Ubicación del proyecto: ${input.project.location}`,15,y); y+=7; doc.text(`Documento: ${code}`,15,y); y+=7; doc.text(`Fecha: ${dateText}`,15,y); y+=7; doc.text(`Estado: ${issued?"EMITIDO":"BORRADOR"}`,15,y);
  doc.setFillColor(245,247,250); doc.roundedRect(15,y+14,180,34,4,4,"F"); doc.setTextColor(pr,pg,pb); doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.text("VALOR TOTAL DE LA PROPUESTA",23,y+25); doc.setTextColor(15,23,42); doc.setFontSize(21); doc.text(`RD$ ${money(totals.totalDop)}`,23,y+39);
  doc.setTextColor(71,85,105); doc.setFont("helvetica","normal"); doc.setFontSize(8); const contact=company.documentShowCompanyContact?[company.phone,company.email,company.address].filter(Boolean).join("  ·  "):""; if(contact)doc.text(doc.splitTextToSize(contact,180),15,278);
  // PÁGINA 2: DATOS Y RESUMEN
  doc.addPage(); doc.setTextColor(15,23,42); doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.text("Resumen de la propuesta",15,20);
  doc.setFontSize(9); doc.setTextColor(pr,pg,pb); doc.text("DATOS DEL CLIENTE",15,34); doc.setTextColor(15,23,42); doc.setFont("helvetica","normal"); doc.setFontSize(8.5);
  const clientRows=company.documentShowClientDetails?[["Cliente / empresa",input.project.client],["RNC / Cédula",input.project.clientTaxId||"—"],["Contacto",input.project.clientContact||"—"],["Teléfono",input.project.clientPhone||"—"],["Correo",input.project.clientEmail||"—"],["Dirección",input.project.clientAddress||"—"],["Proyecto",input.project.name],["Ubicación de obra",input.project.location]]:[["Cliente / empresa",input.project.client],["Proyecto",input.project.name],["Ubicación de obra",input.project.location]];
  autoTable(doc,{startY:39,theme:"grid",body:clientRows,styles:{fontSize:8,cellPadding:2.4,textColor:[30,41,59],lineColor:[226,232,240]},columnStyles:{0:{cellWidth:42,fontStyle:"bold",fillColor:[248,250,252]},1:{cellWidth:138}}});
  let ry=(doc as any).lastAutoTable.finalY+10; doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(pr,pg,pb); doc.text("RESUMEN ECONÓMICO",15,ry);
  autoTable(doc,{startY:ry+4,theme:"plain",body:[["Costo directo",`RD$ ${money(totals.directCost)}`],[`Gastos generales (${input.values.generalExpensesPercentage}%)`,`RD$ ${money(totals.generalExpenses)}`],[`Imprevistos (${input.values.contingencyPercentage}%)`,`RD$ ${money(totals.contingency)}`],[`Beneficio (${input.values.profitPercentage}%)`,`RD$ ${money(totals.profit)}`],["Subtotal antes de ITBIS",`RD$ ${money(totals.subtotalBeforeItbis)}`],[`ITBIS (${input.values.itbisPercentage}%)`,`RD$ ${money(totals.itbis)}`],["TOTAL GENERAL",`RD$ ${money(totals.totalDop)}`]],styles:{fontSize:9,cellPadding:2.5,textColor:[30,41,59]},columnStyles:{0:{cellWidth:95,fontStyle:"bold"},1:{cellWidth:55,halign:"right"}},didParseCell:(data:any)=>{if(data.row.index===6){data.cell.styles.fontStyle="bold";data.cell.styles.fontSize=11;data.cell.styles.fillColor=[239,246,255];data.cell.styles.textColor=[30,64,175];}}});
  // PÁGINA 3+: PRESUPUESTO
  doc.addPage(); doc.setTextColor(15,23,42); doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.text("Presupuesto detallado",15,20); doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(100);doc.text(`${code} · ${input.project.client}`,15,27);
  let budgetY=34;
  for(const ch of input.chapters){
   const chapterRows=detail.filter(r=>r.chapter.id===ch.id); if(!chapterRows.length)continue;
   const chapterTitle=`${ch.code?`${ch.code} — `:""}${ch.name}`.toUpperCase();
   autoTable(doc,{startY:budgetY,head:[[chapterTitle,"","","",""]],body:chapterRows.map(r=>[`${r.item.code||""} ${r.item.name}`.trim(),r.item.unit,money(r.item.quantity),money(r.unitPrice),money(r.amount)]),foot:company.documentShowChapterSubtotals?[["SUBTOTAL DEL CAPÍTULO","","","",money(chapterRows.reduce((sum,r)=>sum+r.amount,0))]]:undefined,styles:{fontSize:7.5,cellPadding:2.3,textColor:[30,41,59]},headStyles:{fillColor:[pr,pg,pb],textColor:[255,255,255],fontStyle:"bold"},footStyles:{fillColor:[245,247,250],textColor:[pr,pg,pb],fontStyle:"bold"},alternateRowStyles:{fillColor:[248,250,252]},columnStyles:{0:{cellWidth:88},1:{cellWidth:14},2:{cellWidth:20,halign:"right"},3:{cellWidth:28,halign:"right"},4:{cellWidth:30,halign:"right"}},didDrawPage:()=>{doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(100);doc.text("Partida",15,31);doc.text("Und",105,31);doc.text("Cantidad",124,31);doc.text("P. Unit. RD$",145,31);doc.text("Importe RD$",175,31);}});
   budgetY=(doc as any).lastAutoTable.finalY+5;
  }
  totalsTable(doc,autoTable,budgetY+3,input,totals);
  // CONDICIONES Y ACEPTACIÓN
  if(company.documentShowAcceptance){doc.addPage(); doc.setTextColor(15,23,42);doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text("Condiciones comerciales y aceptación",15,20);doc.setFontSize(9);doc.setTextColor(37,99,235);doc.text("CONDICIONES",15,34);doc.setFont("helvetica","normal");doc.setTextColor(30,41,59);doc.setFontSize(9);const notes=doc.splitTextToSize(company.defaultNotes||"Precios sujetos a revisión según alcance final y condiciones de obra.",180);doc.text(notes,15,42);let cy=46+notes.length*5;doc.text(`Vigencia de la propuesta: ${company.defaultValidityDays} días`,15,cy);cy+=7;doc.text(`Documento: ${code} · Estado: ${issued?"EMITIDO":"BORRADOR"}`,15,cy);
  cy+=20;doc.setFont("helvetica","bold");doc.text("PREPARADO POR",15,cy);doc.text("ACEPTACIÓN DEL CLIENTE",112,cy);doc.setFont("helvetica","normal");doc.text(company.responsibleName||"Responsable",15,cy+8);if(company.responsibleTitle)doc.text(company.responsibleTitle,15,cy+13);doc.text(input.project.clientContact||input.project.client,112,cy+8);if(input.project.clientTaxId)doc.text(`RNC/Cédula: ${input.project.clientTaxId}`,112,cy+13);if(input.project.clientPhone)doc.text(`Tel.: ${input.project.clientPhone}`,112,cy+18);doc.line(15,cy+34,88,cy+34);doc.line(112,cy+34,195,cy+34);doc.text("Firma / sello",15,cy+39);doc.text("Firma / sello",112,cy+39);doc.text("Fecha de aceptación: __________________",112,cy+47);}
  footer(doc); doc.save(`${safeName(input.project.name)}_${code}_Propuesta_Cliente.pdf`);
 }
 static async exportTechnicalPdf(input:BudgetExportInput){const {doc,autoTable,detail,totals}=await pdfBase(input,"PRESUPUESTO TÉCNICO DETALLADO");autoTable(doc,{startY:56,head:[["Capítulo / Partida","Und","Cantidad","P. Unit. RD$","Importe RD$"]],body:detail.map(r=>[`${r.chapter.code?`${r.chapter.code} · `:""}${r.chapter.name}\n${r.item.code||""} ${r.item.name}`,r.item.unit,money(r.item.quantity),money(r.unitPrice),money(r.amount)]),styles:{fontSize:7.2,cellPadding:2},headStyles:{fillColor:[15,23,42]}});totalsTable(doc,autoTable,(doc as any).lastAutoTable.finalY+7,input,totals);
  for(const r of detail){doc.addPage();doc.setTextColor(0);doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text(`${r.item.code||""} ${r.item.name}`.trim(),14,18);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(`Capítulo: ${r.chapter.name} · Cantidad: ${money(r.item.quantity)} ${r.item.unit} · P.U.: RD$ ${money(r.unitPrice)}`,14,24);const calc=ApuService.calculate(r.item.id);const volume=calc?.analysisVolume||1;const resources=ResourceService.findByItem(r.item.id);autoTable(doc,{startY:30,head:[["Tipo","Recurso","Und","Cant. APU","Desp. %","Precio RD$","Costo APU RD$"]],body:resources.map(res=>[res.type,res.name,res.unit,money(res.quantity),money(res.wastePercentage||0),money(res.unitPrice),money(ResourceService.calculateResourceTotal(res))]),styles:{fontSize:6.8,cellPadding:1.7},headStyles:{fillColor:[30,41,59]}});const validation=ApuValidationService.validate(r.item);const y=(doc as any).lastAutoTable.finalY+5;doc.setFontSize(8);doc.text(`Volumen de análisis: ${money(volume)} · Validación: ${validation.status.toUpperCase()} · Puntaje: ${validation.score}%`,14,y);if(validation.issues.length)autoTable(doc,{startY:y+3,head:[["Severidad","Recurso","Observación"]],body:validation.issues.map(x=>[x.severity.toUpperCase(),x.resourceName||"",x.message]),styles:{fontSize:6.5,cellPadding:1.5}});
  }
  doc.addPage();doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text("RECURSOS CONSOLIDADOS DEL PROYECTO",14,18);const map=new Map<string,{type:string;name:string;unit:string;qty:number;cost:number}>();for(const r of detail)for(const res of ResourceService.findByItem(r.item.id)){const key=res.libraryResourceId||`${res.type}|${res.code||res.name}|${res.unit}`;const cur=map.get(key)||{type:res.type,name:res.name,unit:res.unit,qty:0,cost:0};cur.qty+=actualResourceQty(r.item,res);cur.cost+=resourceCost(r.item,res);map.set(key,cur);}autoTable(doc,{startY:24,head:[["Tipo","Recurso","Und","Cantidad total","Costo total RD$"]],body:[...map.values()].map(v=>[v.type,v.name,v.unit,money(v.qty),money(v.cost)]),styles:{fontSize:7,cellPadding:1.8},headStyles:{fillColor:[15,23,42]}});footer(doc);doc.save(`${safeName(input.project.name)}_Presupuesto_Tecnico_NEXUS.pdf`);}
 static exportExcel(input:BudgetExportInput){return this.exportClientExcel(input);}
 static async exportPdf(input:BudgetExportInput){return this.exportClientPdf(input);}
}
