export type PlanAnalysisStatus = "pending" | "analyzing" | "review" | "approved" | "error";
export type ProposalDecision = "pending" | "accepted" | "rejected";

export interface PlanMeasurement {
  id: string;
  label: string;
  unit: string;
  quantity: number;
  source: string;
  confidence: "high" | "medium" | "low";
}

export interface PlanDetectedSpace {
  name: string;
  count: number;
}

export interface PlanGeometrySummary {
  sourcePage: number;
  elevationPage?: number;
  overallLength?: number;
  overallWidth?: number;
  clearWidth?: number;
  clearHeight?: number;
  horizontalSegments: number[];
  grossArea?: number;
  netFloorArea?: number;
  exteriorPerimeter?: number;
  internalPartitionLength?: number;
  grossExteriorWallArea?: number;
  spaces: PlanDetectedSpace[];
  confidence: "high" | "medium" | "low";
  notes: string[];
}

export interface PlanItemProposal {
  id: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  rationale: string;
  confidence: "high" | "medium" | "low";
  decision: ProposalDecision;
  /** Holgura/desperdicio manual aplicado a la cantidad detectada antes de incorporar. */
  wastePercentage?: number;
  /** Ajuste manual sobre el precio unitario calculado por el APU. */
  priceAdjustmentPercentage?: number;
  manualNote?: string;
}

export interface PlanAnalysis {
  planId: string;
  projectId: string;
  status: PlanAnalysisStatus;
  discipline: string;
  scale: string;
  level: string;
  pages: number;
  extractedText: string;
  geometry?: PlanGeometrySummary;
  measurements: PlanMeasurement[];
  proposals: PlanItemProposal[];
  warnings: string[];
  analyzedAt: string;
  approvedAt?: string;
}
