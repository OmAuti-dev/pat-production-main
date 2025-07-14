'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { createTaskAssignedNotification } from '@/lib/notifications'

type CreateTaskData = {
  title: string
  assignedTo: string
  priority: string
  projectId: string
  description?: string
  deadline?: Date
}

export async function createTask(data: CreateTaskData) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id }
    })

    if (!dbUser) throw new Error('User not found')

    const task = await db.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'ASSIGNED',
        deadline: data.deadline,
        creatorId: dbUser.id,
        assignedToId: data.assignedTo,
        projectId: data.projectId
      }
    })

    if (data.assignedTo) {
      const assignee = await db.user.findUnique({
        where: { id: data.assignedTo },
        select: { clerkId: true }
      })

      if (assignee && assignee.clerkId && dbUser.name) {
        await createTaskAssignedNotification(
          assignee.clerkId,
          task.title,
          task.id,
          dbUser.name
        )
      }
    }

    return task
  } catch (error) {
    console.error('Error creating task:', error)
    throw error
  }
}

export async function getProjectTasks(projectId: string) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const tasks = await db.task.findMany({
      where: {
        projectId: projectId
      },
      include: {
        assignedTo: {
          select: {
            name: true
          }
        }
      }
    })

    return tasks
  } catch (error) {
    console.error('Error fetching tasks:', error)
    throw error
  }
}

export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const task = await db.task.update({
      where: { id: taskId },
      data: { status }
    })

    return task
  } catch (error) {
    console.error('Error updating task status:', error)
    throw error
  }
} 