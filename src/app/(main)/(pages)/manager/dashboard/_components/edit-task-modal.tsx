'use client'

import { useState, useEffect } from 'react'
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
import { editTask } from '../_actions/task-actions'
import { format } from 'date-fns'
import type { Task, Employee, Project } from '../types'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  employees: Employee[]
  projects: Project[]
}

export function EditTaskModal({ isOpen, onClose, task, employees, projects }: EditTaskModalProps) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [deadline, setDeadline] = useState('')
  const [assignedToId, setAssignedToId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setStatus(task.status)
      setPriority(task.priority)
      setDeadline(task.deadline ? format(task.deadline, 'yyyy-MM-dd') : '')
      setAssignedToId(task.assignedToId)
      setProjectId(task.projectId)
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    try {
      setIsSubmitting(true)
      const result = await editTask({
        id: task.id,
        title,
        status,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        assignedToId,
        projectId
      })

      if (result.success) {
        toast.success('Task updated successfully')
        router.refresh()
        onClose()
      } else {
        toast.error(result.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus} required>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority} required>
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
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select 
              value={assignedToId || 'unassigned'} 
              onValueChange={(value) => setAssignedToId(value === 'unassigned' ? null : value)}
            >
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select assignee" />
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
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select 
              value={projectId || 'no-project'} 
              onValueChange={(value) => setProjectId(value === 'no-project' ? null : value)}
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
                  Updating...
                </>
              ) : (
                'Update Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 