'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { Project, User, Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { Prisma } from "@prisma/client"

type CreateProjectData = {
  name: string
  description: string
  status: string
  clientId: string
  startDate?: Date | null
  endDate?: Date | null
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

type ProjectEmployee = {
  clerkId: string
  name: string | null
  profileImage: string | null
}

type DbUser = {
  role: Role
}

interface UpdateProjectData {
  name: string
  description: string
  type: string
  progress: number
  status: string
  clientId?: string
}

export async function createProject(data: CreateProjectData) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser || dbUser.role !== 'MANAGER') {
      throw new Error('Not authorized to create projects')
    }

    // Get the client's internal database ID
    const client = await db.user.findUnique({
      where: { clerkId: data.clientId },
      select: { id: true }
    })

    if (!client) throw new Error('Client not found')

    // Create a new team for the project
    const team = await db.team.create({
      data: {
        name: `${data.name} Team`,
        leader: {
          connect: {
            id: dbUser.id
          }
        }
      }
    })

    // Create the project
    const project = await db.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        team: {
          connect: {
            id: team.id
          }
        },
        manager: {
          connect: {
            id: dbUser.id
          }
        },
        client: {
          connect: {
            id: client.id
          }
        }
      }
    })

    revalidatePath('/projects')
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
      select: { role: true }
    })

    if (!dbUser) throw new Error('User not found')

    switch (dbUser.role) {
      case 'MANAGER':
        // Managers can see all projects they manage
        return await db.project.findMany({
          where: {
            manager: {
              clerkId: user.id
            }
          },
          include: {
            client: {
              select: {
                name: true
              }
            }
          }
        })

      case 'TEAM_LEADER':
      case 'EMPLOYEE':
        // Team leaders and employees can see projects they're assigned to
        const userWithTeamMemberships = await db.user.findUnique({
          where: { clerkId: user.id },
          include: {
            memberOfTeams: {
              include: {
                team: {
                  include: {
                    projects: {
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
            }
          }
        })
        
        if (!userWithTeamMemberships) throw new Error('User not found')
        
        // Flatten projects from all teams
        const projects = userWithTeamMemberships.memberOfTeams.flatMap(membership => 
          membership.team.projects
        )

        // Remove duplicates
        return Array.from(new Map(projects.map(project => [project.id, project])).values())

      case 'CLIENT':
        // Clients can only see their own projects
        return await db.project.findMany({
          where: {
            client: {
              clerkId: user.id
            }
          }
        })

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

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'MANAGER') {
      throw new Error('Not authorized to view clients')
    }

    const clients = await db.user.findMany({
      where: {
        role: 'CLIENT'
      },
      select: {
        clerkId: true,
        name: true
      }
    })

    return clients
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw error
  }
}

export async function getProjectEmployees(projectId: string) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    clerkId: true,
                    name: true,
                    profileImage: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!project) throw new Error('Project not found')

    return project.team?.members.map(member => ({
      clerkId: member.user.clerkId,
      name: member.user.name,
      profileImage: member.user.profileImage
    })) || []
  } catch (error) {
    console.error('Error fetching project employees:', error)
    throw error
  }
}

export async function addEmployeeToProject(projectId: string, employeeClerkId: string) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      throw new Error('Not authorized to add team members')
    }

    // Get the project and its team
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        team: true
      }
    })

    if (!project || !project.team) throw new Error('Project or team not found')

    // Get the employee's internal database ID
    const employee = await db.user.findUnique({
      where: { clerkId: employeeClerkId },
      select: { id: true }
    })

    if (!employee) throw new Error('Employee not found')

    // Check if the employee is already a member of the team
    const existingMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: employee.id,
          teamId: project.team.id
        }
      }
    })

    if (existingMember) {
      throw new Error('Employee is already a member of this team')
    }

    // Create the team member
    await db.teamMember.create({
      data: {
        teamId: project.team.id,
        userId: employee.id
      }
    })

    revalidatePath('/projects')
  } catch (error) {
    console.error('Error adding employee to project:', error)
    throw error
  }
}

export async function updateProject(projectId: string, data: {
  name: string
  description: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
}) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      throw new Error('Not authorized to update project')
    }

    const project = await db.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate
      }
    })

    revalidatePath('/projects')
    return project
  } catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
} 