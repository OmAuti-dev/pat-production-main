export interface Project {
  id: string
  name: string
  type: string
  progress: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Task {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  createdAt: string
  updatedAt: string
  projectId: string
  userId: string
  deadline?: Date
  assignedTo?: {
    name: string
    profileImage?: string
  }
}

export interface Campaign {
  id: string
  name: string
  date: string
  openRate: number
  clickRate: number
  recipients: number
  growth: number
  createdAt: string
  updatedAt: string
  userId: string
}

export type ProjectsResponse = Project[]
export type TasksResponse = {
  tasks: Task[]
  total: number
  page: number
  totalPages: number
}
export type CampaignsResponse = Campaign[] 