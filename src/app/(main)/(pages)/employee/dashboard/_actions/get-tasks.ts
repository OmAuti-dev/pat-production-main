'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getEmployeeTasks() {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const tasks = await db.task.findMany({
      where: {
        assignedToId: user.id,
        status: {
          not: 'DONE'
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            clerkId: true,
            name: true,
            profileImage: true,
            role: true
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      }
    })

    // Transform tasks to match the manager dashboard Task type
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline?.toISOString() || '', // Empty string for tasks without deadline
      completed: task.status === 'DONE',
      projectId: task.projectId || '',
      Project: task.project ? {
        id: task.project.id,
        name: task.project.name
      } : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.clerkId,
        name: task.assignedTo.name,
        profileImage: task.assignedTo.profileImage,
        role: task.assignedTo.role
      } : null
    }))

    return { success: true, tasks: transformedTasks }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return { success: false, error: 'Failed to fetch tasks' }
  }
} 