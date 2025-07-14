'use client'

import { useState } from 'react'
import {
  AnimatedDialog,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
} from '@/components/ui/animated-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteProject } from '../_actions/project'
import { useRouter } from 'next/navigation'
import { Separator } from "@/components/ui/separator"

interface ProjectDetailsDialogProps {
  project: {
    id: string
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
    client: {
      name: string | null
    }
  }
  members: Array<{
    id: string
    name: string | null
    role: string
    assignedTasks: number
    completedTasks: number
  }>
  availableEmployees: Array<{
    id: string
    name: string | null
  }>
  userRole: string
  isOpen: boolean
  onClose: () => void
  onAddMember: (employeeId: string) => Promise<void>
  onUpdateProject: (data: {
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
  }) => Promise<void>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
}

export function ProjectDetailsDialog({
  project,
  members,
  availableEmployees,
  userRole,
  isOpen,
  onClose,
  onAddMember,
  onUpdateProject
}: ProjectDetailsDialogProps) {
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const handleAddMember = async (employeeId: string) => {
    try {
      setLoading(true)
      await onAddMember(employeeId)
      toast.success('Team member added successfully')
      setShowAddEmployee(false)
    } catch (error) {
      console.error('Failed to add member:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add team member')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    try {
      setLoading(true)
      await deleteProject(project.id)
      toast.success('Project deleted successfully')
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  // Filter out employees who are already members
  const availableToAdd = availableEmployees.filter(
    employee => !members.some(member => member.id === employee.id)
  )

  return (
    <>
      <AnimatedDialog open={isOpen} onOpenChange={onClose}>
        <AnimatedDialogContent className="max-w-4xl">
          <AnimatedDialogHeader>
            <AnimatedDialogTitle>{project.name}</AnimatedDialogTitle>
          </AnimatedDialogHeader>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6"
          >
            {/* Project Details - Left Side */}
            <motion.div variants={itemVariants}>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>

                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground mt-1">{project.status}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.startDate ? format(project.startDate, 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.endDate ? format(project.endDate, 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label>Client</Label>
                    <p className="text-sm text-muted-foreground mt-1">{project.client?.name || 'No Client'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Team Members - Right Side */}
            <motion.div variants={itemVariants}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  {(userRole === 'MANAGER' || userRole === 'TEAM_LEADER') && availableToAdd.length > 0 && (
                    <Button 
                      onClick={() => setShowAddEmployee(!showAddEmployee)} 
                      size="sm"
                      disabled={loading}
                    >
                      {showAddEmployee ? 'Cancel' : 'Add Member'}
                    </Button>
                  )}
                </div>

                {showAddEmployee && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <h4 className="text-sm font-medium">Available Employees</h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {availableToAdd.map((employee) => (
                          <motion.div
                            key={employee.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              disabled={loading}
                              onClick={() => handleAddMember(employee.id)}
                            >
                              {employee.name || 'Unnamed Employee'}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-2">Current Team Members</h4>
                  <ScrollArea className="h-[300px]">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4"
                    >
                      {members.map((member, index) => (
                        <motion.div
                          key={member.id}
                          variants={itemVariants}
                          custom={index}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {member.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name || 'Unnamed Member'}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>{member.completedTasks}/{member.assignedTasks} tasks</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </ScrollArea>
                </div>
              </div>
            </motion.div>

            {/* Delete Project Section */}
            {userRole === 'MANAGER' && (
              <motion.div variants={itemVariants}>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatedDialogContent>
      </AnimatedDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action will remove all tasks and team member assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 