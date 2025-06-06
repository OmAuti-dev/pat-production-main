'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjects, useTasks } from '@/hooks'
import { useEffect, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { getCurrentUser } from './_actions/get-user'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

interface Task {
  id: string
  title: string
  status: string
  deadline: string
  assignedBy: string
  userId: string
  priority: string
}

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  publicMetadata: Record<string, unknown>
  error?: string
}

const formatDate = (dateString: string | null | undefined) => {
  try {
    if (!dateString) return 'No date'
    const date = parseISO(dateString)
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'No date'
  } catch (error) {
    return 'Invalid date'
  }
}

const isToday = (dateString: string | null | undefined) => {
  try {
    if (!dateString) return false
    const date = parseISO(dateString)
    if (!isValid(date)) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  } catch (error) {
    return false
  }
}

export default function EmployeeDashboard(): JSX.Element {
  const { data: tasks } = useTasks()
  const { data: projects } = useProjects()
  const [user, setUser] = useState<User | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleStatusChange = async (taskId: string) => {
    try {
      // TODO: Implement status change API call
      toast.success('Task status updated')
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUser()
        if ('error' in userData) {
          toast.error(userData.error)
          return
        }
        setUser(userData)
      } catch (error) {
        console.error('Error loading user:', error)
        toast.error('Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (tasks && Array.isArray(tasks)) {
      setMyTasks(tasks)
      setIsLoading(false)
    }
  }, [tasks])

  const pendingTasks = myTasks.filter(task => task.status === 'TODO').length
  const completedTasks = myTasks.filter(task => task.status === 'DONE').length
  const todaysTasks = myTasks.filter(task => isToday(task?.deadline)).length
  const progress = myTasks.length > 0 
    ? Math.round((completedTasks / myTasks.length) * 100) 
    : 0

  const filteredTasks = myTasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (deadlineFilter !== 'all') {
      try {
        const taskDate = task.deadline ? parseISO(task.deadline) : null
        return taskDate && isValid(taskDate) && format(taskDate, 'yyyy-MM-dd') === deadlineFilter
      } catch {
        return false
      }
    }
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const uniqueStatuses = Array.from(new Set(myTasks.map(task => task.status)))
  const uniqueDeadlines = Array.from(new Set(
    myTasks
      .map(task => task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : null)
      .filter(Boolean) as string[]
  ))

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user ? `, ${user.firstName}!` : '!'}</h1>
          <p className="text-muted-foreground">Here's an overview of your tasks and progress</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative inline-block">
              <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-red-500"></span>
              <span className="inline-block h-10 w-10 rounded-full bg-gray-300" />
            </span>
            <div>
              <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground">{user?.publicMetadata?.role || 'Employee'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <span role="img" aria-label="pending" className="text-muted-foreground">🗂️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-sm text-muted-foreground">Tasks to be completed</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <span role="img" aria-label="completed" className="text-muted-foreground">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-sm text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <span role="img" aria-label="today" className="text-muted-foreground">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysTasks}</div>
            <p className="text-sm text-muted-foreground">Due today</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <span role="img" aria-label="progress" className="text-muted-foreground">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{progress}%</div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">Overall completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Due: {formatDate(task?.deadline)}</span>
                      <span>•</span>
                      <span>Status: {task.status || 'None'}</span>
                      <span>•</span>
                      <span>Priority: {task.priority || 'None'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Assigned by: {task.assignedBy || 'Unknown'}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusChange(task.id)}
                    >
                      Update Status
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