'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

type Project = {
  id: string
  name: string
}

export default function ProjectSelector({ projects }: { projects: Project[] }) {
  const router = useRouter()

  const handleProjectChange = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  return (
    <Select onValueChange={handleProjectChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 