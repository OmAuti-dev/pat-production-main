'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createTask } from '../_actions/create-task'
import type { Employee, Project } from '../types'

interface TaskFormData {
  title: string
  projectId: string | null
  assignedToId: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: string
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  projects: Project[]
}

export function CreateTaskModal({ isOpen, onClose, employees, projects }: CreateTaskModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    projectId: null,
    assignedToId: null,
    priority: 'MEDIUM',
    deadline: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      title: '',
      projectId: null,
      assignedToId: null,
      priority: 'MEDIUM',
      deadline: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const deadline = formData.deadline ? new Date(formData.deadline) : null
      const result = await createTask({
        ...formData,
        deadline
      })
      
      if (result.success) {
        toast.success('Task created successfully')
        resetForm()
        onClose()
        // Real-time update will handle the UI refresh
      } else {
        toast.error(result.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm()
        onClose()
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={formData.projectId || 'no-project'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value === 'no-project' ? null : value }))}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-project">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select
              value={formData.assignedToId || 'unassigned'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value === 'unassigned' ? null : value }))}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name || 'Unnamed Employee'} ({employee.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                resetForm()
                onClose()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 