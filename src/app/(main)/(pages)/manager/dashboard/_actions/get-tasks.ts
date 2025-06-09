'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getTasks() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    // Get user's role and ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser || dbUser.role !== 'MANAGER') {
      throw new Error('Not authorized to view tasks')
    }

    const tasks = await db.task.findMany({
      include: {
        assignedTo: {
          select: {
            name: true,
            profileImage: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform tasks to match the expected format
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      creatorId: task.creatorId,
      assignedToId: task.assignedToId,
      projectId: task.projectId,
      assignedTo: task.assignedTo ? {
        name: task.assignedTo.name,
        profileImage: task.assignedTo.profileImage
      } : undefined,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name
      } : undefined
    }))

    return { success: true, tasks: transformedTasks }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return { success: false, error: 'Failed to fetch tasks' }
  }
} 