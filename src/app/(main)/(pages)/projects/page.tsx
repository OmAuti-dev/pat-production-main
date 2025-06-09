import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Prisma, Role } from '@prisma/client'
import { addEmployeeToProject, getProjectEmployees, updateProject } from './_actions/project'
import CreateProjectButton from './_components/create-project-button'
import ProjectSelector from './_components/project-selector'
import { getClients, getProjects } from './_actions/project'
import ProjectsGrid from './_components/projects-grid'

type ProjectWithTeam = Prisma.ProjectGetPayload<{
  include: {
    client: {
      select: {
        name: true
        email: true
        profileImage: true
      }
    }
    team: {
      include: {
        members: {
          include: {
            user: {
              select: {
                clerkId: true
                name: true
                profileImage: true
                role: true
                assignedTasks: {
                  select: {
                    id: true
                    status: true
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}>

interface FormattedProject {
  id: string
  name: string
  description: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  client: {
    name: string | null
  }
  members: Array<{
    id: string
    name: string | null
    profileImage: string | null
    role: string
    assignedTasks: number
    completedTasks: number
  }>
}

export default async function ProjectsPage() {
  try {
    const user = await currentUser()
    if (!user) {
      redirect('/sign-in')
    }

    // Get user role from database
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      // Create user if they don't exist
      await db.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'New User',
          role: 'CLIENT', // Default role
          skills: [], // Empty skills array
          experience: 0
        }
      })
      redirect('/') // Redirect to home to refresh user data
    }

    // Get projects based on user's role
    const projects = await db.project.findMany({
      where: dbUser.role === 'MANAGER' ? {
        managerId: dbUser.id
      } : {
        OR: [
          { team: { members: { some: { userId: dbUser.id } } } },
          { clientId: dbUser.id }
        ]
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            profileImage: true
          }
        },
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    clerkId: true,
                    name: true,
                    profileImage: true,
                    role: true,
                    assignedTasks: {
                      select: {
                        id: true,
                        status: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }) as ProjectWithTeam[]

    // Get available employees for project assignment
    const employees = dbUser.role === 'MANAGER' ? await db.user.findMany({
      where: {
        OR: [
          { role: 'EMPLOYEE' },
          { role: 'TEAM_LEADER' }
        ]
      },
      select: {
        clerkId: true,
        name: true
      }
    }) : []

    // Get available clients for project creation
    const clients = dbUser.role === 'MANAGER' ? await db.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        clerkId: true,
        name: true
      }
    }) : []

    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      client: {
        name: project.client?.name ?? null
      },
      members: project.team?.members.map(member => ({
        id: member.user.clerkId,
        name: member.user.name,
        profileImage: member.user.profileImage,
        role: member.user.role,
        assignedTasks: member.user.assignedTasks.length,
        completedTasks: member.user.assignedTasks.filter(task => task.status === 'COMPLETED').length
      })) || []
    }))

    const formattedEmployees = employees.map(employee => ({
      id: employee.clerkId,
      name: employee.name || 'Unnamed Employee'
    }))

    const formattedClients = clients.map(client => ({
      id: client.clerkId,
      name: client.name || 'Unnamed Client'
    }))

    return (
      <ProjectsGrid
        projects={formattedProjects}
        employees={formattedEmployees}
        clients={formattedClients}
        userRole={dbUser.role}
      />
    )
  } catch (error) {
    console.error('Error:', error)
    return <div>Something went wrong</div>
  }
} 