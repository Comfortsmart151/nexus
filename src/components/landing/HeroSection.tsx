import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Clock3,
  Play,
  ShieldCheck,
} from "lucide-react";

import NexusLogo from "@/components/ui/NexusLogo";
import FeatureCard from "./FeatureCard";

export default function HeroSection() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      {/* Fondo */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.055)_1px,transparent_1px)] bg-[size:72px_72px]" />

        {/* Edificio */}
        <div
          className="absolute inset-y-0 left-[31%] w-[58%] bg-contain bg-center bg-no-repeat opacity-95"
          style={{
            backgroundImage: "url('/building-wireframe.svg')",
          }}
        />

        {/* Luces */}
        <div className="absolute -left-64 top-0 h-[650px] w-[650px] rounded-full bg-blue-700/25 blur-[170px]" />

        <div className="absolute -right-40 bottom-0 h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[170px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.12),transparent_48%)]" />

        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#020817] to-transparent" />
      </div>

      {/* Contenido */}
      <section className="relative z-10 mx-auto grid min-h-screen max-w-[1440px] items-center gap-16 px-6 pb-28 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-16">

        {/* Lado izquierdo */}
        <div className="max-w-3xl">

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.95)]" />
            Powered by Ingeniería González
          </div>

          <div className="mt-14">
            <NexusLogo />
          </div>

          <h1 className="mt-14 max-w-2xl text-4xl font-bold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            Presupuestos precisos.
            <span className="mt-2 block bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Decisiones más rápidas.
            </span>
          </h1>

          <div className="mt-12 flex flex-wrap gap-4">

            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-5 rounded-2xl border border-sky-300/40 bg-blue-600 px-8 py-4 font-semibold text-white shadow-[0_0_28px_rgba(37,99,235,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-blue-500 hover:shadow-[0_0_38px_rgba(37,99,235,0.55)]"
            >
              Comenzar ahora

              <ArrowRight
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={2}
              />
            </Link>

            <button className="group inline-flex items-center gap-3 rounded-2xl border border-slate-500/50 bg-slate-950/35 px-8 py-4 font-semibold text-slate-100 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-[0_0_26px_rgba(37,99,235,0.3)]">
              <Play className="h-4 w-4 fill-current" />
              Ver demo
            </button>

          </div>

          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4 text-sm text-slate-400">

            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              Menos errores
            </span>

            <span className="h-5 w-px bg-slate-700" />

            <span className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-blue-400" />
              Más velocidad
            </span>

          </div>

        </div>

        {/* Lado derecho */}
        <div className="relative">

          <div className="absolute -inset-12 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative space-y-5">

            <FeatureCard
              icon={Clock3}
              value="70%"
              title="Menos tiempo"
              description="Automatiza tareas repetitivas y acelera la elaboración de presupuestos."
            />

            <FeatureCard
              icon={ShieldCheck}
              value="99%"
              title="Más precisión"
              description="Organiza recursos y cálculos para reducir errores antes de entregar."
            />

            <FeatureCard
              icon={ChartNoAxesCombined}
              value="∞"
              title="Escalable"
              description="Preparado para ingenieros independientes, equipos técnicos y constructoras."
            />

          </div>

        </div>

      </section>

      {/* Footer */}

      <footer className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#020817]/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 text-xs text-slate-500 lg:px-16">

          <div className="flex items-center gap-3">
            <NexusLogo showName={false} size="sm" />
            <span>Powered by Ingeniería González</span>
          </div>

          <span>NEXUS © 2026</span>

        </div>

      </footer>

    </main>
  );
}