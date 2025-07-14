'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { unassignTaskIfUserNotExists } from './task-actions'

export async function getTasks() {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's database ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found in database' }
    }

    // Get all tasks
    const tasks = await db.task.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true
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
        createdAt: 'desc'
      }
    })

    // Check each task's assigned user and unassign if user doesn't exist
    const taskChecks = await Promise.all(
      tasks.map(async task => {
        if (task.assignedToId) {
          const result = await unassignTaskIfUserNotExists(task.id)
          if (result.unassigned) {
            // Return the updated task data
            return {
              ...task,
              assignedTo: null,
              assignedToId: null,
              status: 'PENDING'
            }
          }
        }
        return task
      })
    )

    // Transform tasks to match the interface
    const transformedTasks = taskChecks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignedToId: task.assignedToId,
      projectId: task.projectId,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.id,
        name: task.assignedTo.name,
        role: task.assignedTo.role
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