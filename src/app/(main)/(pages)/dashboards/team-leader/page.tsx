'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Filter, Plus, MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { AssignTaskModal } from '@/components/modals/assign-task-modal'
import { AssignTeamMemberModal } from '@/components/modals/assign-team-member-modal'
import { TaskActionsMenu } from '@/components/task-actions-menu'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  deadline: string | null
  assignedTo: {
    id: string
    name: string
    profileImage: string | null
    role: string
  } | null
  project: {
    id: string
    name: string
    team: {
      id: string
      name: string
      members: Array<{
        id: string
        name: string
        role: string
      }>
    } | null
  } | null
}

interface TeamMember {
  id: string
  name: string
  profileImage: string | null
  role: string
}

interface TeamChat {
  id: string
  sender: {
    name: string
    profileImage: string | null
  }
  message: string
  timestamp: Date
}

export default function TeamLeaderDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamChat, setTeamChat] = useState<TeamChat[]>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<{
    id: string;
    title: string;
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch tasks
      const tasksResponse = await fetch('/api/team-leader/tasks')
      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const tasksData = await tasksResponse.json()
      setTasks(tasksData)

      // Fetch team members
      const membersResponse = await fetch('/api/team-leader/members')
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch team members')
      }
      const membersData = await membersResponse.json()
      setTeamMembers(membersData)

      // Fetch team chat
      const chatResponse = await fetch('/api/team-leader/chat')
      if (!chatResponse.ok) {
        throw new Error('Failed to fetch team chat')
      }
      const chatData = await chatResponse.json()
      setTeamChat(chatData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/10 text-green-500'
      case 'in progress':
        return 'bg-blue-500/10 text-blue-500'
      case 'pending':
      case 'todo':
        return 'bg-yellow-500/10 text-yellow-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-500'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'low':
        return 'bg-green-500/10 text-green-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const handleAssignTask = async (
    taskId: string,
    userId: string,
    deadline: string,
    priority: string
  ) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigneeId: userId,
          deadline: new Date(deadline),
          priority,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign task')
      }

      // Refresh tasks after assignment
      fetchDashboardData()
      setIsAssignModalOpen(false)
    } catch (error) {
      console.error('Error assigning task:', error)
    }
  }

  const handleAssignTeamMember = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigneeId: userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign task')
      }

      // Refresh tasks after assignment
      fetchDashboardData()
    } catch (error) {
      console.error('Error assigning task:', error)
      throw error
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Leader Dashboard</h1>
        <p className="text-muted-foreground">Here's what's happening with your team today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Total Team Members</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{teamMembers.length}</span>
                <span className="text-sm text-muted-foreground">Active members</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Tasks Assigned</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{tasks.length}</span>
                <span className="text-sm text-muted-foreground">Total tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">In Progress</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {tasks.filter(task => task.status.toLowerCase() === 'in progress').length}
                </span>
                <span className="text-sm text-muted-foreground">Tasks in progress</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {tasks.filter(task => task.status.toLowerCase() === 'completed').length}
                </span>
                <span className="text-sm text-muted-foreground">Finished tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
        {/* Tasks Table */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Team Tasks</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm" onClick={() => setIsAssignModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        {task.project?.name || 'No Project'}
                      </TableCell>
                      <TableCell>
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignedTo.profileImage || ''} />
                              <AvatarFallback>
                                {task.assignedTo.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : 'No deadline'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TaskActionsMenu
                          onAssign={() => {
                            setSelectedTaskForAssignment({
                              id: task.id,
                              title: task.title
                            })
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No tasks assigned yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Team Chat */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Team Chat</h2>
            <div className="space-y-4">
              {teamChat.length > 0 ? (
                teamChat.map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.profileImage || ''} />
                      <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{message.sender.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.timestamp), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No messages yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedTaskForAssignment && (
        <AssignTeamMemberModal
          isOpen={true}
          onClose={() => setSelectedTaskForAssignment(null)}
          onAssign={handleAssignTeamMember}
          taskId={selectedTaskForAssignment.id}
          taskTitle={selectedTaskForAssignment.title}
          teamMembers={teamMembers}
        />
      )}

      <AssignTaskModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignTask}
        teamMembers={teamMembers}
      />
    </div>
  )
} 