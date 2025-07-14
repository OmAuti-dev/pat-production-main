'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Users, FolderGit2, Mail } from 'lucide-react'

interface Team {
  id: string
  name: string
  description: string | null
  leader: {
    name: string
    email: string
    role: string
  }
  members: Array<{
    id: string
    name: string
    email: string
    role: string
    skills: string[]
  }>
  projects: Array<{
    id: string
    name: string
    status: string
  }>
}

interface TeamDetailsDialogProps {
  team: Team
  isOpen: boolean
  onClose: () => void
}

export function TeamDetailsDialog({ team, isOpen, onClose }: TeamDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
          <DialogDescription>
            {team.description || 'No description'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Team Leader Section */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Team Leader</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{team.leader.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{team.leader.email}</span>
                </div>
                <Badge>{team.leader.role}</Badge>
              </div>
            </div>

            <Separator />

            {/* Team Members Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Team Members</h3>
              <div className="space-y-4">
                {team.members.map((member) => (
                  <div key={member.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{member.name}</span>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{member.email}</span>
                    </div>
                    {member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {member.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Projects Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Projects</h3>
              <div className="space-y-2">
                {team.projects.length === 0 ? (
                  <p className="text-muted-foreground">No projects assigned</p>
                ) : (
                  team.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                        <span>{project.name}</span>
                      </div>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 