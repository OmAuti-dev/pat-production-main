'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CalendarDays, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ProjectDetailsModal } from './project-details-modal'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    progress: number
    tasks: {
      id: string
      status: string
    }[]
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const statusStyles = {
    "IN_PROGRESS": "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500",
    "DONE": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500",
    "PENDING": "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500",
    "PLANNING": "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-500"
  }

  const formatDate = (date: Date | null) => {
    return date ? format(date, 'MMM d, yyyy') : 'Not set'
  }

  const completedTasks = project.tasks.filter(task => task.status === 'DONE').length

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-xl text-foreground">{project.name}</h3>
            </div>
            <span className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              statusStyles[project.status as keyof typeof statusStyles] || "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-500"
            )}>
              {project.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {project.description || 'No description'}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{completedTasks}/{project.tasks.length} tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={project}
      />
    </>
  )
} 