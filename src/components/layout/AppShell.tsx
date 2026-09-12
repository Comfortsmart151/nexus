"use client";

import Link from "next/link";
import type React from "react";
import { usePathname } from "next/navigation";
import { BarChart3, FileSpreadsheet, FolderKanban, LayoutDashboard, Library, Settings } from "lucide-react";
import NexusLogo from "@/components/ui/NexusLogo";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/budgets", label: "Presupuestos", icon: FileSpreadsheet },
  { href: "/dashboard", label: "Reportes", icon: BarChart3, exact: false },
  { href: "/dashboard", label: "Configuración", icon: Settings, exact: false },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // La landing conserva su diseño propio y Dashboard ya contiene esta navegación.
  if (pathname === "/" || pathname === "/dashboard") return <>{children}</>;

  return <div className="min-h-screen bg-slate-100">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
      <NexusLogo size="sm" />
      <nav className="mt-10 space-y-2">
        {items.map(({ href, label, icon: Icon }, index) => {
          const active = index < 4 && (pathname === href || pathname.startsWith(`${href}/`));
          return <Link key={`${label}-${index}`} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}>
            <Icon className="h-5 w-5" />{label}
          </Link>;
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm text-slate-400">Powered by</p><p className="mt-1 font-semibold">Ingeniería González</p></div>
    </aside>
    <div className="lg:pl-72">{children}</div>
  </div>;
}
