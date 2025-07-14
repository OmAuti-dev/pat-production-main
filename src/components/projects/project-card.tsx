'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ProjectDetailsDialog } from './project-details-dialog'
import { addEmployeeToProject, getProjectWithTeam, getAvailableEmployees } from '@/app/(main)/(pages)/projects/_actions/project'
import { toast } from 'sonner'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    status: string
  }
  progress: number
  userRole: string
}

export function ProjectCard({ project, progress, userRole }: ProjectCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [members, setMembers] = useState<Array<{
    clerkId: string
    name: string | null
    role: string
    assignedTasks: number
    completedTasks: number
  }>>([])
  const [availableEmployees, setAvailableEmployees] = useState<Array<{
    clerkId: string
    name: string | null
  }>>([])

  const loadProjectDetails = async () => {
    try {
      const [projectData, employees] = await Promise.all([
        getProjectWithTeam(project.id),
        getAvailableEmployees(project.id)
      ])
      setMembers(projectData.members)
      setAvailableEmployees(employees)
    } catch (error) {
      console.error('Failed to load project details:', error)
      toast.error('Failed to load project details')
    }
  }

  const handleShowDetails = async () => {
    await loadProjectDetails()
    setShowDetails(true)
  }

  const handleAddMember = async (employeeClerkId: string) => {
    try {
      await addEmployeeToProject(project.id, employeeClerkId)
      await loadProjectDetails()
      toast.success('Team member added successfully')
    } catch (error) {
      console.error('Failed to add member:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add team member')
      }
    }
  }

  const handleUpdateProject = async (data: {
    name: string
    description: string | null
    status: string
  }) => {
    // Project updates are not implemented yet
    toast.error('Project updates are not implemented yet')
  }

  return (
    <>
      <Card 
        className="hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={handleShowDetails}
      >
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{project.name}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {project.status}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description || 'No description'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectDetailsDialog
        project={project}
        members={members}
        availableEmployees={availableEmployees}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onAddMember={handleAddMember}
        onUpdateProject={handleUpdateProject}
        userRole={userRole}
      />
    </>
  )
} 