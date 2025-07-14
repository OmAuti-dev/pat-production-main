import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { AddMembersModal } from './add-members-modal'

interface ProjectDetailsDialogProps {
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
    clerkId: string
    name: string | null
    role: string
    assignedTasks: number
    completedTasks: number
  }>
  availableEmployees: Array<{
    clerkId: string
    name: string | null
  }>
  userRole: string
  isOpen: boolean
  onClose: () => void
  onAddMember: (employeeClerkId: string) => Promise<void>
  onUpdateProject: (data: {
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
  }) => Promise<void>
}

export function ProjectDetailsDialog({
  project,
  members,
  availableEmployees,
  userRole,
  isOpen,
  onClose,
  onAddMember,
  onUpdateProject
}: ProjectDetailsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)

  const handleAddMembers = async (employeeIds: string[]) => {
    try {
      setLoading(true)
      await Promise.all(employeeIds.map(id => onAddMember(id)))
      toast.success('Team members added successfully')
    } catch (error) {
      console.error('Failed to add members:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add team members')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{project.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Project Details - Left Side */}
            <div>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>

                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground mt-1">{project.status}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.startDate ? format(project.startDate, 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.endDate ? format(project.endDate, 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label>Client</Label>
                    <p className="text-sm text-muted-foreground mt-1">{project.client?.name || 'No Client'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Members - Right Side */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Project Members</h3>
                {(userRole === 'MANAGER' || userRole === 'TEAM_LEADER') && availableEmployees.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddMembers(true)}
                    disabled={loading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Members
                  </Button>
                )}
              </div>

              <div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No project members yet</p>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.clerkId}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={undefined} />
                              <AvatarFallback>
                                {member.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name || 'Unnamed Member'}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>{member.completedTasks}/{member.assignedTasks} tasks</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        availableEmployees={availableEmployees}
        onAddMembers={handleAddMembers}
      />
    </>
  )
} 