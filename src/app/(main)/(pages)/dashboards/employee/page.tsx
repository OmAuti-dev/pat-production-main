'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageSquare, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { format, isToday, isValid, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { useTasks } from '@/hooks/use-tasks'
import { useProjects } from '@/hooks/use-projects'
import { getCurrentUser } from '@/app/_actions/user'
import { updateTaskStatus } from './_actions/update-task-status'
import { acceptTask, declineTask } from './_actions/task-actions'
import { addTaskComment } from '@/app/(main)/(pages)/kanban/_actions/task-actions'
import type { Task, TaskStatus } from './types'
import { TimeTracking } from './_components/time-tracking'
import { TimeReport } from './_components/time-report'

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'No date'
  try {
    const date = parseISO(dateString)
    return isValid(date) ? format(date, 'MMM d, yyyy') : 'No date'
  } catch {
    return 'Invalid date'
  }
}

const taskStatusLabels: Record<TaskStatus, string> = {
  'TODO': 'To Do',
  'IN_PROGRESS': 'In Progress',
  'DONE': 'Done'
}

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  publicMetadata?: {
    role?: string
}
}

interface TaskDetailsModalProps {
  task: Task
  onClose: () => void
  onStatusChange: (taskId: string) => Promise<void>
}

function TaskDetailsModal({ task, onClose, onStatusChange }: TaskDetailsModalProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setIsSubmitting(true)
    try {
      const result = await addTaskComment(task.id, comment)
      if (result.success) {
        toast.success('Comment added successfully')
        setComment('')
      } else {
        toast.error(result.error || 'Failed to add comment')
      }
  } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{task.title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Task Details</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Project:</span> {task.Project?.name || 'No project'}</p>
            <p><span className="text-muted-foreground">Status:</span> {taskStatusLabels[task.status]}</p>
            <p><span className="text-muted-foreground">Priority:</span> {task.priority}</p>
            <p><span className="text-muted-foreground">Due:</span> {formatDate(task.deadline)}</p>
            <p><span className="text-muted-foreground">Assigned by:</span> {task.assignedBy}</p>
          </div>
        </div>

        {task.accepted && task.status === 'IN_PROGRESS' && (
          <TimeTracking task={task} />
        )}

        {task.accepted && (
          <TimeReport task={task} />
        )}

        <div>
          <h3 className="font-medium mb-2">Add Comment</h3>
          <div className="space-y-2">
            <Textarea
              placeholder="Add your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {task.status !== 'DONE' && (
            <Button onClick={() => onStatusChange(task.id)}>
              {task.status === 'TODO' ? 'Start Task' : 'Complete Task'}
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  )
}

export default function EmployeeDashboard(): JSX.Element {
  const { data: tasks, fetchTasks } = useTasks()
  const { data: projects } = useProjects()
  const [user, setUser] = useState<User | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleStatusChange = async (taskId: string) => {
    try {
      const task = myTasks.find(t => t.id === taskId)
      if (!task) {
        toast.error('Task not found')
        return
      }

      const newStatus: TaskStatus = task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE'
      const result = await updateTaskStatus(taskId, newStatus)
      
      if (result.success) {
        toast.success(`Task ${newStatus === 'IN_PROGRESS' ? 'started' : 'completed'}`)
        // Refresh tasks
        if (fetchTasks) {
          await fetchTasks()
        }
      } else {
        toast.error(result.error || 'Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const handleAcceptTask = async (taskId: string) => {
    try {
      const result = await acceptTask(taskId)
      if (result.success) {
        toast.success('Task accepted')
        if (fetchTasks) {
          await fetchTasks()
        }
      } else {
        toast.error(result.error || 'Failed to accept task')
      }
    } catch (error) {
      console.error('Error accepting task:', error)
      toast.error('Failed to accept task')
    }
  }

  const handleDeclineTask = async (taskId: string) => {
    try {
      const result = await declineTask(taskId)
      if (result.success) {
        toast.success('Task declined')
        if (fetchTasks) {
          await fetchTasks()
        }
      } else {
        toast.error(result.error || 'Failed to decline task')
      }
    } catch (error) {
      console.error('Error declining task:', error)
      toast.error('Failed to decline task')
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
      setMyTasks(tasks as Task[])
      setIsLoading(false)
    }
  }, [tasks])

  const pendingTasks = myTasks.filter(task => task.status === 'TODO').length
  const completedTasks = myTasks.filter(task => task.status === 'DONE').length
  const todaysTasks = myTasks.filter(task => {
    if (!task.deadline) return false
    try {
      const taskDate = parseISO(task.deadline)
      return isToday(taskDate)
    } catch {
      return false
    }
  }).length

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
    .filter((status): status is TaskStatus => 
      status === 'TODO' || status === 'IN_PROGRESS' || status === 'DONE'
    )

  const uniqueDeadlines = Array.from(new Set(
    myTasks
      .map(task => task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : null)
      .filter((date): date is string => Boolean(date && date.trim() !== ''))
  ))

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user ? `, ${user.firstName}!` : '!'}</h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your tasks and progress</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <span role="img" aria-label="pending" className="text-muted-foreground">🗂️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-sm text-muted-foreground">Tasks to be completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <span role="img" aria-label="completed" className="text-muted-foreground">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-sm text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Tasks</CardTitle>
            <span role="img" aria-label="today" className="text-muted-foreground">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysTasks}</div>
            <p className="text-sm text-muted-foreground">Due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <span role="img" aria-label="progress" className="text-muted-foreground">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-2">Overall completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Tasks</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | TaskStatus)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {taskStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deadlines</SelectItem>
                {uniqueDeadlines.map((date) => (
                  <SelectItem key={date} value={date}>
                    {format(new Date(date), 'MMM d, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px]"
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
                      <span>Due: {formatDate(task.deadline)}</span>
                      <span>•</span>
                      <span>Status: {taskStatusLabels[task.status]}</span>
                      <span>•</span>
                      <span>Priority: {task.priority || 'None'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === 'TODO' && !task.accepted && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAcceptTask(task.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeclineTask(task.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      {selectedTask && (
                        <TaskDetailsModal
                          task={selectedTask}
                          onClose={() => setSelectedTask(null)}
                          onStatusChange={handleStatusChange}
                        />
                      )}
                    </Dialog>
                    {task.accepted && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusChange(task.id)}
                        disabled={task.status === 'DONE'}
                    >
                        {task.status === 'TODO' ? 'Start Task' : 
                         task.status === 'IN_PROGRESS' ? 'Complete Task' : 
                         'Completed'}
                    </Button>
                    )}
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