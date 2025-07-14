'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getProjects() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    // Get the user's internal database ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    })

    if (!dbUser) throw new Error('User not found')

    const projects = await db.project.findMany({
      where: {
        managerId: dbUser.id
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    // Transform projects to match interface
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
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        managerId: project.managerId,
        clientId: project.clientId,
        progress
      }
    })

    return { success: true, projects: transformedProjects }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { success: false, error: 'Failed to fetch projects' }
  }
} 