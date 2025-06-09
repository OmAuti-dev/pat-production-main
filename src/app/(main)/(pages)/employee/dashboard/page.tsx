'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format, isValid, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getEmployeeTasks } from './_actions/get-tasks'
import { updateTaskStatus } from './_actions/update-task'
import { useRealTime } from '@/hooks/use-real-time'
import type { Task } from '@/app/(main)/(pages)/manager/dashboard/types'
import { currentUser } from '@clerk/nextjs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface User {
  firstName: string | null
  lastName: string | null
  publicMetadata: {
    role?: string
  }
}

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize real-time updates with empty arrays for unused features
  useRealTime({
    projects: [],
    tasks,
    members: [],
    setProjects: () => {},
    setTasks: (newTasks) => {
      if (Array.isArray(newTasks)) {
        setTasks(newTasks)
      } else if (typeof newTasks === 'function') {
        setTasks(prev => newTasks(prev))
      }
    },
    setMembers: () => {},
  })

  useEffect(() => {
    const loadUser = async () => {
      try {
        const clerkUser = await currentUser()
        if (!clerkUser) {
          toast.error('Not authenticated')
          return
        }
        setUser({
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          publicMetadata: clerkUser.publicMetadata
        })
      } catch (error) {
        console.error('Error loading user:', error)
        toast.error('Failed to load user data')
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = await getEmployeeTasks()
        if (result.success && result.tasks) {
          setTasks(result.tasks)
        } else {
          toast.error(result.error || 'Failed to fetch tasks')
          setTasks([])
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
        toast.error('Failed to fetch tasks')
        setTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'LOW':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'DONE':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const result = await updateTaskStatus(taskId, newStatus)
      if (result.success) {
        // Update the task in the local state
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        )
        toast.success('Task status updated successfully')
      } else {
        toast.error(result.error || 'Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  // Filter tasks for different sections
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayTasks = tasks.filter(task => {
    if (!task?.deadline) return false;
    try {
      const taskDate = parseISO(task.deadline)
      if (!isValid(taskDate)) return false;
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === today.getTime()
    } catch {
      return false;
    }
  })

  const upcomingTasks = tasks.filter(task => {
    if (!task?.deadline) return false;
    try {
      const taskDate = parseISO(task.deadline)
      if (!isValid(taskDate)) return false;
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() > today.getTime()
    } catch {
      return false;
    }
  })

  const overdueTasks = tasks.filter(task => {
    if (!task?.deadline) return false;
    try {
      const taskDate = parseISO(task.deadline)
      if (!isValid(taskDate)) return false;
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() < today.getTime() && !task.completed
    } catch {
      return false;
    }
  })

  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (deadlineFilter !== 'all') {
      try {
        if (!task?.deadline) return false;
        const taskDate = parseISO(task.deadline)
        if (!isValid(taskDate)) return false;
        return format(taskDate, 'yyyy-MM-dd') === deadlineFilter
      } catch {
        return false;
      }
    }
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const uniqueStatuses = Array.from(new Set(tasks.map(task => task.status)))
  const uniqueDeadlines = Array.from(new Set(
    tasks
      .filter(task => task?.deadline && isValid(parseISO(task.deadline)))
      .map(task => format(parseISO(task.deadline), 'yyyy-MM-dd'))
  ))

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">My Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayTasks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingTasks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{overdueTasks.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Tasks</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">Deadline:</span>
              <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Deadlines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deadlines</SelectItem>
                  {uniqueDeadlines.map((date) => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="w-[200px]"
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Due: {task.deadline && isValid(parseISO(task.deadline)) 
                        ? format(parseISO(task.deadline), 'PPP') 
                        : 'No deadline'}
                      </span>
                      <span>•</span>
                      <span>Status: {task.status}</span>
                      <span>•</span>
                      <span>Priority: {task.priority}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Project: {task.Project.name}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdateTaskStatus(task.id, task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                    >
                      {task.status === 'TODO' ? 'Start' : 'Complete'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No tasks found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 