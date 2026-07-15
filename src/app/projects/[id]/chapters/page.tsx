import ChapterWorkspace from "@/components/chapters/ChapterWorkspace";

interface ChaptersPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChaptersPage({
  params,
}: ChaptersPageProps) {
  const { id } = await params;

  return <ChapterWorkspace projectId={id} />;
}