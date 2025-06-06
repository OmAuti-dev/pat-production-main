'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import type { DashboardData } from './types'

export async function getDashboardData(): Promise<DashboardData> {
  const user = await currentUser()
  if (!user) throw new Error('Not authenticated')

  // Get projects from database
  const projects = await db.project.findMany({
    orderBy: {
      updatedAt: 'desc'
    },
    take: 3
  })

  // Get tasks from database
  const tasks = await db.task.findMany({
    include: {
      assignedTo: true,
      Project: true
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  })

  // Get campaigns from database
  const campaigns = await db.campaign.findMany({
    orderBy: {
      date: 'desc'
    },
    take: 2
  })

  // Calculate project completion stats
  const projectStats = {
    total: await db.project.count(),
    completed: await db.project.count({
      where: {
        progress: 100
      }
    }),
    inProgress: await db.project.count({
      where: {
        progress: {
          gt: 0,
          lt: 100
        }
      }
    })
  }

  return {
    projects,
    tasks,
    campaigns,
    projectStats
  }
}

export interface ProjectMember {
  id: string
  name: string | null
  profileImage: string | null
  role: string
  assignedTasks: number
  completedTasks: number
}

export async function getProjectMembers(projectId?: string) {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true }
  })

  if (!dbUser) throw new Error("User not found")
  if (dbUser.role !== 'MANAGER' && dbUser.role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  let members: ProjectMember[] = []

  if (projectId && projectId !== 'all') {
    // Get members for a specific project
    const projectMembers = await db.projectTeamMember.findMany({
      where: {
        projectId,
        project: {
          managerId: user.id // Only get members from projects managed by this user
        }
      },
      include: {
        user: {
          include: {
            assignedTasks: {
              where: {
                projectId
              }
            }
          }
        }
      }
    })

    members = projectMembers.map(pm => ({
      id: pm.userId,
      name: pm.user.name,
      profileImage: pm.user.profileImage,
      role: pm.user.role,
      assignedTasks: pm.user.assignedTasks.length,
      completedTasks: pm.user.assignedTasks.filter(task => task.status === 'COMPLETED').length
    }))
  } else {
    // Get all team members from projects managed by this user
    const managedProjects = await db.project.findMany({
      where: {
        managerId: user.id
      },
      include: {
        teamMembers: {
          include: {
            user: {
              include: {
                assignedTasks: true
              }
            }
          }
        }
      }
    })

    // Create a map to deduplicate members who might be in multiple projects
    const memberMap = new Map<string, ProjectMember>()

    managedProjects.forEach(project => {
      project.teamMembers.forEach(teamMember => {
        const member = teamMember.user
        const existingMember = memberMap.get(member.clerkId)

        if (existingMember) {
          // Update task counts for existing member
          existingMember.assignedTasks += member.assignedTasks.length
          existingMember.completedTasks += member.assignedTasks.filter(task => task.status === 'COMPLETED').length
        } else {
          // Add new member
          memberMap.set(member.clerkId, {
            id: member.clerkId,
            name: member.name,
            profileImage: member.profileImage,
            role: member.role,
            assignedTasks: member.assignedTasks.length,
            completedTasks: member.assignedTasks.filter(task => task.status === 'COMPLETED').length
          })
        }
      })
    })

    members = Array.from(memberMap.values())
  }

  return members
}

export async function getProjects() {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { role: true }
  })

  if (!dbUser) throw new Error("User not found")
  if (dbUser.role !== 'MANAGER' && dbUser.role !== 'ADMIN') {
    throw new Error("Unauthorized")
  }

  const projects = await db.project.findMany({
    where: {
      managerId: user.id
    },
    select: {
      id: true,
      name: true
    }
  })

  return projects
} 