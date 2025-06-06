'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { toast } from 'sonner'

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = await currentUser()
        if (!user) {
          toast.error('Not authenticated')
          return
        }

        const tasks = await db.task.findMany({
          where: {
            assignedToId: user.id,
            status: {
              not: 'DONE'
            }
          },
          include: {
            Project: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        })

        setTasks(tasks)
      } catch (error) {
        console.error('Error fetching tasks:', error)
        toast.error('Failed to fetch tasks')
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

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      // Refresh tasks
      router.refresh()
      toast.success('Task status updated')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task status')
    }
  }

  const todayTasks = tasks.filter(task => 
    task.dueDate && format(new Date(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  )
  const upcomingTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) > new Date()
  )
  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  )

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold">My Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No tasks assigned</div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border bg-card text-card-foreground"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Project: {task.Project.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Due: {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'No deadline'}
                      </p>
                      <div className="flex gap-2">
                        {task.status === 'TODO' && (
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'DONE')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 