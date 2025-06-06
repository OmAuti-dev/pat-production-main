'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProjectMember {
  id: string
  name: string | null
  profileImage: string | null
  role: string
  assignedTasks: number
  completedTasks: number
}

interface ProjectMembersProps {
  members: ProjectMember[]
  selectedProjectId: string | 'all'
  onProjectChange: (value: string) => void
  projects: Array<{
    id: string
    name: string
  }>
}

export function ProjectMembers({ 
  members, 
  selectedProjectId, 
  onProjectChange,
  projects 
}: ProjectMembersProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Project Members</CardTitle>
        <Select
          value={selectedProjectId}
          onValueChange={onProjectChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between space-x-4 rounded-lg border p-4 dark:border-gray-800"
          >
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={member.profileImage || undefined} />
                <AvatarFallback>
                  {member.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.name || 'Anonymous'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.role}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex flex-col items-end">
                <span className="font-medium text-foreground">
                  {member.completedTasks}
                </span>
                <span>Completed</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-medium text-foreground">
                  {member.assignedTasks}
                </span>
                <span>Assigned</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 