'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react'
import type { Task } from '@/app/(main)/(pages)/manager/dashboard/types'

export interface TaskActionsMenuProps {
  task?: Task
  onEdit?: () => void
  onDelete?: () => void
  onUnassign?: () => void
  onAssign?: () => void
}

export function TaskActionsMenu({ 
  task, 
  onEdit, 
  onDelete, 
  onUnassign,
  onAssign 
}: TaskActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {onAssign && (
          <DropdownMenuItem onClick={onAssign}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign
          </DropdownMenuItem>
        )}
        {task?.assignedTo && onUnassign && (
          <DropdownMenuItem onClick={onUnassign}>
            <UserMinus className="mr-2 h-4 w-4" />
            Unassign
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem 
            onClick={onDelete}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 