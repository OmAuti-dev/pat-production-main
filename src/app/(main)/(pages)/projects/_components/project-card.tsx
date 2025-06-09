'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { ProjectDetailsDialog } from '@/components/projects/project-details-dialog'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    client: {
      name: string | null
    }
  }
  members: Array<{
    id: string
    name: string | null
    profileImage: string | null
    role: string
    assignedTasks: number
    completedTasks: number
  }>
  availableEmployees: Array<{
    id: string
    name: string | null
  }>
  userRole: string
  onAddMember: (projectId: string, employeeId: string) => Promise<void>
  onUpdateProject: (projectId: string, data: {
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
  }) => Promise<void>
}

export default function ProjectCard({
  project,
  members,
  availableEmployees,
  userRole,
  onAddMember,
  onUpdateProject
}: ProjectCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-sm text-muted-foreground">{project.client?.name || 'No Client'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDetailsOpen(true)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Status</Label>
            <p className="text-sm text-muted-foreground">{project.status}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Team ({members.length})</Label>
            <div className="flex -space-x-2 mt-2">
              {members.slice(0, 5).map((member) => (
                <Avatar key={member.id} className="border-2 border-background">
                  <AvatarImage src={member.profileImage || ''} />
                  <AvatarFallback>
                    {member.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm">
                  +{members.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>

        <ProjectDetailsDialog
          project={project}
          members={members}
          availableEmployees={availableEmployees}
          userRole={userRole}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onAddMember={(employeeId: string) => onAddMember(project.id, employeeId)}
          onUpdateProject={(data: {
            name: string
            description: string | null
            status: string
            startDate: Date | null
            endDate: Date | null
          }) => onUpdateProject(project.id, data)}
        />
      </CardContent>
    </Card>
  )
} 