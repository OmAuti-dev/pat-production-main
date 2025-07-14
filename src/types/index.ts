export interface Project {
  id: string
  name: string
  description: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
  managerId: string
  clientId: string | null
  teamId: string | null
  client?: {
    name: string | null
  }
  team?: {
    id: string
    name: string
    members: Array<{
      user: {
        clerkId: string
        name: string | null
        role: string
        assignedTasks: Array<{
          id: string
          status: string
        }>
      }
    }>
  }
}

export interface BaseTask {
  id: string
  title: string
  description: string | null
  status: 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: Date | null
  createdAt: Date
  updatedAt: Date
  creatorId: string
  assignedToId: string | null
  projectId: string | null
  declineReason?: string | null
  requiredSkills: string[]
}

export interface Task extends BaseTask {
  assignedTo?: {
    id: string
    name: string | null
    role: string
  }
  project?: {
    id: string
    name: string
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

export interface ProjectMember {
  id: string
  name: string | null
  role: string
  assignedTasks: number
  completedTasks: number
}

export type ProjectsResponse = Project[]
export type TasksResponse = {
  tasks: Task[]
  total: number
  page: number
  totalPages: number
}
export type CampaignsResponse = Campaign[] 