import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import ProjectsGrid from './_components/projects-grid'

export default async function ProjectsPage() {
  const { userId: clerkId } = auth()
  if (!clerkId) return null

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { 
      id: true,
      role: true 
    }
  })

  if (!user) return null

  // Fetch projects with more details
  const projects = await db.project.findMany({
    where: {
      OR: [
        { managerId: user.id },
        {
          tasks: {
            some: {
              assignedToId: user.id
            }
          }
        }
      ]
    },
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
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  // Fetch all employees (excluding clients)
  const employees = await db.user.findMany({
    where: {
      role: {
        not: 'CLIENT'
      }
    },
    select: {
      clerkId: true,
      name: true
    }
  })

  // Fetch all clients
  const clients = await db.user.findMany({
    where: {
      role: 'CLIENT'
    },
    select: {
      clerkId: true,
      name: true
    }
  })

  // Format projects data to match ProjectsGrid props
  const formattedProjects = projects.map(project => {
    const members = project.tasks.reduce((acc, task) => {
      if (task.assignedTo) {
        const existingMember = acc.find(m => m.clerkId === task.assignedTo!.clerkId)
        if (existingMember) {
          existingMember.assignedTasks++
          if (task.status === 'DONE') {
            existingMember.completedTasks++
          }
        } else {
          acc.push({
            clerkId: task.assignedTo.clerkId,
            name: task.assignedTo.name,
            role: task.assignedTo.role,
            assignedTasks: 1,
            completedTasks: task.status === 'DONE' ? 1 : 0
          })
        }
      }
      return acc
    }, [] as Array<{
      clerkId: string
      name: string | null
      role: string
      assignedTasks: number
      completedTasks: number
    }>)

    return {
            id: project.id,
            name: project.name,
            description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      client: {
        name: project.client?.name ?? null
      },
      members
          }
  })

          return (
    <ProjectsGrid
      projects={formattedProjects}
      employees={employees}
      clients={clients}
              userRole={user.role}
            />
  )
} 