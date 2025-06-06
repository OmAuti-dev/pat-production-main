'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

type CreateTaskData = {
  title: string
  assignedTo: string
  priority: string
  status: string
  projectId: string
}

export async function createTask(data: CreateTaskData) {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    // Get the current user's role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      throw new Error('Not authorized to create tasks')
    }

    // Create the task
    const task = await db.task.create({
      data: {
        title: data.title,
        status: data.status,
        priority: data.priority,
        projectId: data.projectId,
        assignedToId: data.assignedTo,
        createdById: user.id
      }
    })

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
            name: true,
            profileImage: true
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