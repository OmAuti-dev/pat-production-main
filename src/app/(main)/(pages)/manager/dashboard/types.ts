import { Project as BaseProject, Task as BaseTask } from '@/types'
import type { Role } from '@prisma/client'

export interface Employee {
  id: string
  clerkId: string
  name: string | null
  profileImage: string | null
  role: Role
}

export interface Project extends BaseProject {
  id: string
  name: string
  status: string
  description: string | null
  startDate: Date | null
  endDate: Date | null
  team?: {
    id: string
    name: string
    members: Array<{
      user: {
        clerkId: string
        name: string | null
        profileImage: string | null
        role: string
        assignedTasks: Array<{
          id: string
          status: string
        }>
      }
    }>
  }
  progress: number
}

export interface Task extends BaseTask {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: Date | null
  createdAt: Date
  updatedAt: Date
  creatorId: string
  assignedToId: string | null
  projectId: string | null
  assignedTo?: {
    id: string
    name: string | null
    profileImage: string | null
    role: string
  }
  project?: {
    id: string
    name: string
  }
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
  projects: Project[]
  tasks: Task[]
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