import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
)

// Event channels
export const CHANNELS = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  MEMBERS: 'members',
} as const

// Event types
export const EVENTS = {
  PROJECT_UPDATED: 'project-updated',
  PROJECT_CREATED: 'project-created',
  PROJECT_DELETED: 'project-deleted',
  PROJECT_PROGRESS_UPDATED: 'project-progress-updated',
  
  TASK_CREATED: 'task-created',
  TASK_UPDATED: 'task-updated',
  TASK_DELETED: 'task-deleted',
  TASK_ASSIGNED: 'task-assigned',
  TASK_COMPLETED: 'task-completed',
  
  MEMBER_ADDED: 'member-added',
  MEMBER_REMOVED: 'member-removed',
  MEMBER_ROLE_UPDATED: 'member-role-updated',
} as const 