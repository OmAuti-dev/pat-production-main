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
    const projectMembers = await db.projectTeamMember.findMany({
      where: {
        projectId
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
    // Get all team members across projects
    const allMembers = await db.user.findMany({
      where: {
        projectTeamMember: {
          some: {} // Has any project membership
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

  // Get all projects for the user based on their role
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: {
      role: true
    }
  })

  if (!dbUser) throw new Error("User not found")

  let projects = []
  
  switch (dbUser.role) {
    case 'ADMIN':
    case 'MANAGER':
      // Admins and managers can see all projects
      projects = await db.project.findMany({
        include: {
          teamMembers: true,
          tasks: true,
        }
      })
      break
      
    case 'TEAM_LEADER':
    case 'EMPLOYEE':
      // Team members can see projects they're assigned to
      projects = await db.project.findMany({
        where: {
          teamMembers: {
            some: {
              userId: user.id
            }
          }
        },
        include: {
          teamMembers: true,
          tasks: true,
        }
      })
      break
      
    case 'CLIENT':
      // Clients can only see their own projects
      projects = await db.project.findMany({
        where: {
          clientId: user.id
        },
        include: {
          teamMembers: true,
          tasks: true,
        }
      })
      break
  }

  // Transform projects into the format expected by the dashboard
  const transformedProjects = projects.map(project => {
    // Calculate project status based on progress
    let status: ProjectStatus = "In Progress"
    if (project.progress === 100) status = "Completed"
    else if (project.progress === 0) status = "On Hold"

    // Get the earliest and latest task dates for the project timeline
    const taskDates = project.tasks
      .map(task => task.dueDate)
      .filter((date): date is Date => date !== null)
    
    const startDate = taskDates.length > 0 
      ? new Date(Math.min(...taskDates.map(d => d.getTime())))
      : project.createdAt
    
    const endDate = taskDates.length > 0
      ? new Date(Math.max(...taskDates.map(d => d.getTime())))
      : project.updatedAt

    return {
      title: project.name,
      category: project.type,
      description: project.description,
      progress: project.progress,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      memberCount: project.teamMembers.length,
      commentCount: project.tasks.length, // Using tasks count as a proxy for comments
      status,
    }
  })

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses[0]?.emailAddress,
    },
    projects: transformedProjects,
    stats: {
      totalProjects: projects.length,
      inProgressProjects: projects.filter(p => p.progress > 0 && p.progress < 100).length,
      completedProjects: projects.filter(p => p.progress === 100).length,
      onHoldProjects: projects.filter(p => p.progress === 0).length,
    }
  }
} 