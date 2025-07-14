'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import type { DashboardData, Task } from './types'

export interface ProjectMember {
  id: string
  clerkId: string
  name: string | null
  role: string
  assignedTasks: number
  completedTasks: number
}

export async function getProjectMembers(projectId?: string) {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true, role: true }
  })

  if (!dbUser) throw new Error("User not found")
  if (dbUser.role !== 'MANAGER' && dbUser.role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  let members: ProjectMember[] = []

  if (projectId && projectId !== 'all') {
    // Get all users who have tasks in this project
    const users = await db.user.findMany({
      where: {
        assignedTasks: {
          some: {
            projectId: projectId
          }
        }
      },
      select: {
        id: true,
        clerkId: true,
        name: true,
        role: true,
        assignedTasks: {
          where: {
            projectId: projectId
          }
        }
      }
    })

    // Transform users into ProjectMember format
    members = users.map(user => ({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      role: user.role,
      assignedTasks: user.assignedTasks.length,
      completedTasks: user.assignedTasks.filter(task => task.status === 'DONE').length
    }))
  } else {
    // Get all users who have tasks in any project managed by this user
    const users = await db.user.findMany({
      where: {
        assignedTasks: {
          some: {
            project: {
              managerId: dbUser.id
            }
          }
        }
      },
      select: {
        id: true,
        clerkId: true,
        name: true,
        role: true,
        assignedTasks: {
          where: {
            project: {
              managerId: dbUser.id
            }
          }
        }
      }
    })

    // Transform users into ProjectMember format
    members = users.map(user => ({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      role: user.role,
      assignedTasks: user.assignedTasks.length,
      completedTasks: user.assignedTasks.filter(task => task.status === 'DONE').length
    }))
  }

  return members
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await currentUser()
  if (!user) throw new Error('Not authenticated')

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true, role: true }
  })

  if (!dbUser) throw new Error('User not found')
  if (dbUser.role !== 'MANAGER' && dbUser.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // Get projects from database
  const projects = await db.project.findMany({
    where: {
      managerId: dbUser.id
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 3,
    include: {
      tasks: true
    }
  })

  // Get tasks from database
  const tasks = await db.task.findMany({
    where: {
      project: {
        managerId: dbUser.id
      }
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      project: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  })

  // Calculate project completion stats
  const projectStats = {
    total: await db.project.count({
      where: {
        managerId: dbUser.id
      }
    }),
    completed: await db.project.count({
      where: {
        managerId: dbUser.id,
        status: 'DONE'
      }
    }),
    inProgress: await db.project.count({
      where: {
        managerId: dbUser.id,
        status: 'IN_PROGRESS'
      }
    })
  }

  // Transform projects to include progress
  const transformedProjects = projects.map(project => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      ...project,
      progress
    }
  })

  // Transform tasks to match the Task type
  const transformedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    creatorId: task.creatorId,
    assignedToId: task.assignedToId,
    projectId: task.projectId,
    assignedTo: task.assignedTo ? {
      id: task.assignedTo.id,
      name: task.assignedTo.name,
      role: task.assignedTo.role
    } : undefined,
    project: task.project ? {
      id: task.project.id,
      name: task.project.name
    } : undefined
  })) as Task[]

  return {
    projects: transformedProjects,
    tasks: transformedTasks,
    projectStats
  }
}

export async function getProjects() {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true, role: true }
  })

  if (!dbUser) throw new Error("User not found")
  if (dbUser.role !== 'MANAGER' && dbUser.role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  const projects = await db.project.findMany({
    where: {
      managerId: dbUser.id
    },
    select: {
      id: true,
      name: true
    }
  })

  return projects
} 