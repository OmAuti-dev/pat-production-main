'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { addEmployeeToProject, getProjectEmployees } from "../_actions/project"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from 'date-fns'

type ProjectDetailsModalProps = {
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
  isOpen: boolean
  onClose: () => void
  employees: { id: string; name: string | null }[]
  userRole: string
}

type ProjectEmployee = {
  id: string
  name: string | null
  profileImage: string | null
  role: string
  assignedTasks: number
  completedTasks: number
}

export default function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  employees,
  userRole,
}: ProjectDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [projectEmployees, setProjectEmployees] = useState<ProjectEmployee[]>([])

  useEffect(() => {
    if (isOpen) {
      loadProjectEmployees()
    }
  }, [isOpen, project.id])

  const loadProjectEmployees = async () => {
    try {
      const employees = await getProjectEmployees(project.id)
      setProjectEmployees(employees)
    } catch (error) {
      console.error('Error loading project employees:', error)
      toast.error('Failed to load team members')
    }
  }

  const handleAddEmployee = async (employeeId: string) => {
    try {
      setLoading(true)
      await addEmployeeToProject(project.id, employeeId)
      await loadProjectEmployees()
      toast.success('Team member added successfully')
    } catch (error) {
      console.error('Error adding employee:', error)
      toast.error('Failed to add team member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project.name}</DialogTitle>
          <DialogDescription>
            Project Details and Management
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Project Info */}
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            </div>
            <div className="flex justify-between">
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

          {/* Employee Management - Only for managers and team leaders */}
          {(userRole === 'MANAGER' || userRole === 'TEAM_LEADER') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Add Team Members</h3>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Available Employees</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {employees
                      .filter(emp => !projectEmployees.some(pe => pe.id === emp.id))
                      .map(employee => (
                        <Button
                          key={employee.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleAddEmployee(employee.id)}
                          disabled={loading}
                        >
                          {employee.name}
                        </Button>
                      ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Current Team Members</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4">
                    {projectEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.profileImage || ""} />
                          <AvatarFallback>
                            {employee.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.role}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.completedTasks}/{employee.assignedTasks} tasks
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 