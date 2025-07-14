'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { createTaskCompletedNotification } from '@/lib/notifications'

export async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's database ID and name
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, name: true }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found in database' }
    }

    // Get task and its manager's clerkId
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          select: {
            clerkId: true
          }
        }
      }
    })

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Update task status
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus }
    })

    // If task is completed, notify the manager
    if (newStatus === 'DONE' && task.createdBy?.clerkId) {
      await createTaskCompletedNotification(
        task.createdBy.clerkId,
        task.title,
        dbUser.name || 'Employee'
      )
    }

    revalidatePath('/dashboards/employee', 'page')
    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error updating task status:', error)
    return { success: false, error: 'Failed to update task status' }
  }
} 