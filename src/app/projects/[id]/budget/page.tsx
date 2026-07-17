import BudgetWorkspace from "@/components/budget/BudgetWorkspace";

interface BudgetPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BudgetPage({
  params,
}: BudgetPageProps) {
  const { id } = await params;

  return <BudgetWorkspace projectId={id} />;
}