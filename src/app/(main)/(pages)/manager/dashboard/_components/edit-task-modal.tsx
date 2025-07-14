'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { editTask } from '../_actions/task-actions'
import { format } from 'date-fns'
import { AnimatedModal } from '@/components/ui/animated-modal'
import { Badge } from '@/components/ui/badge'
import type { Task, Employee, Project } from '../types'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  employees: Employee[]
  projects: Project[]
}

export function EditTaskModal({ isOpen, onClose, task, employees, projects }: EditTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    deadline: '',
    assignedToId: null as string | null,
    projectId: null as string | null,
    requiredSkills: [] as string[]
  })
  const [newSkill, setNewSkill] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens with task data or closes
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || '',
        priority: task.priority || '',
        deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
        assignedToId: task.assignedToId,
        projectId: task.projectId,
        requiredSkills: task.requiredSkills || []
      })
    } else {
      // Reset form when closing
      setFormData({
        title: '',
        description: '',
        status: '',
        priority: '',
        deadline: '',
        assignedToId: null,
        projectId: null,
        requiredSkills: []
      })
      setNewSkill('')
    }
  }, [task, isOpen])

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.requiredSkills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await editTask({
        id: task.id,
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline) : null
      })

      if (result.success) {
        toast.success('Task updated successfully')
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

  // Handle form field changes
  const handleChange = (field: string, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AnimatedModal 
      isOpen={isOpen} 
      onClose={() => {
        if (!isSubmitting) {
          onClose()
        }
      }}
      className="max-w-[425px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Edit Task</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isSubmitting}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Task title"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Task description"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleChange('status', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => handleChange('priority', value)}
            disabled={isSubmitting}
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
        
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => handleChange('deadline', e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Select 
            value={formData.assignedToId || 'unassigned'} 
            onValueChange={(value) => handleChange('assignedToId', value === 'unassigned' ? null : value)}
            disabled={isSubmitting}
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
            value={formData.projectId || 'no-project'} 
            onValueChange={(value) => handleChange('projectId', value === 'no-project' ? null : value)}
            disabled={isSubmitting}
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

        <div className="space-y-2">
          <Label>Required Skills</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a required skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddSkill()
                }
              }}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddSkill}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.requiredSkills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveSkill(skill)}
              >
                {skill}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
                Updating...
              </>
            ) : (
              'Update Task'
            )}
          </Button>
        </div>
      </form>
    </AnimatedModal>
  )
} 