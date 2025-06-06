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

interface Employee {
  id: string
  name: string | null
  role: string
}

interface Project {
  id: string
  name: string
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  projects: Project[]
}

export function CreateTaskModal({ isOpen, onClose, employees, projects }: CreateTaskModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    projectId: '',
    assignedToId: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    deadline: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      title: '',
      projectId: '',
      assignedToId: '',
      priority: 'MEDIUM',
      deadline: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.title.trim()) {
      toast.error('Please enter a task title')
      return
    }
    if (!formData.projectId) {
      toast.error('Please select a project')
      return
    }
    if (!formData.assignedToId) {
      toast.error('Please select an employee')
      return
    }
    if (!formData.deadline) {
      toast.error('Please select a deadline')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await createTask({
        title: formData.title.trim(),
        priority: formData.priority,
        deadline: new Date(formData.deadline),
        assignedToId: formData.assignedToId,
        projectId: formData.projectId
      })

      if (result.success) {
        toast.success('Task created successfully')
        resetForm()
        router.refresh()
        onClose()
      } else {
        toast.error(result.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task. Please try again.')
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
              value={formData.projectId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
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
              value={formData.assignedToId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
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