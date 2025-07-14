'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from 'date-fns'
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface ProjectMember {
  id: string
  name: string | null
  profileImage: string | null
  role: string
  assignedTasks: number
  completedTasks: number
}

interface Project {
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

interface ProjectDetailsWithMembersProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  members: ProjectMember[]
  availableEmployees: { id: string; name: string | null }[]
  userRole: string
  onAddMember: (employeeId: string) => Promise<void>
  onUpdateProject: (projectId: string, data: {
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
  }) => Promise<void>
}

export function ProjectDetailsWithMembers({
  project,
  isOpen,
  onClose,
  members,
  availableEmployees,
  userRole,
  onAddMember,
  onUpdateProject
}: ProjectDetailsWithMembersProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate
  })

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

  const handleUpdateProject = async () => {
    try {
      setLoading(true)
      await onUpdateProject(project.id, editForm)
      setIsEditing(false)
      toast.success('Project updated successfully')
    } catch (error) {
      console.error('Failed to update project:', error)
      toast.error('Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="text-xl font-semibold h-9"
              />
            ) : (
              <DialogTitle>{project.name}</DialogTitle>
            )}
            {userRole === 'MANAGER' && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DialogDescription>
            Project Details and Team Management
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Project Details - Left Side */}
          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Project description"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Input
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    placeholder="Project status"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        name: project.name,
                        description: project.description || '',
                        status: project.status,
                        startDate: project.startDate,
                        endDate: project.endDate
                      })
                    }}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateProject}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Updating...' : 'Update Project'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm text-muted-foreground mt-1">{project.status}</p>
                  </div>
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
                    <p className="text-sm text-muted-foreground mt-1">{project.client.name || 'No Client'}</p>
                  </div>
                </div>
              </div>
            )}
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
                            <AvatarImage src={undefined} />
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