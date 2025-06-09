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
  rating?: number
  createdAt: string
  user: {
    name: string | null
    profileImage: string | null
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

export async function getProjectComments(projectId: string) {
  const comments = await db.comment.findMany({
    where: {
      projectId
    },
    include: {
      user: {
        select: {
          name: true,
          profileImage: true
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
    rating: comment.rating,
    createdAt: comment.createdAt.toISOString(),
    user: {
      name: comment.user.name,
      profileImage: comment.user.profileImage
    }
  }))
}

export async function addProjectComment(projectId: string, content: string, rating?: number) {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  const comment = await db.comment.create({
    data: {
      content,
      rating,
      projectId,
      userId: user.id
    },
    include: {
      user: {
        select: {
          name: true,
          profileImage: true
        }
      }
    }
  })

  return {
    id: comment.id,
    content: comment.content,
    rating: comment.rating,
    createdAt: comment.createdAt.toISOString(),
    user: {
      name: comment.user.name,
      profileImage: comment.user.profileImage
    }
  }
}

export async function getDashboardData() {
  const user = await currentUser()
  if (!user) throw new Error("Not authenticated")

  // Get the user's internal database ID
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { 
      id: true,
      name: true,
      role: true
    }
  })

  if (!dbUser || dbUser.role !== 'CLIENT') {
    throw new Error("Not authorized to view client dashboard")
  }

  // Get all projects where the user is the client
  const projects = await db.project.findMany({
    where: {
      clientId: dbUser.id
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  role: true
                }
              }
            }
          }
        }
      },
      tasks: true
    }
  })

  // Transform projects to include progress
  const transformedProjects = projects.map(project => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      progress,
      team: project.team,
      tasks: project.tasks
    }
  })

  // Calculate dashboard stats
  const stats = {
    totalProjects: projects.length,
    inProgressProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    onHoldProjects: projects.filter(p => p.status === 'ON_HOLD').length
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