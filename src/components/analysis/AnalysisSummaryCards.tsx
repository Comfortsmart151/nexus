import {
  Boxes,
  BriefcaseBusiness,
  Building2,
  Truck,
  type LucideIcon,
} from "lucide-react";

interface AnalysisSummaryCardsProps {
  materialsTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  subcontractTotal: number;
}

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
}

export default function AnalysisSummaryCards({
  materialsTotal,
  laborTotal,
  equipmentTotal,
  subcontractTotal,
}: AnalysisSummaryCardsProps) {
  return (
    <div className="mt-8 grid gap-5 xl:grid-cols-4">
      <SummaryCard
        icon={Boxes}
        label="Materiales"
        value={materialsTotal}
      />

      <SummaryCard
        icon={BriefcaseBusiness}
        label="Mano de obra"
        value={laborTotal}
      />

      <SummaryCard
        icon={Truck}
        label="Equipos"
        value={equipmentTotal}
      />

      <SummaryCard
        icon={Building2}
        label="Subcontratos"
        value={subcontractTotal}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {formatCurrency(value)}
      </p>
    </article>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(value);
}