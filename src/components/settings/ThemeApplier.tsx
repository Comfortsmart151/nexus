"use client";
import { useEffect } from "react";
import { SettingsService } from "@/services/settings.service";

const presets: Record<string,{primary:string;accent:string;deep:string;surface:string}> = {
 "nexus-blue":{primary:"#2563eb",accent:"#38bdf8",deep:"#020817",surface:"#0b1428"},
 "executive-navy":{primary:"#1e3a8a",accent:"#c59d5f",deep:"#07111f",surface:"#101c2e"},
 "engineering-slate":{primary:"#475569",accent:"#0ea5e9",deep:"#0f172a",surface:"#1e293b"},
 emerald:{primary:"#059669",accent:"#34d399",deep:"#052e2b",surface:"#0b3b35"},
 graphite:{primary:"#3f3f46",accent:"#a1a1aa",deep:"#09090b",surface:"#18181b"},
 "corporate-light":{primary:"#1d4ed8",accent:"#64748b",deep:"#f8fafc",surface:"#ffffff"},
};
export function applyNexusTheme(){const s=SettingsService.get();const p=s.appTheme==="custom"?{primary:s.customPrimaryColor,accent:s.customAccentColor,deep:"#0f172a",surface:"#1e293b"}:presets[s.appTheme]||presets["nexus-blue"];const r=document.documentElement;r.dataset.theme=s.appAppearance;r.dataset.appTheme=s.appTheme;r.style.setProperty("--nexus-primary",p.primary);r.style.setProperty("--nexus-accent",p.accent);r.style.setProperty("--nexus-deep",p.deep);r.style.setProperty("--nexus-surface",p.surface);}
export default function ThemeApplier(){useEffect(()=>{applyNexusTheme();const fn=()=>applyNexusTheme();window.addEventListener("nexus-settings-changed",fn);return()=>window.removeEventListener("nexus-settings-changed",fn)},[]);return null;}
