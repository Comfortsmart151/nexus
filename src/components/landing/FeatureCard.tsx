import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  value: string;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon: Icon,
  value,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-blue-400/20 bg-[#071126]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-[0_0_35px_rgba(37,99,235,0.2)]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500/10 shadow-inner shadow-blue-500/10">
          <Icon className="h-8 w-8 text-blue-400" strokeWidth={1.8} />
        </div>

        <div>
          <span className="text-4xl font-black tracking-tight text-blue-400">
            {value}
          </span>

          <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>

          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}