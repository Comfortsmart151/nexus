import ProjectApuOverview from "@/components/projects/ProjectApuOverview";
export default async function Page({params}:{params:Promise<{id:string}>}) { const {id}=await params; return <ProjectApuOverview projectId={id}/>; }
