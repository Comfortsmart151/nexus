"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3, ChevronDown, FileSignature, FileSpreadsheet, FolderKanban,
  ClipboardCheck, History, FolderOpen, LayoutDashboard, Layers3, Library,
  ReceiptText, Settings, Upload, Menu, X,
} from "lucide-react";
import NexusLogo from "@/components/ui/NexusLogo";

type Child = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type Section = { key: string; label: string; href: string; icon: React.ComponentType<{ className?: string }>; children: Child[] };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const projectId = useMemo(() => pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? null, [pathname]);
  const [mobileOpen,setMobileOpen]=useState(false);

  const sections: Section[] = useMemo(() => [
    { key:"dashboard",href:"/dashboard",label:"Dashboard",icon:LayoutDashboard,children:[{label:"Vista general",href:"/dashboard",icon:LayoutDashboard}] },
    { key:"projects",href:"/projects",label:"Proyectos",icon:FolderKanban,children:[
      {label:"Todos los proyectos",href:"/projects",icon:FolderKanban},
      ...(projectId ? [
        {label:"Resumen del proyecto",href:`/projects/${projectId}`,icon:FolderOpen},
        {label:"Planos",href:`/projects/${projectId}/plans`,icon:Upload},
        {label:"Capítulos y partidas",href:`/projects/${projectId}/chapters`,icon:Layers3},
        {label:"Revisión",href:`/projects/${projectId}/review`,icon:ClipboardCheck},
        {label:"Presupuesto",href:`/projects/${projectId}/budget`,icon:ReceiptText},
        {label:"Revisiones",href:`/projects/${projectId}/revisions`,icon:History},
        {label:"Contratos",href:`/projects/${projectId}/contracts`,icon:FileSignature},
      ] : []),
    ]},
    { key:"library",href:"/library",label:"Biblioteca",icon:Library,children:[{label:"Recursos",href:"/library",icon:Library},{label:"Análisis Construcosto",href:"/library/construcosto",icon:ReceiptText}] },
    { key:"budgets",href:"/budgets",label:"Presupuestos",icon:FileSpreadsheet,children:[{label:"Todos los presupuestos",href:"/budgets",icon:FileSpreadsheet}] },
    { key:"reports",href:"/dashboard",label:"Reportes",icon:BarChart3,children:[{label:"Resumen",href:"/dashboard",icon:BarChart3}] },
    { key:"settings",href:"/settings",label:"Configuración",icon:Settings,children:[{label:"Empresa, apariencia y documentos",href:"/settings",icon:Settings}] },
  ], [projectId]);

  const activeKey = pathname.startsWith("/projects") ? "projects" : pathname.startsWith("/library") ? "library" : pathname.startsWith("/budgets") ? "budgets" : pathname.startsWith("/settings") ? "settings" : pathname === "/dashboard" ? "dashboard" : "";
  const [open,setOpen]=useState<string[]>([]);
  useEffect(()=>{if(activeKey)setOpen(c=>c.includes(activeKey)?c:[...c,activeKey]);setMobileOpen(false)},[activeKey,pathname]);
  useEffect(()=>{if(!mobileOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setMobileOpen(false)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[mobileOpen]);

  if(pathname==="/"||pathname==="/dashboard")return <>{children}</>;
  const toggle=(key:string)=>setOpen(c=>c.includes(key)?c.filter(x=>x!==key):[...c,key]);

  const Navigation=({mobile=false}:{mobile?:boolean})=><>
    <nav className="mt-8 space-y-2" aria-label="Navegación principal">
      {sections.map(section=>{const Icon=section.icon;const active=activeKey===section.key;const expanded=open.includes(section.key);return <div key={section.key}>
        <div className={`nexus-nav-row flex items-center rounded-xl transition ${active?"bg-blue-50 text-blue-700":"text-slate-600 hover:bg-slate-100"}`}>
          <Link href={section.href} onClick={()=>mobile&&setMobileOpen(false)} className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 ${active?"font-semibold":""}`}><Icon className="h-5 w-5 shrink-0"/><span>{section.label}</span></Link>
          <button type="button" onClick={()=>toggle(section.key)} className="mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/70" aria-expanded={expanded} aria-label={`${expanded?"Contraer":"Desplegar"} ${section.label}`}><ChevronDown className={`h-4 w-4 transition-transform ${expanded?"rotate-180":""}`}/></button>
        </div>
        {expanded&&<div className="nexus-nav-children ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3">{section.children.map(child=>{const ChildIcon=child.icon;const childActive=pathname===child.href||(child.href.endsWith("/chapters")&&pathname.startsWith(child.href+"/"));return <Link key={`${section.key}-${child.label}`} href={child.href} onClick={()=>mobile&&setMobileOpen(false)} aria-current={childActive?"page":undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${childActive?"bg-slate-100 font-semibold text-blue-700":"text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><ChildIcon className="h-4 w-4"/>{child.label}</Link>})}</div>}
      </div>})}
    </nav>
    <div className="nexus-powered mt-auto rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm text-slate-400">Powered by</p><p className="mt-1 font-semibold">Ingeniería González</p></div>
  </>;

  return <div className="min-h-screen bg-slate-100">
    <a href="#nexus-main" className="nexus-skip-link">Saltar al contenido</a>
    <aside className="nexus-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex"><NexusLogo size="sm"/><Navigation/></aside>
    <header className="nexus-mobile-header sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden"><NexusLogo size="sm"/><button type="button" onClick={()=>setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200" aria-label="Abrir menú"><Menu className="h-5 w-5"/></button></header>
    {mobileOpen&&<div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/45" aria-label="Cerrar menú" onClick={()=>setMobileOpen(false)}/><aside role="dialog" aria-modal="true" aria-label="Menú de navegación" className="nexus-sidebar absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r border-slate-200 bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><NexusLogo size="sm"/><button onClick={()=>setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200" aria-label="Cerrar menú"><X className="h-5 w-5"/></button></div><Navigation mobile/></aside></div>}
    <main id="nexus-main" tabIndex={-1} className="lg:pl-72">{children}</main>
  </div>;
}
