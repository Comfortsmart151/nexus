import ProjectReviewWorkspace from "@/components/review/ProjectReviewWorkspace";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ProjectReviewWorkspace projectId={id}/>}
