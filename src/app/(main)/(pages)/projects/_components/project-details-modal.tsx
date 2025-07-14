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
import { addEmployeeToProject, getProjectEmployees, deleteProject } from "../_actions/project"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from 'date-fns'
import { Separator } from "@/components/ui/separator"
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'

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
  employees: { clerkId: string; name: string | null }[]
  userRole: string
}

type ProjectEmployee = {
  clerkId: string
  name: string | null
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

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

  const handleAddEmployee = async (employeeClerkId: string) => {
    try {
      setLoading(true)
      await addEmployeeToProject(project.id, employeeClerkId)
      await loadProjectEmployees()
      toast.success('Team member added successfully')
    } catch (error) {
      console.error('Error adding employee:', error)
      toast.error('Failed to add team member')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    try {
      setLoading(true)
      await deleteProject(project.id)
      toast.success('Project deleted successfully')
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
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

            {/* Employee Management - Only for managers */}
            {userRole === 'MANAGER' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Add Team Members</h3>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Available Employees</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {employees
                        .filter(emp => !projectEmployees.some(pe => pe.clerkId === emp.clerkId))
                        .map(employee => (
                          <Button
                            key={employee.clerkId}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => handleAddEmployee(employee.clerkId)}
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
                          key={employee.clerkId}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-8 w-8">
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

            {/* Delete Project Section - Only for managers */}
            {userRole === 'MANAGER' && (
              <>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action will remove all tasks and team member assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 