'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CalendarDays, MessageSquare, Users2 } from "lucide-react"
import { format } from "date-fns"
import { ProjectDetailsModal } from './project-details-modal'

interface ProjectCardProps {
  id: string
  title: string
  category: string
  description: string
  progress: number
  startDate: string
  endDate: string
  memberCount: number
  commentCount: number
  status: "In Progress" | "Completed" | "On Hold"
}

export function ProjectCard({
  id,
  title,
  category,
  description,
  progress,
  startDate,
  endDate,
  memberCount,
  commentCount,
  status
}: ProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const statusStyles = {
    "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500",
    "Completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500",
    "On Hold": "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500",
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  return (
    <>
      <Card 
        className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer border dark:border-gray-800"
        onClick={() => setIsModalOpen(true)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{category}</p>
              <h3 className="font-semibold text-xl mt-1 text-foreground">{title}</h3>
            </div>
            <span className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              statusStyles[status]
            )}>
              {status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{commentCount} comments</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{formatDate(startDate)} - {formatDate(endDate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={{
          id,
          title,
          category,
          description,
          progress,
          status,
          startDate,
          endDate,
          memberCount,
        }}
      />
    </>
  )
} 