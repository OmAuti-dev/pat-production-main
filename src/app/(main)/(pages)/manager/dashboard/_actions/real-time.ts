'use server'

import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
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

interface Project {
  id: string
  name: string
  description: string
  type: string
  progress: number
  status: string
}

interface ProjectMember {
  id: string
  name: string | null
  profileImage: string | null
  role: string
  assignedTasks: number
  completedTasks: number
}

// Project updates
export async function triggerProjectUpdate(projectId: string, updates: Partial<Project>) {
  await pusherServer.trigger(CHANNELS.PROJECTS, EVENTS.PROJECT_UPDATED, {
    projectId,
    updates,
  })
}

export async function triggerProjectCreate(project: Project) {
  await pusherServer.trigger(CHANNELS.PROJECTS, EVENTS.PROJECT_CREATED, {
    project,
  })
}

export async function triggerProjectDelete(projectId: string) {
  await pusherServer.trigger(CHANNELS.PROJECTS, EVENTS.PROJECT_DELETED, {
    projectId,
  })
}

export async function triggerProjectProgressUpdate(projectId: string, progress: number) {
  await pusherServer.trigger(CHANNELS.PROJECTS, EVENTS.PROJECT_PROGRESS_UPDATED, {
    projectId,
    progress,
  })
}

// Task updates
export async function triggerTaskCreate(task: Task) {
  await pusherServer.trigger(CHANNELS.TASKS, EVENTS.TASK_CREATED, {
    task,
  })
}

export async function triggerTaskUpdate(taskId: string, updates: Partial<Task>) {
  await pusherServer.trigger(CHANNELS.TASKS, EVENTS.TASK_UPDATED, {
    taskId,
    updates,
  })
}

export async function triggerTaskDelete(taskId: string) {
  await pusherServer.trigger(CHANNELS.TASKS, EVENTS.TASK_DELETED, {
    taskId,
  })
}

export async function triggerTaskAssign(taskId: string, assignee: Task['assignedTo']) {
  await pusherServer.trigger(CHANNELS.TASKS, EVENTS.TASK_ASSIGNED, {
    taskId,
    assignee,
  })
}

export async function triggerTaskComplete(taskId: string) {
  await pusherServer.trigger(CHANNELS.TASKS, EVENTS.TASK_COMPLETED, {
    taskId,
  })
}

// Member updates
export async function triggerMemberAdd(member: ProjectMember) {
  await pusherServer.trigger(CHANNELS.MEMBERS, EVENTS.MEMBER_ADDED, {
    member,
  })
}

export async function triggerMemberRemove(memberId: string) {
  await pusherServer.trigger(CHANNELS.MEMBERS, EVENTS.MEMBER_REMOVED, {
    memberId,
  })
}

export async function triggerMemberRoleUpdate(memberId: string, role: string, memberName: string) {
  await pusherServer.trigger(CHANNELS.MEMBERS, EVENTS.MEMBER_ROLE_UPDATED, {
    memberId,
    role,
    memberName,
  })
} 