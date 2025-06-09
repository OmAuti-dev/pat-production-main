import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'

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
  isOpen: boolean
  onClose: () => void
  onAddMember: (employeeId: string) => Promise<void>
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
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddMember = async (employeeId: string) => {
    try {
      setLoading(true)
      await onAddMember(employeeId)
      setShowAddEmployee(false)
    } catch (error) {
      console.error('Failed to add member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
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

          {/* Team Members - Right Side */}
          <div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team Members</h3>
                {(userRole === 'MANAGER' || userRole === 'TEAM_LEADER') && (
                  <Button 
                    onClick={() => setShowAddEmployee(!showAddEmployee)} 
                    size="sm"
                    disabled={loading}
                  >
                    {showAddEmployee ? 'Cancel' : 'Add Member'}
                  </Button>
                )}
              </div>

              {showAddEmployee && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Available Employees</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {availableEmployees.map((employee) => (
                        <Button
                          key={employee.id}
                          variant="ghost"
                          className="w-full justify-start"
                          disabled={loading}
                          onClick={() => handleAddMember(employee.id)}
                        >
                          {employee.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Current Team Members</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profileImage || ""} />
                            <AvatarFallback>
                              {member.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>{member.completedTasks}/{member.assignedTasks} tasks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 