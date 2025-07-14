'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import type { ProjectMember } from '../actions'

interface ProjectMembersProps {
  members: ProjectMember[]
}

export function ProjectMembers({ members }: ProjectMembersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {member.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-muted-foreground">
                  {member.completedTasks}/{member.assignedTasks} tasks
                </div>
                <Progress 
                  value={member.assignedTasks > 0 ? (member.completedTasks / member.assignedTasks) * 100 : 0} 
                  className="h-2 w-24"
                />
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No team members found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 