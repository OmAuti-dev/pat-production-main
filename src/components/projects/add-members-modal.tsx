'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AddMembersModalProps {
  isOpen: boolean
  onClose: () => void
  availableEmployees: Array<{
    clerkId: string
    name: string | null
    assignedTasks?: number
    currentProject?: string | null
  }>
  onAddMembers: (employeeIds: string[]) => Promise<void>
}

export function AddMembersModal({
  isOpen,
  onClose,
  availableEmployees,
  onAddMembers
}: AddMembersModalProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const toggleEmployee = (employeeId: string) => {
    const newSelection = new Set(selectedEmployees)
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId)
    } else {
      newSelection.add(employeeId)
    }
    setSelectedEmployees(newSelection)
  }

  const toggleAll = () => {
    if (selectedEmployees.size === availableEmployees.length) {
      setSelectedEmployees(new Set())
    } else {
      setSelectedEmployees(new Set(availableEmployees.map(emp => emp.clerkId)))
    }
  }

  const handleAddMembers = async () => {
    if (selectedEmployees.size === 0) return
    
    try {
      setLoading(true)
      await onAddMembers(Array.from(selectedEmployees))
      onClose()
    } catch (error) {
      console.error('Failed to add members:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedEmployees.size === availableEmployees.length && availableEmployees.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Assigned Tasks</TableHead>
                <TableHead>Current Project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableEmployees.map((employee) => (
                <TableRow key={employee.clerkId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.has(employee.clerkId)}
                      onCheckedChange={() => toggleEmployee(employee.clerkId)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {employee.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{employee.assignedTasks || 0}</TableCell>
                  <TableCell>{employee.currentProject || 'None'}</TableCell>
                </TableRow>
              ))}
              {availableEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No available employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMembers} 
              disabled={selectedEmployees.size === 0 || loading}
            >
              Add Selected Members
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 