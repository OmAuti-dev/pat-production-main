'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

export async function updateTaskStatus(taskId: string, newStatus: string) {
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

    // Verify the task belongs to the user
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { assignedToId: true }
    })

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    if (task.assignedToId !== dbUser.id) {
      return { success: false, error: 'Not authorized to update this task' }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Transform task to match the expected format
    const transformedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status,
      priority: updatedTask.priority,
      deadline: updatedTask.deadline?.toISOString() || '',
      completed: updatedTask.status === 'DONE',
      projectId: updatedTask.projectId || '',
      Project: updatedTask.project ? {
        id: updatedTask.project.id,
        name: updatedTask.project.name
      } : null
    }

    // Revalidate both dashboards
    revalidatePath('/dashboards/employee')
    revalidatePath('/manager/dashboard')

    return { success: true, task: transformedTask }
  } catch (error) {
    console.error('Error updating task status:', error)
    return { success: false, error: 'Failed to update task status' }
  }
} 