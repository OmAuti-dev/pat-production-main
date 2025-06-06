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
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateTaskModal } from './_components/create-task-modal'
import { EditTaskModal } from './_components/edit-task-modal'
import { TasksTable } from './_components/tasks-table'
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
import { getProjectMembers, type ProjectMember } from './actions'
import { editTask, deleteTask, unassignTask } from './_actions/task-actions'

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
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<ProjectMember[]>([])
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

        const [initialMembers] = await Promise.all([
          getProjectMembers()
        ])
        setMembers(initialMembers)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch data')
        setEmployees([])
        setProjects([])
        setTasks([])
        setMembers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setIsEditTaskModalOpen(true)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsLoading(true)
      const result = await deleteTask(taskId)
      
      if (result.success) {
        toast.success('Task deleted successfully')
        // Update local state
        setTasks(tasks.filter(task => task.id !== taskId))
      } else {
        toast.error(result.error || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassignTask = async (taskId: string) => {
    try {
      setIsLoading(true)
      const result = await unassignTask(taskId)
      
      if (result.success && result.task) {
        toast.success('Task unassigned successfully')
        // Update local state
        setTasks(tasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                assignedTo: {
                  id: '',
                  name: null,
                  profileImage: null,
                  role: ''
                }
              }
            : task
        ))
      } else {
        toast.error(result.error || 'Failed to unassign task')
      }
    } catch (error) {
      console.error('Error unassigning task:', error)
      toast.error('Failed to unassign task')
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

  const handleProjectChange = async (projectId: string) => {
    setSelectedProject(projectId)
    const updatedMembers = await getProjectMembers(projectId)
    setMembers(updatedMembers)
  }

  if (isLoading) {
    return <div>Loading...</div>
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
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                      <h3 className="font-medium">{project.name}</h3>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress
                      value={progress}
                      className={cn(
                        "h-2",
                        progress === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"
                      )}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tasks: {tasks.filter(t => t.Project.id === project.id).length}</span>
                      <span>Completed: {tasks.filter(t => t.Project.id === project.id && t.status === 'DONE').length}</span>
                    </div>
                  </div>
                )
              })}
              {projects.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No projects available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between space-x-4"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.profileImage || undefined} />
                      <AvatarFallback>
                        {member.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        {member.completedTasks}
                      </span>
                      <span>Completed</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        {member.assignedTasks}
                      </span>
                      <span>Total Tasks</span>
                    </div>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
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
          <TasksTable
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onUnassign={handleUnassignTask}
          />
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

      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={() => {
          setIsEditTaskModalOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        employees={employees}
        projects={projects}
      />
    </div>
  )
} 