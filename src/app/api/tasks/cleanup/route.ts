import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get user's role
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'MANAGER') {
      return new NextResponse('Unauthorized', { status: 403 })
    }

    // Get all tasks with assigned users
    const tasks = await db.task.findMany({
      where: {
        assignedToId: {
          not: null
        }
      },
      include: {
        assignedTo: true
      }
    })

    // Track tasks that were unassigned
    const unassignedTasks = []

    // Check each task and unassign if user doesn't exist
    for (const task of tasks) {
      if (!task.assignedTo) {
        // Update the task
        await db.task.update({
          where: { id: task.id },
          data: {
            assignedToId: null,
            status: 'PENDING'
          }
        })
        unassignedTasks.push(task.id)
      }
    }

    // Revalidate paths if any tasks were unassigned
    if (unassignedTasks.length > 0) {
      revalidatePath('/manager/dashboard')
      revalidatePath('/employee/dashboard')
      revalidatePath('/projects')
    }

    return NextResponse.json({
      success: true,
      unassignedTasks,
      message: `Cleaned up ${unassignedTasks.length} tasks with non-existent users`
    })
  } catch (error) {
    console.error('Error cleaning up tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clean up tasks' },
      { status: 500 }
    )
  }
} 