'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Trash2,
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
import { ProjectMembers } from './_components/project-members'
import { getEmployees } from './_actions/get-employees'
import { getProjects } from './_actions/get-projects'
import { getTasks } from './_actions/get-tasks'
import { toast } from 'sonner'
import { format, isValid, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { ProjectDetailsDialog } from '@/components/projects/project-details-dialog'
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
import { addEmployeeToProject } from '@/app/(main)/(pages)/projects/_actions/project'

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
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<Project | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
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

  // Periodic task cleanup
  useEffect(() => {
    const cleanupTasks = async () => {
      try {
        const response = await fetch('/api/tasks/cleanup', {
          method: 'POST'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.unassignedTasks.length > 0) {
            toast.info(`${data.unassignedTasks.length} tasks were unassigned due to deleted users`)
          }
        }
      } catch (error) {
        console.error('Error during task cleanup:', error)
      }
    }

    // Run cleanup on component mount and every hour
    cleanupTasks()
    const interval = setInterval(cleanupTasks, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Fetch initial data
  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        const [employeesResult, projectsResult, tasksResult] = await Promise.all([
          getEmployees(),
          getProjects(),
          getTasks()
        ]) as [GetEmployeesResponse, GetProjectsResponse, GetTasksResponse]

        if (!mounted) return

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

        // Get initial members
        const initialMembers = await getProjectMembers('all')
        if (!mounted) return
        
        setMembers(initialMembers)
      } catch (error) {
        console.error('Error fetching data:', error)
        if (mounted) {
          toast.error('Failed to fetch dashboard data')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsEditTaskModalOpen(true)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setIsEditTaskModalOpen(false)
    setSelectedTask(null)
  }, [])

  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await deleteTask(taskId)
      if (result.success) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        toast.success('Task deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleUnassignTask = async (taskId: string) => {
    try {
      const result = await unassignTask(taskId)
      if (result.success) {
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              assignedTo: undefined,
              assignedToId: null
            }
          }
          return t
        }))
        toast.success('Task unassigned successfully')
      } else {
        toast.error(result.error || 'Failed to unassign task')
      }
    } catch (error) {
      console.error('Error unassigning task:', error)
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

  const handleDeleteSelectedTasks = () => {
    if (selectedTasks.size === 0) {
      toast.error('No tasks selected')
      return
    }
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    selectedTasks.forEach(taskId => handleDeleteTask(taskId))
    setSelectedTasks(new Set())
    setIsDeleteDialogOpen(false)
  }

  const handleShowProjectDetails = async (project: Project) => {
    setSelectedProjectDetails(project)
    if (project.id) {
      try {
        // Fetch project members and available employees in parallel
        const [members, employeesRes] = await Promise.all([
          getProjectMembers(project.id),
          getEmployees()
        ])

        setProjectMembers(members)
        
        if (employeesRes.success && employeesRes.employees) {
          // Filter out employees who are already members
          const availableEmps = employeesRes.employees.filter(
            emp => !members.some(member => member.clerkId === emp.clerkId)
          )
          setAvailableEmployees(availableEmps)
        }
      } catch (error) {
        console.error('Error fetching project details:', error)
        toast.error('Failed to load project details')
      }
    }
  }

  const handleAddMember = async (employeeClerkId: string) => {
    try {
      if (!selectedProjectDetails) {
        toast.error('No project selected')
        return
      }

      await addEmployeeToProject(selectedProjectDetails.id, employeeClerkId)

      // Refresh project members and available employees
      const [updatedMembers, employeesRes] = await Promise.all([
        getProjectMembers(selectedProjectDetails.id),
        getEmployees()
      ])

      setProjectMembers(updatedMembers)
      
      if (employeesRes.success && employeesRes.employees) {
        // Filter out employees who are already members
        const availableEmps = employeesRes.employees.filter(
          emp => !updatedMembers.some(member => member.clerkId === emp.clerkId)
        )
        setAvailableEmployees(availableEmps)
      }

      toast.success('Project member added successfully')
    } catch (error) {
      console.error('Error adding project member:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to add project member')
      }
    }
  }

  const handleUpdateProject = async (data: {
    name: string
    description: string | null
    status: string
    startDate: Date | null
    endDate: Date | null
  }) => {
    // This is a placeholder - you'll need to implement the actual project update functionality
    toast.error('Project update functionality not implemented yet')
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => setIsCreateTaskModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tasks.filter(t => t.status === 'DONE').length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(isTaskDueToday).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(isTaskOverdue).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks past deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress and Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="space-y-2 cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors"
                onClick={() => handleShowProjectDetails(project)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tasks.filter(t => t.projectId === project.id && t.assignedToId).length} team members
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {calculateProjectProgress(project.id)}% complete
                  </span>
                </div>
                <Progress value={calculateProjectProgress(project.id)} className="h-2" />
                <p className="text-sm text-muted-foreground text-right">
                  {project.status}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Members */}
        <ProjectMembers members={members} />
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={selectedProject}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
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
            {selectedProject && selectedProject !== 'all' && selectedTasks.size > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteSelectedTasks}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete selected tasks</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TasksTable
            tasks={filteredTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onUnassign={handleUnassignTask}
            selectedProject={selectedProject}
            onSelectedTasksChange={setSelectedTasks}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        employees={employees}
        projects={projects}
      />

      {selectedTask && (
        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={handleCloseEditModal}
          task={selectedTask}
          employees={employees}
          projects={projects}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Tasks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTasks.size} selected task(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedProjectDetails && (
        <ProjectDetailsDialog
          project={{
            ...selectedProjectDetails,
            client: { name: null },
            startDate: null,
            endDate: null,
          }}
          members={projectMembers.map(member => ({
            clerkId: member.clerkId,
            name: member.name,
            role: member.role,
            assignedTasks: member.assignedTasks,
            completedTasks: member.completedTasks
          }))}
          availableEmployees={availableEmployees.map(emp => ({
            clerkId: emp.clerkId,
            name: emp.name
          }))}
          userRole="MANAGER"
          isOpen={!!selectedProjectDetails}
          onClose={() => setSelectedProjectDetails(null)}
          onAddMember={handleAddMember}
          onUpdateProject={handleUpdateProject}
        />
      )}
    </div>
  )
} 