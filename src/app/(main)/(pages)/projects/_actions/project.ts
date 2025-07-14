'use server'

import { db } from '@/lib/db'
import { currentUser, auth } from '@clerk/nextjs'
import { Project, User, Role, Task, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

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
  }[]
}

type TaskWithProject = {
  Project: ProjectWithClient
}

type ProjectWithMembers = Prisma.ProjectGetPayload<{
  include: {
    tasks: {
      include: {
        assignedTo: true
      }
    }
  }
}>

type ProjectMember = {
  clerkId: string
  name: string | null
  role: Role
  assignedTasks: number
  completedTasks: number
}

type ProjectEmployee = {
  clerkId: string
  name: string | null
  role: Role
  assignedTasks: number
  completedTasks: number
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

function transformProjectData(project: any) {
  // Create a map to deduplicate members and aggregate their tasks
  const memberMap = new Map();
  
  project.tasks?.forEach((task: any) => {
    if (task.assignedTo) {
      const member = task.assignedTo;
      const existingMember = memberMap.get(member.clerkId);
      
      if (existingMember) {
        existingMember.assignedTasks += 1;
        if (task.status === 'DONE') {
          existingMember.completedTasks += 1;
        }
      } else {
        memberMap.set(member.clerkId, {
          clerkId: member.clerkId,
          name: member.name,
          role: member.role,
          assignedTasks: 1,
          completedTasks: task.status === 'DONE' ? 1 : 0
        });
      }
    }
  });

  return {
    ...project,
    members: Array.from(memberMap.values())
  };
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

    // Create the project
    const project = await db.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
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
      select: { id: true, role: true }
    })

    if (!dbUser) throw new Error('User not found')

    let projects;
    switch (dbUser.role) {
      case 'MANAGER':
        // Managers can see all projects they manage
        projects = await db.project.findMany({
          where: {
            managerId: dbUser.id
          },
          include: {
            client: {
              select: {
                name: true
              }
            },
            tasks: {
              include: {
                assignedTo: {
                  select: {
                    clerkId: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        });
        return projects.map(transformProjectData);

      case 'TEAM_LEADER':
      case 'EMPLOYEE':
        // Team leaders and employees can see projects they're assigned to
        projects = await db.project.findMany({
          where: {
            tasks: {
              some: {
                assignedToId: dbUser.id
              }
            }
          },
          include: {
            client: {
              select: {
                name: true
              }
            },
            tasks: {
              include: {
                assignedTo: {
                  select: {
                    clerkId: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        });
        return projects.map(transformProjectData);

      case 'CLIENT':
        // Clients can see their own projects
        projects = await db.project.findMany({
          where: {
            clientId: dbUser.id
          },
          include: {
            client: {
              select: {
                name: true
              }
            },
            tasks: {
              include: {
                assignedTo: {
                  select: {
                    clerkId: true,
                    name: true,
                    role: true
                  }
                }
              }
            }
          }
        });
        return projects.map(transformProjectData);

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

export async function getProjectEmployees(projectId: string): Promise<ProjectMember[]> {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    // Get all users who have tasks in this project
    const users = await db.user.findMany({
      where: {
        assignedTasks: {
          some: {
            projectId: projectId
          }
        }
      },
      include: {
        assignedTasks: {
          where: {
            projectId: projectId
          }
        }
      }
    })

    // Format the response
    return users.map(user => ({
      clerkId: user.clerkId,
      name: user.name,
      role: user.role,
      assignedTasks: user.assignedTasks.length,
      completedTasks: user.assignedTasks.filter(task => task.status === 'DONE').length
    }))
  } catch (error) {
    console.error('Error fetching project employees:', error)
    throw error
  }
}

export async function getProjectWithTeam(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: {
          name: true
        }
      },
      tasks: {
        include: {
          assignedTo: true
        }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Get unique members from tasks
  const members = project.tasks.reduce((acc: Array<{
    clerkId: string
    name: string | null
    role: string
    assignedTasks: number
    completedTasks: number
  }>, task) => {
    const assignedTo = task.assignedTo
    if (assignedTo?.clerkId && assignedTo?.name && assignedTo?.role) {
      const existingMember = acc.find(m => m.clerkId === assignedTo.clerkId)
      if (existingMember) {
        existingMember.assignedTasks++
        if (task.status === 'COMPLETED') {
          existingMember.completedTasks++
        }
      } else {
        acc.push({
          clerkId: assignedTo.clerkId,
          name: assignedTo.name,
          role: assignedTo.role,
          assignedTasks: 1,
          completedTasks: task.status === 'COMPLETED' ? 1 : 0
        })
      }
    }
    return acc
  }, [])

  return {
    ...project,
    members
  }
}

export async function getAvailableEmployees(projectId: string) {
  // Get all employees
  const employees = await db.user.findMany({
    where: {
      role: {
        in: ['EMPLOYEE', 'TEAM_LEADER']
      }
    },
    select: {
      clerkId: true,
      name: true
    }
  })

  // Get employees already assigned to tasks in the project
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        select: {
          assignedToId: true
        }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Filter out employees who are already assigned to tasks
  const assignedEmployeeIds = new Set(project.tasks.map(task => task.assignedToId).filter(Boolean))
  const availableEmployees = employees.filter(employee => !assignedEmployeeIds.has(employee.clerkId))

  return availableEmployees
}

export async function addEmployeeToProject(projectId: string, employeeClerkId: string) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  // Get the manager's database ID
  const manager = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true }
  })

  if (!manager) {
    throw new Error('Manager not found')
  }

  // Get the project and employee
  const [project, employee] = await Promise.all([
    db.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: {
            assignedToId: employeeClerkId
          }
        }
      }
    }),
    db.user.findUnique({
      where: { clerkId: employeeClerkId }
    })
  ])

  if (!project) {
    throw new Error('Project not found')
  }

  if (!employee) {
    throw new Error('Employee not found')
  }

  // Check if employee is already assigned to any tasks in the project
  if (project.tasks.length > 0) {
    throw new Error('Employee is already assigned to tasks in this project')
  }

  // Create an initial task for the employee
  await db.task.create({
    data: {
      title: `Initial task for ${employee.name}`,
      description: 'Please update this task with your first assignment.',
      status: 'PENDING',
      priority: 'MEDIUM',
      projectId: project.id,
      assignedToId: employee.id,
      creatorId: manager.id
    }
  })

  revalidatePath('/projects')
  revalidatePath(`/projects/${project.id}`)
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

export async function deleteProject(projectId: string) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'MANAGER') {
      throw new Error('Not authorized to delete projects')
    }

    // Delete the project and all associated data (tasks and employee assignments)
    // This works because we have onDelete: CASCADE set up in our schema
    const deletedProject = await db.project.delete({
      where: { id: projectId }
    })

    revalidatePath('/projects')
    revalidatePath('/manager/dashboard')
    return deletedProject
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
} 