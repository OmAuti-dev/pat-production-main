'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { createTaskAcceptedNotification } from '@/lib/notifications'

export async function acceptTask(taskId: string) {
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

    // Update task acceptance
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { accepted: true }
    })

    // Notify the manager
    if (task.createdBy?.clerkId) {
      await createTaskAcceptedNotification(
        task.createdBy.clerkId,
        task.title,
        dbUser.name || 'Employee'
      )
    }

    revalidatePath('/dashboards/employee', 'page')
    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error accepting task:', error)
    return { success: false, error: 'Failed to accept task' }
  }
}

export async function declineTask(taskId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's database ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found in database' }
    }

    // Update task to unassigned
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        assignedToId: null,
        accepted: false
      }
    })

    revalidatePath('/dashboards/employee', 'page')
    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error declining task:', error)
    return { success: false, error: 'Failed to decline task' }
  }
} 