'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getEmployeeTasks() {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's internal database ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found in database' }
    }

    const tasks = await db.task.findMany({
      where: {
        assignedToId: dbUser.id
      },
      include: {
        project: true,
        creator: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      }
    })

    // Transform tasks to match the expected format
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline?.toISOString() || '',
      accepted: task.accepted,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      resourceUrl: task.resourceUrl || undefined,
      assignedBy: task.creator?.name || 'Unknown',
      assignedToId: task.assignedToId || undefined,
      projectId: task.projectId || '',
      Project: task.project ? {
        id: task.project.id,
        name: task.project.name
      } : null
    }))

    return { success: true, tasks: transformedTasks }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return { success: false, error: 'Failed to fetch tasks' }
  }
} 