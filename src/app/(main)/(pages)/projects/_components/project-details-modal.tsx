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

type ProjectDetailsModalProps = {
  project: {
    id: string
    name: string
    description: string
    type: string
    progress: number
    client: {
      name: string
    }
  }
  isOpen: boolean
  onClose: () => void
  employees: { id: string; name: string }[]
  userRole: string
}

type ProjectEmployee = {
  clerkId: string
  name: string | null
  profileImage: string | null
}

export default function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  employees,
  userRole,
}: ProjectDetailsModalProps) {
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [projectEmployees, setProjectEmployees] = useState<ProjectEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjectEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getProjectEmployees(project.id)
      if (Array.isArray(response)) {
        setProjectEmployees(response as ProjectEmployee[])
      } else {
        setProjectEmployees([])
      }
    } catch (error) {
      console.error('Error loading project employees:', error)
      setError('Failed to load team members')
      toast.error("Failed to load team members")
      setProjectEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadProjectEmployees()
    } else {
      setProjectEmployees([])
      setError(null)
      setLoading(false)
    }
  }, [isOpen, project.id])

  const onAddEmployee = async (employeeId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await addEmployeeToProject(project.id, employeeId)
      if (Array.isArray(response)) {
        setProjectEmployees(response as ProjectEmployee[])
      } else {
        setProjectEmployees([])
      }
      toast.success("Employee added to project")
    } catch (error) {
      console.error('Error adding employee:', error)
      setError('Failed to add team member')
      toast.error("Failed to add team member")
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
                <Label>Type</Label>
                <p className="text-sm text-muted-foreground mt-1">{project.type}</p>
              </div>
              <div>
                <Label>Progress</Label>
                <p className="text-sm text-muted-foreground mt-1">{project.progress}%</p>
              </div>
              <div>
                <Label>Client</Label>
                <p className="text-sm text-muted-foreground mt-1">{project.client.name}</p>
              </div>
            </div>
          </div>

          {/* Employee Management - Only for managers and team leaders */}
          {(userRole === 'MANAGER' || userRole === 'TEAM_LEADER') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <Button 
                  onClick={() => setShowAddEmployee(!showAddEmployee)} 
                  size="sm"
                  disabled={loading}
                >
                  {showAddEmployee ? 'Cancel' : 'Add Employees'}
                </Button>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              {showAddEmployee && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Available Employees</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-4">
                      {loading ? (
                        <p className="text-center text-muted-foreground">Loading...</p>
                      ) : employees
                        .filter(emp => !projectEmployees.some(pe => pe.clerkId === emp.id))
                        .map(employee => (
                          <div
                            key={employee.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="" />
                                <AvatarFallback>
                                  {employee.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{employee.name}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAddEmployee(employee.id)}
                              disabled={loading}
                            >
                              {loading ? 'Adding...' : 'Add'}
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Current Team Members</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4">
                    {projectEmployees.map((employee) => (
                      <div
                        key={employee.clerkId}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.profileImage || ""} />
                          <AvatarFallback>
                            {employee.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{employee.name}</span>
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