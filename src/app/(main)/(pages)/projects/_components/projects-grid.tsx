'use client'

import { ProjectCard } from '@/components/projects/project-card'
import CreateProjectButton from './create-project-button'
import { addEmployeeToProject, updateProject } from '../_actions/project'

interface ProjectsGridProps {
  projects: Array<{
    id: string
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    client: {
      name: string | null
    }
    members: Array<{
      clerkId: string
      name: string | null
      role: string
      assignedTasks: number
      completedTasks: number
    }>
  }>
  employees: Array<{
    clerkId: string
    name: string | null
  }>
  clients: Array<{
    clerkId: string
    name: string
  }>
  userRole: string
}

export default function ProjectsGrid({ projects, employees, clients, userRole }: ProjectsGridProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Projects</h1>
        {userRole === 'MANAGER' && (
          <CreateProjectButton clients={clients} />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          // Calculate progress based on completed tasks
          const completedTasks = project.members.reduce((sum, member) => sum + member.completedTasks, 0)
          const totalTasks = project.members.reduce((sum, member) => sum + member.assignedTasks, 0)
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          return (
          <ProjectCard
            key={project.id}
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status
              }}
              progress={progress}
            userRole={userRole}
          />
          )
        })}
      </div>
    </div>
  )
} 