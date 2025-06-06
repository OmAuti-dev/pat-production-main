'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ProjectDetailsModal from './project-details-modal'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type Project = {
  id: string
  name: string
  description: string
  type: string
  progress: number
  client?: {
    name: string
  }
}

type ProjectCardProps = {
  project: Project
  userRole: string
  employees: { id: string; name: string }[]
}

export default function ProjectCard({ project, userRole, employees }: ProjectCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-xl">{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <span className="text-sm font-medium">{project.type}</span>
          </div>
          {project.client && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="text-sm font-medium">{project.client.name}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setIsOpen(true)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
      <ProjectDetailsModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        project={{
          ...project,
          client: project.client || { name: 'Unassigned' }
        }}
        userRole={userRole}
        employees={employees}
      />
    </Card>
  )
} 