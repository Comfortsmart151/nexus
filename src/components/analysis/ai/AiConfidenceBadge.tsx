import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import type {
  NexusAiConfidenceLevel,
} from "@/types/nexus-ai";

interface AiConfidenceBadgeProps {
  confidence: number;
  confidenceLevel?: NexusAiConfidenceLevel;
  showPercentage?: boolean;
  size?: "sm" | "md";
}

interface ConfidenceAppearance {
  label: string;
  className: string;
  icon: typeof CheckCircle2;
}

function clampConfidence(
  confidence: number,
): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(
    1,
    Math.max(0, confidence),
  );
}

function resolveLevel(
  confidence: number,
  confidenceLevel?: NexusAiConfidenceLevel,
): NexusAiConfidenceLevel {
  if (confidenceLevel) {
    return confidenceLevel;
  }

  if (confidence >= 0.85) {
    return "high";
  }

  if (confidence >= 0.6) {
    return "medium";
  }

  return "low";
}

function getAppearance(
  level: NexusAiConfidenceLevel,
): ConfidenceAppearance {
  switch (level) {
    case "high":
      return {
        label: "Confianza alta",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
      };

    case "medium":
      return {
        label: "Confianza media",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
        icon: AlertTriangle,
      };

    case "low":
      return {
        label: "Confianza baja",
        className:
          "border-red-200 bg-red-50 text-red-700",
        icon: ShieldAlert,
      };

    default:
      return {
        label: "Confianza estimada",
        className:
          "border-slate-200 bg-slate-50 text-slate-700",
        icon: Sparkles,
      };
  }
}

export function AiConfidenceBadge({
  confidence,
  confidenceLevel,
  showPercentage = true,
  size = "md",
}: AiConfidenceBadgeProps) {
  const normalizedConfidence =
    clampConfidence(confidence);

  const level = resolveLevel(
    normalizedConfidence,
    confidenceLevel,
  );

  const appearance =
    getAppearance(level);

  const Icon = appearance.icon;

  const percentage = Math.round(
    normalizedConfidence * 100,
  );

  const sizeClassName =
    size === "sm"
      ? "gap-1.5 px-2 py-1 text-xs"
      : "gap-2 px-3 py-1.5 text-sm";

  const iconClassName =
    size === "sm"
      ? "h-3.5 w-3.5"
      : "h-4 w-4";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-semibold",
        appearance.className,
        sizeClassName,
      ].join(" ")}
      title={`${appearance.label}: ${percentage}%`}
    >
      <Icon
        className={iconClassName}
        aria-hidden="true"
      />

      <span>{appearance.label}</span>

      {showPercentage ? (
        <span className="font-bold">
          {percentage}%
        </span>
      ) : null}
    </span>
  );
}