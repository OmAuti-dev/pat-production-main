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

interface Task {
  id: string
  title: string
  status: string
  priority: string
  assignedTo: {
    name: string
    profileImage: string | null
  }
  deadline: Date
}

interface TeamMember {
  id: string
  name: string
  profileImage: string | null
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
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch tasks
      const tasksResponse = await fetch('/api/team-leader/tasks')
      const tasksData = await tasksResponse.json()
      setTasks(tasksData)

      // Fetch team members
      const membersResponse = await fetch('/api/team-leader/members')
      const membersData = await membersResponse.json()
      setTeamMembers(membersData)

      // Fetch team chat (if you implement this feature)
      const chatResponse = await fetch('/api/team-leader/chat')
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

  const handleAssignTask = async (data: {
    taskId: string
    assigneeId: string
    deadline: Date
    priority: string
  }) => {
    try {
      const response = await fetch(`/api/tasks/${data.taskId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigneeId: data.assigneeId,
          deadline: data.deadline,
          priority: data.priority,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign task')
      }

      // Refresh tasks after assignment
      fetchDashboardData()
    } catch (error) {
      console.error('Error assigning task:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, Om</h1>
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
                <span className="text-sm text-muted-foreground">Active team members</span>
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
                <span className="text-sm text-muted-foreground">Tasks being worked on</span>
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
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignedTo.profileImage || ''} />
                          <AvatarFallback>
                            {task.assignedTo.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{task.assignedTo.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(task.deadline), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
              {teamChat.map((message) => (
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
              ))}
              {teamChat.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No messages yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AssignTaskModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssignTask}
      />
    </div>
  )
} 