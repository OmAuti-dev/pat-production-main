'use server'

import { currentUser } from "@clerk/nextjs"
import { db } from "@/lib/db"

export type ProjectStatus = "In Progress" | "Completed" | "On Hold"

export interface Project {
  title: string
  category: string
  description: string
  progress: number
  startDate: string
  endDate: string
  memberCount: number
  commentCount: number
  status: ProjectStatus
}

export interface Comment {
  id: string
  content: string
  rating: number | undefined
  createdAt: string
  user: {
    name: string | null
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

  let members: ProjectMember[] = []

  if (projectId && projectId !== 'all') {
    // Get members for a specific project
    const project = await db.project.findUnique({
      where: {
        id: projectId
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
    // Get all team members across projects
    const allMembers = await db.user.findMany({
      where: {
        memberOfTeams: {
          some: {
            team: {
              projects: {
                some: {
                  clientId: user.id
                }
              }
            }
          }
        }
      },
      include: {
        assignedTasks: true
      }
    })

    members = allMembers.map(member => ({
      id: member.clerkId,
      name: member.name,
      profileImage: member.profileImage,
      role: member.role,
      assignedTasks: member.assignedTasks.length,
      completedTasks: member.assignedTasks.filter(task => task.status === 'COMPLETED').length
    }))
  }

  return members
}

export async function getProjects() {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const projects = await db.project.findMany({
    select: {
      id: true,
      name: true
    }
  })

  return projects
}

export async function getProjectComments(projectId: string): Promise<Comment[]> {
  const comments = await db.projectComment.findMany({
    where: {
      projectId
    },
    include: {
      user: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return comments.map(comment => ({
    id: comment.id,
    content: comment.content,
    rating: comment.rating || undefined,
    createdAt: comment.createdAt.toISOString(),
    user: {
      name: comment.user.name
    }
  }))
}

export async function addProjectComment(projectId: string, content: string, rating?: number): Promise<Comment> {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id }
  })

  if (!dbUser) throw new Error("User not found")

  const comment = await db.projectComment.create({
    data: {
      content,
      rating,
      projectId,
      userId: dbUser.id
    },
    include: {
      user: {
        select: {
          name: true
        }
      }
    }
  })

  return {
    id: comment.id,
    content: comment.content,
    rating: comment.rating || undefined,
    createdAt: comment.createdAt.toISOString(),
    user: {
      name: comment.user.name
    }
  }
}

export async function getDashboardData() {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    include: {
      clientProjects: {
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!dbUser) throw new Error("User not found")

  // Transform projects data
  const transformedProjects = dbUser.clientProjects.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    progress: calculateProgress(project.tasks),
    tasks: project.tasks.map(task => ({
      id: task.id,
      status: task.status
    }))
  }))

  // Calculate stats
  const stats = {
    totalProjects: transformedProjects.length,
    inProgressProjects: transformedProjects.filter(p => p.status === 'IN_PROGRESS').length,
    completedProjects: transformedProjects.filter(p => p.status === 'DONE').length,
    onHoldProjects: transformedProjects.filter(p => p.status === 'PENDING').length
  }

  return {
    user: {
      id: dbUser.id,
      firstName: dbUser.name?.split(' ')[0] || null,
      lastName: dbUser.name?.split(' ')[1] || null,
      email: user.emailAddresses[0]?.emailAddress || null
    },
    projects: transformedProjects,
    stats
  }
}

function calculateProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0
  const completedTasks = tasks.filter(task => task.status === 'DONE').length
  return Math.round((completedTasks / tasks.length) * 100)
} 