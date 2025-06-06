'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, UserMinus } from 'lucide-react'
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

interface TasksTableProps {
  tasks: Task[]
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
  onUnassign: (taskId: string) => void
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

export function TasksTable({ tasks, onEdit, onDelete, onUnassign }: TasksTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks)
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId)
    } else {
      newSelection.add(taskId)
    }
    setSelectedTasks(newSelection)
  }

  const toggleAllTasks = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)))
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedTasks.size === tasks.length && tasks.length > 0}
                onCheckedChange={toggleAllTasks}
                aria-label="Select all tasks"
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox
                  checked={selectedTasks.has(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  aria-label={`Select task ${task.title}`}
                />
              </TableCell>
              <TableCell>{task.title}</TableCell>
              <TableCell>
                <Badge className={statusColorMap[task.status] || 'bg-gray-500/20 text-gray-500'}>
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={priorityColorMap[task.priority] || 'bg-gray-500/20 text-gray-500'}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignedTo.profileImage || undefined} />
                      <AvatarFallback>
                        {task.assignedTo.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.assignedTo.name || 'Unknown'}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Not Assigned</span>
                )}
              </TableCell>
              <TableCell>
                {task.deadline ? format(new Date(task.deadline), 'MMM d, yyyy') : 'No deadline'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(task.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUnassign(task.id)}>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unassign
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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