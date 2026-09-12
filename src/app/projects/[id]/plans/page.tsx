import PlansWorkspace from "@/components/plans/PlansWorkspace";
export default async function PlansPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PlansWorkspace projectId={id}/>;}
