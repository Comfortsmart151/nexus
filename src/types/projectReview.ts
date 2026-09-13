export type ReviewSeverity = "critical" | "warning" | "ok";
export interface ProjectReviewIssue {
  id: string;
  severity: ReviewSeverity;
  title: string;
  detail: string;
  href?: string;
  entity?: string;
}
export interface ProjectReviewResult {
  score: number;
  critical: number;
  warnings: number;
  passed: number;
  issues: ProjectReviewIssue[];
  generatedAt: string;
}
