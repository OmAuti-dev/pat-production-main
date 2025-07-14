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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { updateTeam } from '../_actions/update-team'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  description: string | null
  leader: {
    name: string
    email: string
    role: string
  }
  members: Array<{
    id: string
    name: string
    email: string
    role: string
    skills: string[]
  }>
}

interface Employee {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
}

interface EditTeamDialogProps {
  team: Team
  availableEmployees: Employee[]
  isOpen: boolean
  onClose: () => void
}

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  leaderId: z.string().min(1, 'Team leader is required'),
  memberIds: z.array(z.string()).optional()
})

type TeamFormValues = z.infer<typeof teamSchema>

export function EditTeamDialog({ team, availableEmployees, isOpen, onClose }: EditTeamDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    team.members.map(member => member.id)
  )
  const router = useRouter()

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team.name,
      description: team.description || '',
      leaderId: team.leader.id,
      memberIds: team.members.map(member => member.id)
    }
  })

  const onSubmit = async (data: TeamFormValues) => {
    try {
      setIsSubmitting(true)
      const result = await updateTeam({
        id: team.id,
        name: data.name,
        description: data.description || '',
        leaderId: data.leaderId,
        memberIds: selectedMembers
      })

      if (result.success) {
        toast.success('Team updated successfully')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update team')
      }
    } catch (error) {
      console.error('Error updating team:', error)
      toast.error('Failed to update team')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMemberSelect = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(prev => prev.filter(id => id !== memberId))
    } else {
      setSelectedMembers(prev => [...prev, memberId])
    }
  }

  const getEmployeeName = (id: string) => {
    const employee = availableEmployees.find(emp => emp.id === id)
    return employee?.name || 'Unknown'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team details, leader, and members.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter team name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter team description" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Leader</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team leader" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableEmployees
                        .filter(emp => emp.role === 'TEAM_LEADER')
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Team Members</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedMembers.map((memberId) => (
                  <Badge
                    key={memberId}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleMemberSelect(memberId)}
                  >
                    {getEmployeeName(memberId)}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <Select onValueChange={handleMemberSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Add team members" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees
                    .filter(emp => emp.role === 'EMPLOYEE' && !selectedMembers.includes(emp.id))
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                  'Update Team'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 