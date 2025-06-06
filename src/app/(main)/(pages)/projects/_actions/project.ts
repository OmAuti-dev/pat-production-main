'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { Project, User, Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { Prisma } from "@prisma/client"

type CreateProjectData = {
  name: string
  description: string
  type: string
  clientId: string
  resources?: {
    title: string
    url: string
    type: string
  }[]
}

type Client = {
  clerkId: string
  name: string | null
}

type ProjectWithClient = Project & {
  client: {
    name: string | null
  }
}

type ProjectWithUser = Project & {
  User: {
    clerkId: string
    name: string | null
    profileImage: string | null
  }[]
}

type TaskWithProject = {
  Project: ProjectWithClient
}

type ProjectTeamMemberSelect = Prisma.ProjectGetPayload<{
  select: {
    teamMembers: {
      select: {
        user: {
          select: {
            clerkId: true
            name: true
            profileImage: true
          }
        }
      }
    }
  }
}>

type TeamMemberWithUser = Prisma.ProjectTeamMemberGetPayload<{
  select: {
    user: {
      select: {
        clerkId: true
        name: true
        profileImage: true
      }
    }
  }
}>

type ProjectEmployee = {
  clerkId: string
  name: string | null
  profileImage: string | null
}

type ProjectWithTeamMembers = Prisma.ProjectGetPayload<{
  include: {
    teamMembers: {
      include: {
        user: {
          select: {
            clerkId: true
            name: true
            profileImage: true
          }
        }
      }
    }
  }
}>

type DbUser = {
  role: Role
}

export async function createProject(data: CreateProjectData) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    // Get the current user's role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'MANAGER') {
      throw new Error('Not authorized to create projects')
    }

    // Create the project
    const project = await db.project.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        clientId: data.clientId,
        managerId: user.id, // Current user (manager) becomes the project manager
        resources: {
          create: data.resources?.map(resource => ({
            title: resource.title,
            url: resource.url,
            type: resource.type
          })) || []
        }
      }
    })

    // Optionally, add the manager as a team member
    await db.projectTeamMember.create({
      data: {
        projectId: project.id,
        userId: user.id
      }
    })

    // Revalidate both the projects page and dashboard
    revalidatePath('/projects')
    revalidatePath('/dashboard')

    return project
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

export async function getProjects() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true, name: true }
    })

    if (!dbUser) throw new Error('User not found')

    let projects;
    switch (dbUser.role) {
      case 'MANAGER':
        // Managers can see all projects they manage
        projects = await db.project.findMany({
          where: {
            managerId: user.id
          },
          include: {
            client: {
              select: {
                name: true
              }
            }
          }
        })
        return projects.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          type: project.type,
          progress: project.progress,
          client: {
            name: project.client.name || 'Unnamed Client'
          }
        }))
      
      case 'TEAM_LEADER':
      case 'EMPLOYEE':
        // Team leaders and employees can see projects they're assigned to
        const userWithTeamMemberships = await db.user.findUnique({
          where: { clerkId: user.id },
          include: {
            projectTeamMember: {
              include: {
                project: {
                  include: {
                    client: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        })
        
        if (!userWithTeamMemberships) throw new Error('User not found')
        
        return userWithTeamMemberships.projectTeamMember.map(ptm => ({
          id: ptm.project.id,
          name: ptm.project.name,
          description: ptm.project.description,
          type: ptm.project.type,
          progress: ptm.project.progress,
          client: {
            name: ptm.project.client?.name || 'Unnamed Client'
          }
        }))

      case 'CLIENT':
        // Clients can only see their own projects
        const clientProjects = await db.project.findMany({
          where: {
            clientId: user.id
          }
        })
        
        return clientProjects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          type: project.type,
          progress: project.progress,
          client: {
            name: dbUser.name || 'Unnamed Client'
          }
        }))

      default:
        throw new Error('Invalid role')
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

export async function getClients() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const clients = await db.user.findMany({
      where: {
        role: 'CLIENT'
      },
      select: {
        clerkId: true,
        name: true
      }
    })

    return clients.map((client: Client) => ({
      id: client.clerkId,
      name: client.name || 'Unnamed Client'
    }))
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw error
  }
}

export async function getProjectEmployees(projectId: string): Promise<ProjectEmployee[]> {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new Error('Project not found')
    }

    const teamMembers = await db.projectTeamMember.findMany({
      where: {
        projectId
      },
      select: {
        user: {
          select: {
            clerkId: true,
            name: true,
            profileImage: true
          }
        }
      }
    })

    return teamMembers.map(member => ({
      clerkId: member.user.clerkId,
      name: member.user.name,
      profileImage: member.user.profileImage
    }))
  } catch (error) {
    console.error('Error fetching project employees:', error)
    return []
  }
}

export async function addEmployeeToProject(projectId: string, employeeId: string): Promise<ProjectEmployee[]> {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    // Get the current user's role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      throw new Error('Not authorized to add employees to projects')
    }

    // First check if the project exists
    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Check if the employee exists and ensure we're using their clerkId
    const employee = await db.user.findUnique({
      where: { clerkId: employeeId }
    })

    if (!employee) {
      throw new Error('Employee not found in the system')
    }

    // Add employee to project using Prisma create with the correct clerkId
    await db.projectTeamMember.create({
      data: {
        projectId,
        userId: employee.clerkId // Use the clerkId from the found employee
      }
    })

    // Get updated team members
    const teamMembers = await db.projectTeamMember.findMany({
      where: {
        projectId
      },
      select: {
        user: {
          select: {
            clerkId: true,
            name: true,
            profileImage: true
          }
        }
      }
    })

    // Map the results to match ProjectEmployee type
    const formattedTeamMembers: ProjectEmployee[] = teamMembers.map(member => ({
      clerkId: member.user.clerkId,
      name: member.user.name,
      profileImage: member.user.profileImage
    }))

    // Revalidate the projects page to show updated data
    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)

    return formattedTeamMembers
  } catch (error) {
    console.error('Error adding employee to project:', error)
    throw error
  }
} 