import AnalysisWorkspace from "@/components/analysis/AnalysisWorkspace";

interface AnalysisPageProps {
  params: Promise<{
    id: string;
    chapterId: string;
    itemId: string;
  }>;
}

export default async function AnalysisPage({
  params,
}: AnalysisPageProps) {
  const { id, chapterId, itemId } = await params;

  return (
    <AnalysisWorkspace
      projectId={id}
      chapterId={chapterId}
      itemId={itemId}
    />
  );
}