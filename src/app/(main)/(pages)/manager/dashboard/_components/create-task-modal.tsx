'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, X, Plus, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { createTask } from '../_actions/create-task'
import { AnimatedModal } from '@/components/ui/animated-modal'
import { Badge } from '@/components/ui/badge'
import type { Employee, Project } from '../types'
import { skillCategories } from '@/config/skills'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TaskFormData {
  title: string
  projectId: string | null
  assignedToId: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: string
  description: string
  requiredSkills: string[]
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
    deadline: '',
    description: '',
    requiredSkills: []
  })
  const [skillSearch, setSkillSearch] = useState('')
  const [openSkills, setOpenSkills] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      title: '',
      projectId: null,
      assignedToId: null,
      priority: 'MEDIUM',
      deadline: '',
      description: '',
      requiredSkills: []
    })
    setSkillSearch('')
    setOpenSkills(false)
  }

  const handleAddSkill = (skill: string) => {
    if (!formData.requiredSkills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill]
      }))
    }
    setOpenSkills(false)
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(skill => skill !== skillToRemove)
    }))
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
    <AnimatedModal 
      isOpen={isOpen} 
      onClose={() => {
        if (!isSubmitting) {
          resetForm()
          onClose()
        }
      }}
      className="max-w-[425px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Create New Task</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            resetForm()
            onClose()
          }}
          disabled={isSubmitting}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter task title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Enter task description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label>Required Skills</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.requiredSkills.map((skill, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {skill}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveSkill(skill)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Popover open={openSkills} onOpenChange={setOpenSkills}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSkills}
                  className="w-full justify-between"
                  disabled={isSubmitting}
                >
                  Select skills...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search skills..."
                    value={skillSearch}
                    onValueChange={setSkillSearch}
                  />
                  <CommandEmpty>No skill found.</CommandEmpty>
                  {Object.entries(skillCategories).map(([category, skills]) => (
                    <CommandGroup key={category} heading={category}>
                      {skills
                        .filter(skill => 
                          skill.toLowerCase().includes(skillSearch.toLowerCase())
                        )
                        .map(skill => (
                          <CommandItem
                            key={skill}
                            value={skill}
                            onSelect={() => handleAddSkill(skill)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.requiredSkills.includes(skill)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {skill}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  ))}
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
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
        </div>
      </form>
    </AnimatedModal>
  )
} 