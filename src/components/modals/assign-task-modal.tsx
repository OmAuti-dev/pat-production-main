'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  status: string
  priority: string
}

interface TeamMember {
  id: string
  name: string
  profileImage: string | null
}

interface AssignTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (taskId: string, userId: string, deadline: string, priority: string) => Promise<void>
  taskId: string
}

export function AssignTaskModal({ isOpen, onClose, onAssign, taskId }: AssignTaskModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [deadline, setDeadline] = useState<string>('')
  const [priority, setPriority] = useState<string>('MEDIUM')
  const [searchQuery, setSearchQuery] = useState('')
  const [isTaskComboboxOpen, setIsTaskComboboxOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchTeamMembers()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks/unassigned')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team-leader/members')
      const data = await response.json()
      setTeamMembers(data)
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssign = async () => {
    if (!selectedTask || !selectedMember || !deadline) {
      toast.error('Please select a task and a team member')
      return
    }

    try {
      setIsLoading(true)
      await onAssign(taskId, selectedMember, deadline, priority)
      toast.success('Task assigned successfully')
      onClose()
    } catch (error) {
      console.error('Error assigning task:', error)
      toast.error('Failed to assign task')
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Select a task and assign it to a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Task Search and Select */}
          <div className="grid gap-2">
            <Label htmlFor="task">Task</Label>
            <Popover open={isTaskComboboxOpen} onOpenChange={setIsTaskComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isTaskComboboxOpen}
                  className="justify-between"
                >
                  {selectedTask
                    ? tasks.find((task) => task.id === selectedTask)?.title
                    : "Select task..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>No tasks found.</CommandEmpty>
                  <CommandGroup>
                    {filteredTasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        value={task.id}
                        onSelect={() => {
                          setSelectedTask(task.id)
                          setIsTaskComboboxOpen(false)
                        }}
                      >
                        {task.title}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Team Member Select */}
          <div className="grid gap-2">
            <Label htmlFor="member">Assign To</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline Input */}
          <div className="grid gap-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={today}
            />
          </div>

          {/* Priority Select */}
          <div className="grid gap-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? 'Assigning...' : 'Assign Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 