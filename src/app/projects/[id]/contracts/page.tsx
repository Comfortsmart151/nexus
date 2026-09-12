import ContractsWorkspace from "@/components/contracts/ContractsWorkspace";
export default async function ContractsPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ContractsWorkspace projectId={id}/>;}
