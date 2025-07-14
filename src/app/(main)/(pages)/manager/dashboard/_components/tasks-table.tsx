'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, UserMinus, AlertCircle } from 'lucide-react'
import { Task } from '../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { TaskActionsMenu } from '@/components/task-actions-menu'
import { startTask } from '../_actions/task-actions'
import { toast } from 'sonner'

interface TasksTableProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onUnassign: (taskId: string) => void
  selectedProject?: string
  onSelectedTasksChange?: (selectedTasks: Set<string>) => void
}

const statusColorMap: Record<string, string> = {
  'TODO': 'bg-yellow-500/20 text-yellow-500',
  'IN_PROGRESS': 'bg-blue-500/20 text-blue-500',
  'DONE': 'bg-green-500/20 text-green-500'
}

const priorityColorMap: Record<string, string> = {
  'LOW': 'bg-green-500/20 text-green-500',
  'MEDIUM': 'bg-yellow-500/20 text-yellow-500',
  'HIGH': 'bg-red-500/20 text-red-500'
}

export function TasksTable({ 
  tasks, 
  onEdit, 
  onDelete, 
  onUnassign, 
  selectedProject,
  onSelectedTasksChange 
}: TasksTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const handleRowSelect = (taskId: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedRows(newSelected)
    onSelectedTasksChange?.(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === tasks.length) {
      setSelectedRows(new Set())
      onSelectedTasksChange?.(new Set())
    } else {
      const newSelected = new Set(tasks.map(task => task.id))
      setSelectedRows(newSelected)
      onSelectedTasksChange?.(newSelected)
    }
  }

  const handleStartTask = async (taskId: string) => {
    try {
      const result = await startTask(taskId)
      if (!result.success) {
        toast.error(result.error || 'Failed to start task')
      }
    } catch (error) {
      toast.error('Failed to start task')
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {selectedProject && selectedProject !== 'all' && (
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRows.size === tasks.length && tasks.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all tasks"
                />
              </TableHead>
            </TableRow>
          )}
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Required Skills</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              {selectedProject && selectedProject !== 'all' && (
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(task.id)}
                    onCheckedChange={() => handleRowSelect(task.id)}
                    aria-label={`Select task ${task.title}`}
                  />
                </TableCell>
              )}
              <TableCell>{task.title}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    task.status === 'DONE'
                      ? 'default'
                      : task.status === 'IN_PROGRESS'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    task.priority === 'HIGH'
                      ? 'destructive'
                      : task.priority === 'MEDIUM'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {task.assignedTo.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {task.assignedTo.name || 'Unnamed User'}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {task.project ? (
                  task.project.name
                ) : (
                  <span className="text-muted-foreground">No Project</span>
                )}
              </TableCell>
              <TableCell>
                {task.deadline ? (
                  format(new Date(task.deadline), 'MMM d, yyyy')
                ) : (
                  <span className="text-muted-foreground">No deadline</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {task.requiredSkills?.length > 0 ? (
                    task.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No required skills</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <TaskActionsMenu
                  task={task}
                  onEdit={() => onEdit(task)}
                  onDelete={() => onDelete(task.id)}
                  onUnassign={() => onUnassign(task.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No tasks available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 