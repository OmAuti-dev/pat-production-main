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
import { useRealTime } from '@/hooks/use-real-time'

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
  if (!dateString) return false
  try {
    const date = parseISO(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

const isOverdue = (dateString: string | null | undefined, completed: boolean) => {
  if (!dateString || completed) return false
  try {
    const date = parseISO(dateString)
    const today = new Date()
    return date < today
  } catch {
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

  // Initialize real-time updates
  useRealTime({
    projects,
    tasks,
    members,
    setProjects,
    setTasks,
    setMembers,
  })

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
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch dashboard data')
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
      await deleteTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      toast.success('Task deleted successfully')
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleUnassignTask = async (taskId: string) => {
    try {
      await unassignTask(taskId)
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const { assignedTo, ...rest } = t
          return rest
        }
        return t
      }))
      toast.success('Task unassigned successfully')
    } catch (error) {
      toast.error('Failed to unassign task')
    }
  }

  const formatDateForInput = (date: Date | null) => {
    if (!date) return ''
    return format(date, 'yyyy-MM-dd')
  }

  const filteredTasks = tasks.filter(task => 
    selectedProject === 'all' || task.projectId === selectedProject
  )

  const calculateProjectProgress = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.progress || 0
  }

  const isTaskDueToday = (task: Task) => {
    if (!task.deadline) return false
    try {
      const deadline = new Date(task.deadline)
      const today = new Date()
      return deadline.toDateString() === today.toDateString()
    } catch (error) {
      console.error('Error parsing deadline:', error)
      return false
    }
  }

  const isTaskOverdue = (task: Task) => {
    if (!task.deadline || task.status === 'DONE') return false
    try {
      const deadline = new Date(task.deadline)
      const today = new Date()
      return deadline < today
    } catch (error) {
      console.error('Error parsing deadline:', error)
      return false
    }
  }

  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      description: `${tasks.filter(t => t.status === 'DONE').length} completed`,
      icon: CheckCircle
    },
    {
      title: "Due Today",
      value: tasks.filter(isTaskDueToday).length,
      description: "Tasks due today",
      icon: Calendar
    },
    {
      title: "Overdue",
      value: tasks.filter(isTaskOverdue).length,
      description: "Tasks past deadline",
      icon: AlertCircle
    }
  ]

  const handleProjectChange = async (projectId: string) => {
    setSelectedProject(projectId)
    const updatedMembers = await getProjectMembers(projectId)
    setMembers(updatedMembers)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
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

      {/* Project Progress and Team Members in one row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Progress */}
        <Card>
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
                const teamMembers = project.team?.members || []
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teamMembers.length} team members
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {teamMembers.slice(0, 3).map((member) => (
                            <Avatar key={member.user.clerkId} className="border-2 border-background">
                              <AvatarImage src={member.user.profileImage || ""} />
                              <AvatarFallback>
                                {member.user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {teamMembers.length > 3 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm">
                              +{teamMembers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{progress}% complete</span>
                      <span>{project.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Project Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Project Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedProject} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-projects">All Projects</SelectItem>
                  {projects.map((project) => (
                    project.id ? (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ) : null
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-4">
                {selectedProject === 'all-projects' ? (
                  // Show all unique members across all projects
                  projects.flatMap(project => project.team?.members || [])
                    .filter((member, index, self) => 
                      index === self.findIndex(m => m.user.clerkId === member.user.clerkId)
                    )
                    .map((member) => {
                      const assignedTasks = member.user.assignedTasks.length
                      const completedTasks = member.user.assignedTasks.filter(task => task.status === 'DONE').length
                      return (
                        <div
                          key={member.user.clerkId}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarImage src={member.user.profileImage || ""} />
                              <AvatarFallback>
                                {member.user.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user.name}</p>
                              <p className="text-sm text-muted-foreground">{member.user.role}</p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>{completedTasks}/{assignedTasks} tasks</p>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  // Show members of the selected project
                  projects.find(p => p.id === selectedProject)?.team?.members.map((member) => {
                    const assignedTasks = member.user.assignedTasks.length
                    const completedTasks = member.user.assignedTasks.filter(task => task.status === 'DONE').length
                    return (
                      <div
                        key={member.user.clerkId}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={member.user.profileImage || ""} />
                            <AvatarFallback>
                              {member.user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">{member.user.role}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>{completedTasks}/{assignedTasks} tasks</p>
                        </div>
                      </div>
                    )
                  }) || (
                    <div className="text-center text-muted-foreground">
                      No members in this project
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tasks
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedProject} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateTaskModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
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
        employees={employees}
        projects={projects}
      />

      {selectedTask && (
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
      )}
    </div>
  )
} 