'use client'

import ProjectCard from './project-card'
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
      id: string
      name: string | null
      profileImage: string | null
      role: string
      assignedTasks: number
      completedTasks: number
    }>
  }>
  employees: Array<{
    id: string
    name: string | null
  }>
  clients: Array<{
    id: string
    name: string
  }>
  userRole: string
}

export default function ProjectsGrid({ projects, employees, clients, userRole }: ProjectsGridProps) {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Projects</h1>
        {userRole === 'MANAGER' && <CreateProjectButton clients={clients} />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            members={project.members}
            availableEmployees={employees}
            userRole={userRole}
            onAddMember={addEmployeeToProject}
            onUpdateProject={async (projectId, data) => {
              await updateProject(projectId, data)
            }}
          />
        ))}
      </div>
    </div>
  )
} 