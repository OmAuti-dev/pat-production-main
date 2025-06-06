export interface Employee {
  id: string
  clerkId: string
  name: string | null
  role: string
  profileImage: string | null
}

export interface Project {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  status: string
  priority: string
  deadline: string
  completed: boolean
  projectId: string
  Project: {
    id: string
    name: string
  }
  assignedTo: {
    id: string
    name: string | null
    profileImage: string | null
    role: string
  }
  createdAt: string
  updatedAt: string
}

export interface GetEmployeesResponse {
  success: boolean
  employees?: Employee[]
  error?: string
}

export interface GetProjectsResponse {
  success: boolean
  projects?: Project[]
  error?: string
}

export interface GetTasksResponse {
  success: boolean
  tasks?: Task[]
  error?: string
}

export interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  projects: Project[]
}

export type TaskWithRelations = {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string
  assignedTo: {
    name: string | null
    profileImage: string | null
  }
  Project: {
    name: string
  }
}

export interface DashboardData {
  projects: Array<{
    id: string
    name: string
    description: string
    type: string
    progress: number
  }>
  tasks: TaskWithRelations[]
  campaigns: Array<{
    id: string
    name: string
    date: Date
    openRate: number
    clickRate: number
    recipients: number
    growth: number
  }>
  projectStats: {
    total: number
    completed: number
    inProgress: number
  }
} 