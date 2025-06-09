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

    // Verify the task belongs to the user
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { assignedToId: true }
    })

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    if (task.assignedToId !== user.id) {
      return { success: false, error: 'Not authorized to update this task' }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: {
        Project: {
          select: {
            name: true,
          },
        },
      },
    })

    revalidatePath('/employee/dashboard')
    revalidatePath('/manager/dashboard')
    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error updating task status:', error)
    return { success: false, error: 'Failed to update task status' }
  }
} 