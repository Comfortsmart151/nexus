import ItemWorkspace from "@/components/items/ItemWorkspace";

interface ItemsPageProps {
  params: Promise<{
    id: string;
    chapterId: string;
  }>;
}

export default async function ItemsPage({
  params,
}: ItemsPageProps) {
  const { id, chapterId } = await params;

  return (
    <ItemWorkspace
      projectId={id}
      chapterId={chapterId}
    />
  );
}