import Link from "next/link";
import { Building2, MapPin, UserRound } from "lucide-react";

import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          <Building2 className="h-6 w-6" />
        </div>

        <div>
          <h3 className="font-semibold text-slate-950">{project.name}</h3>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <UserRound className="h-4 w-4" />
              {project.client}
            </span>

            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {project.location}
            </span>
          </div>
        </div>
      </div>

      <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-700">
        {project.projectType}
      </span>
    </Link>
  );
}