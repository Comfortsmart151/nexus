"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  FileSignature,
  FileSpreadsheet,
  FolderKanban,
  FolderOpen,
  LayoutDashboard,
  Layers3,
  Library,
  ReceiptText,
  Settings,
  Upload,
} from "lucide-react";
import NexusLogo from "@/components/ui/NexusLogo";

type Child = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type Section = { key: string; label: string; href: string; icon: React.ComponentType<{ className?: string }>; children: Child[] };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const projectId = useMemo(() => pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? null, [pathname]);

  const sections: Section[] = useMemo(() => [
    {
      key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard,
      children: [{ label: "Vista general", href: "/dashboard", icon: LayoutDashboard }],
    },
    {
      key: "projects", href: "/projects", label: "Proyectos", icon: FolderKanban,
      children: [
        { label: "Todos los proyectos", href: "/projects", icon: FolderKanban },
        ...(projectId ? [
          { label: "Resumen del proyecto", href: `/projects/${projectId}`, icon: FolderOpen },
          { label: "Planos", href: `/projects/${projectId}/plans`, icon: Upload },
          { label: "Capítulos y partidas", href: `/projects/${projectId}/chapters`, icon: Layers3 },
          { label: "Presupuesto", href: `/projects/${projectId}/budget`, icon: ReceiptText },
          { label: "Contratos", href: `/projects/${projectId}/contracts`, icon: FileSignature },
        ] : []),
      ],
    },
    {
      key: "library", href: "/library", label: "Biblioteca", icon: Library,
      children: [{ label: "Recursos", href: "/library", icon: Library }],
    },
    {
      key: "budgets", href: "/budgets", label: "Presupuestos", icon: FileSpreadsheet,
      children: [{ label: "Todos los presupuestos", href: "/budgets", icon: FileSpreadsheet }],
    },
    {
      key: "reports", href: "/dashboard", label: "Reportes", icon: BarChart3,
      children: [{ label: "Resumen", href: "/dashboard", icon: BarChart3 }],
    },
    {
      key: "settings", href: "/dashboard", label: "Configuración", icon: Settings,
      children: [{ label: "General", href: "/dashboard", icon: Settings }],
    },
  ], [projectId]);

  const activeKey = pathname.startsWith("/projects") ? "projects"
    : pathname.startsWith("/library") ? "library"
    : pathname.startsWith("/budgets") ? "budgets"
    : pathname === "/dashboard" ? "dashboard" : "";

  const [open, setOpen] = useState<string[]>([]);
  useEffect(() => {
    if (activeKey) setOpen((current) => current.includes(activeKey) ? current : [...current, activeKey]);
  }, [activeKey]);

  // Landing and Dashboard retain their own presentation. All work routes use this single sidebar.
  if (pathname === "/" || pathname === "/dashboard") return <>{children}</>;

  const toggle = (key: string) => setOpen((current) =>
    current.includes(key) ? current.filter((x) => x !== key) : [...current, key]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
        <NexusLogo size="sm" />
        <nav className="mt-10 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeKey === section.key;
            const expanded = open.includes(section.key);
            return (
              <div key={section.key}>
                <div className={`flex items-center rounded-xl transition ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}>
                  <Link href={section.href} className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 ${active ? "font-semibold" : ""}`}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{section.label}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(section.key)}
                    className="mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/70"
                    aria-label={`${expanded ? "Contraer" : "Desplegar"} ${section.label}`}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {expanded ? (
                  <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3">
                    {section.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href || (child.href.endsWith("/chapters") && pathname.startsWith(child.href + "/"));
                      return (
                        <Link key={`${section.key}-${child.label}`} href={child.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${childActive ? "bg-slate-100 font-semibold text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
                          <ChildIcon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-400">Powered by</p>
          <p className="mt-1 font-semibold">Ingeniería González</p>
        </div>
      </aside>
      <div className="lg:pl-72">{children}</div>
    </div>
  );
}
