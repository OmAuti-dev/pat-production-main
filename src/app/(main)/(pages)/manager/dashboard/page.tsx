'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  FolderGit2, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Activity,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CreateTaskModal } from './_components/create-task-modal'
import { getEmployees } from './_actions/get-employees'
import { getProjects } from './_actions/get-projects'
import { getTasks } from './_actions/get-tasks'
import { toast } from 'sonner'
import { format, isValid, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { 
  Employee, 
  Project, 
  Task, 
  GetEmployeesResponse, 
  GetProjectsResponse, 
  GetTasksResponse 
} from './types'
import { Progress } from '@/components/ui/progress'

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

const isOverdue = (dateString: string | null | undefined, completed: boolean) => {
  try {
    if (!dateString || completed) return false
    const date = parseISO(dateString)
    if (!isValid(date)) return false
    return date < new Date()
  } catch (error) {
    return false
  }
}

export default function ManagerDashboard() {
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesResult, projectsResult, tasksResult] = await Promise.all([
          getEmployees(),
          getProjects(),
          getTasks()
        ]) as [GetEmployeesResponse, GetProjectsResponse, GetTasksResponse]

        if (employeesResult.success && employeesResult.employees) {
          setEmployees(employeesResult.employees)
        } else {
          setEmployees([])
          toast.error(employeesResult.error || 'Failed to fetch employees')
        }

        if (projectsResult.success && projectsResult.projects) {
          setProjects(projectsResult.projects)
        } else {
          setProjects([])
          toast.error(projectsResult.error || 'Failed to fetch projects')
        }

        if (tasksResult.success && tasksResult.tasks) {
          setTasks(tasksResult.tasks)
        } else {
          setTasks([])
          toast.error(tasksResult.error || 'Failed to fetch tasks')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch data')
        setEmployees([])
        setProjects([])
        setTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const onTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      setIsLoading(true)
      // TODO: Implement task completion API call
      toast.success('Task status updated')
      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task status')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => 
    selectedProject === 'all' || task.projectId === selectedProject
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-500'
      case 'DONE':
        return 'bg-green-500/20 text-green-500'
      default:
        return 'bg-yellow-500/20 text-yellow-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-500'
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-500'
      default:
        return 'bg-green-500/20 text-green-500'
    }
  }

  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      description: `${tasks.filter(t => t.completed).length} completed`,
      icon: CheckCircle
    },
    {
      title: "Due Today",
      value: tasks.filter(task => isToday(task?.deadline)).length,
      description: "Tasks due today",
      icon: Calendar
    },
    {
      title: "Overdue",
      value: tasks.filter(task => isOverdue(task?.deadline, task?.completed || false)).length,
      description: "Tasks past deadline",
      icon: AlertCircle
    }
  ]

  const calculateProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.Project.id === projectId)
    if (projectTasks.length === 0) return 0
    
    const completedTasks = projectTasks.filter(task => task.status === 'DONE').length
    return Math.round((completedTasks / projectTasks.length) * 100)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-black">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Button disabled className="bg-gray-800 text-gray-400">
              <span className="animate-spin mr-2">⌛</span>
              Loading...
            </Button>
          ) : employees.length === 0 || projects.length === 0 ? (
            <Button
              disabled
              title={`Cannot create task: ${employees.length === 0 ? 'No employees available' : 'No projects available'}`}
              className="bg-gray-800 text-gray-400"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          ) : (
            <Button 
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Progress */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-200">
              <FolderGit2 className="h-5 w-5" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {projects.map((project) => {
                const progress = calculateProjectProgress(project.id)
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-200">{project.name}</h3>
                      <span className="text-sm text-gray-400">{progress}%</span>
                    </div>
                    <Progress
                      value={progress}
                      className={cn(
                        "h-2 bg-gray-800",
                        progress === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"
                      )}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Tasks: {tasks.filter(t => t.Project.id === project.id).length}</span>
                      <span>Completed: {tasks.filter(t => t.Project.id === project.id && t.status === 'DONE').length}</span>
                    </div>
                  </div>
                )
              })}
              {projects.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  No projects available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-200">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {employees.map((employee) => {
                const employeeTasks = tasks.filter(t => t.assignedTo.name === employee.name)
                const completedTasks = employeeTasks.filter(t => t.status === 'DONE').length
                const progress = employeeTasks.length > 0 
                  ? Math.round((completedTasks / employeeTasks.length) * 100)
                  : 0
                
                return (
                  <div key={employee.clerkId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-gray-800">
                          <AvatarImage src={employee.profileImage || ''} />
                          <AvatarFallback className="bg-gray-800 text-gray-200">
                            {employee.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-200">{employee.name}</h3>
                          <p className="text-xs text-gray-400">{employee.role}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{progress}%</span>
                    </div>
                    <Progress
                      value={progress}
                      className={cn(
                        "h-2 bg-gray-800",
                        progress === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"
                      )}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Assigned: {employeeTasks.length}</span>
                      <span>Completed: {completedTasks}</span>
                    </div>
                  </div>
                )
              })}
              {employees.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  No team members available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem 
                    key={project.id} 
                    value={project.id}
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="space-y-1">
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Due: {formatDate(task?.deadline)}</span>
                    <span>•</span>
                    <span>Priority: {task.priority || 'None'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {task.assignedTo?.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{task.assignedTo?.name || 'Unassigned'}</p>
                      <p className="text-muted-foreground">{task.assignedTo?.role || 'No role'}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={task.completed || false}
                    onCheckedChange={(checked) => {
                      onTaskComplete(task.id, checked as boolean)
                    }}
                  />
                </div>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No tasks available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        employees={employees.map(emp => ({
          id: emp.clerkId,
          name: emp.name || 'Unnamed Employee',
          role: emp.role
        }))}
        projects={projects}
      />
    </div>
  )
} 