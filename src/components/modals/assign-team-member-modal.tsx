'use client'

import { useState } from 'react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  name: string
  profileImage: string | null
  role: string
}

interface AssignTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (taskId: string, userId: string) => Promise<void>
  taskId: string
  taskTitle: string
  teamMembers: TeamMember[]
}

export function AssignTeamMemberModal({
  isOpen,
  onClose,
  onAssign,
  taskId,
  taskTitle,
  teamMembers
}: AssignTeamMemberModalProps) {
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Filter only employee team members
  const employeeMembers = teamMembers.filter(member => member.role === 'EMPLOYEE')

  const handleAssign = async () => {
    if (!selectedMember) {
      toast.error('Please select a team member')
      return
    }

    try {
      setIsLoading(true)
      await onAssign(taskId, selectedMember)
      toast.success('Task assigned successfully')
      onClose()
    } catch (error) {
      console.error('Error assigning task:', error)
      toast.error('Failed to assign task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Select a team member to assign the task "{taskTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {employeeMembers.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={member.id}
                    className="flex items-center gap-2 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profileImage || ''} />
                        <AvatarFallback>
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {employeeMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No employee team members available
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading || employeeMembers.length === 0}>
            {isLoading ? 'Assigning...' : 'Assign Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 