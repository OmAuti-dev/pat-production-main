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
    const project = await db.project.findUnique({
      where: {
        id: projectId,
        managerId: user.id // Only get members from projects managed by this user
      },
      include: {
        team: {
          include: {
            members: {
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
            }
          }
        }
      }
    })

    if (project?.team) {
      members = project.team.members.map(member => ({
        id: member.user.clerkId,
        name: member.user.name,
        profileImage: member.user.profileImage,
        role: member.user.role,
        assignedTasks: member.user.assignedTasks.length,
        completedTasks: member.user.assignedTasks.filter(task => task.status === 'COMPLETED').length
      }))
    }
  } else {
    // Get all team members from projects managed by this user
    const managedProjects = await db.project.findMany({
      where: {
        managerId: user.id
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  include: {
                    assignedTasks: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Create a map to deduplicate members who might be in multiple projects
    const memberMap = new Map<string, ProjectMember>()

    managedProjects.forEach(project => {
      if (project.team) {
        project.team.members.forEach(teamMember => {
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
      }
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