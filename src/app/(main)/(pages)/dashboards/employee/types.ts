export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  deadline?: string
  accepted: boolean
  createdAt: string
  updatedAt: string
  resourceUrl?: string
  assignedBy: string
  assignedToId?: string
  projectId: string
  Project?: {
    id: string
    name: string
  } | null
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done'
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
} 