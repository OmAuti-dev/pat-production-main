'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    assignedTo: {
      select: {
        name: true
        profileImage: true
      }
    }
    Project: {
      select: {
        name: true
      }
    }
    comments: {
      include: {
        user: {
          select: {
            name: true
            profileImage: true
          }
        }
      }
    }
  }
}>

const taskInclude = {
  assignedTo: {
    select: {
      name: true,
      profileImage: true
    }
  },
  Project: {
    select: {
      name: true
    }
  },
  comments: {
    include: {
      user: {
        select: {
          name: true,
          profileImage: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc' as const
    }
  }
} satisfies Prisma.TaskInclude

export async function getProjectTasks(projectId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    // Get tasks based on role
    const tasks = await db.task.findMany({
      where: {
        projectId,
        ...(dbUser.role !== 'MANAGER' && {
          assignedToId: user.id
        })
      },
      include: taskInclude,
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return { success: true, tasks }
  } catch (error) {
    console.error('Error fetching project tasks:', error)
    return { success: false, error: 'Failed to fetch tasks' }
  }
}

export async function updateKanbanTaskStatus(taskId: string, newStatus: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's role and the task
    const [dbUser, task] = await Promise.all([
      db.user.findUnique({
        where: { clerkId: user.id },
        select: { role: true }
      }),
      db.task.findUnique({
        where: { id: taskId },
        select: { assignedToId: true, projectId: true }
      })
    ])

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Check authorization
    if (dbUser.role !== 'MANAGER' && task.assignedToId !== user.id) {
      return { success: false, error: 'Not authorized to update this task' }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: taskInclude
    })

    // Revalidate all relevant paths
    revalidatePath('/kanban')
    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    revalidatePath(`/projects/${task.projectId}`)

    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error updating task status:', error)
    return { success: false, error: 'Failed to update task status' }
  }
}

export async function addTaskComment(taskId: string, content: string, rating?: number) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's role and the task
    const [dbUser, task] = await Promise.all([
      db.user.findUnique({
        where: { clerkId: user.id },
        select: { role: true }
      }),
      db.task.findUnique({
        where: { id: taskId },
        select: { assignedToId: true, projectId: true }
      })
    ])

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Check authorization
    if (dbUser.role !== 'MANAGER' && task.assignedToId !== user.id) {
      return { success: false, error: 'Not authorized to comment on this task' }
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        content,
        rating,
        task: {
          connect: { id: taskId }
        },
        user: {
          connect: { clerkId: user.id }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true
          }
        }
      }
    })

    // Revalidate paths
    revalidatePath('/kanban')
    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    revalidatePath(`/projects/${task.projectId}`)

    return { success: true, comment }
  } catch (error) {
    console.error('Error adding task comment:', error)
    return { success: false, error: 'Failed to add comment' }
  }
}

export async function updateTaskResourceUrl(taskId: string, resourceUrl: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's role and the task
    const [dbUser, task] = await Promise.all([
      db.user.findUnique({
        where: { clerkId: user.id },
        select: { role: true }
      }),
      db.task.findUnique({
        where: { id: taskId },
        select: { assignedToId: true, projectId: true }
      })
    ])

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Check authorization
    if (dbUser.role !== 'MANAGER' && task.assignedToId !== user.id) {
      return { success: false, error: 'Not authorized to update this task' }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        resourceUrl
      },
      include: taskInclude
    })

    // Revalidate paths
    revalidatePath('/kanban')
    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    revalidatePath(`/projects/${task.projectId}`)

    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error updating task resource URL:', error)
    return { success: false, error: 'Failed to update resource URL' }
  }
} 