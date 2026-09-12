import PlanAnalysisWorkspace from "@/components/plans/PlanAnalysisWorkspace";
export default async function Page({ params }: { params: Promise<{ id: string; planId: string }> }) {
  const { id, planId } = await params;
  return <PlanAnalysisWorkspace projectId={id} planId={planId} />;
}
