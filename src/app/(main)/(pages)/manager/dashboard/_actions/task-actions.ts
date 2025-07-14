'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { triggerTaskUpdate, triggerTaskDelete } from './real-time'
import { createTaskAssignedNotification, createTaskRescheduledNotification } from '@/lib/notifications'
import { pusherServer } from '@/lib/pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher'

export type TaskStatus = 'ASSIGNED' | 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'IN_PROGRESS' | 'DONE'

interface EditTaskData {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: Date | null
  assignedToId: string | null
  projectId: string | null
  requiredSkills: string[]
}

export async function editTask(data: EditTaskData) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      return { success: false, error: 'Not authorized to edit tasks' }
    }

    const task = await db.task.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        deadline: data.deadline,
        assignedToId: data.assignedToId,
        projectId: data.projectId,
        requiredSkills: data.requiredSkills
      },
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
      }
    })

    // Transform task to match interface
    const transformedTask = {
      ...task,
      status: task.status as TaskStatus,
      deadline: task.deadline?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }

    // Trigger real-time update
    await pusherServer.trigger(CHANNELS.TASKS, EVENTS.TASK_UPDATED, {
      task: transformedTask
    })

    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    if (data.projectId) {
      revalidatePath(`/projects/${data.projectId}`)
    }

    return { success: true, task: transformedTask }
  } catch (error) {
    console.error('Error editing task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to edit task'
    }
  }
}

export async function deleteTask(taskId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate user role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      return { success: false, error: 'Not authorized to delete tasks' }
    }

    // Validate task exists
    const task = await db.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Delete the task
    await db.task.delete({
      where: { id: taskId }
    })

    // Revalidate only the manager dashboard path
    revalidatePath('/manager/dashboard', 'page')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete task'
    }
  }
}

export async function unassignTask(taskId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate user role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      return { success: false, error: 'Not authorized to unassign tasks' }
    }

    // Validate task exists
    const task = await db.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Unassign the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        assignedToId: null
      },
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
      }
    })

    // Trigger real-time update
    await triggerTaskUpdate(taskId, updatedTask)

    // Revalidate only the manager dashboard path
    revalidatePath('/manager/dashboard', 'page')

    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error unassigning task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unassign task'
    }
  }
}

export async function startTask(taskId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's internal database ID and role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    // Validate task exists and user is assigned to it
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assignedToId: dbUser.id },
          { creatorId: dbUser.id }
        ]
      }
    })

    if (!task) {
      return { success: false, error: 'Task not found or not authorized' }
    }

    if (task.status !== 'PENDING') {
      return { success: false, error: 'Task is not in pending status' }
    }

    // Update the task status to IN_PROGRESS
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' as TaskStatus },
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
      }
    })

    // Trigger real-time update
    await triggerTaskUpdate(taskId, updatedTask)

    // Revalidate paths
    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    if (updatedTask.projectId) {
      revalidatePath(`/projects/${updatedTask.projectId}`)
    }

    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error starting task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to start task'
    }
  }
}

export async function unassignTaskIfUserNotExists(taskId: string) {
  try {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true
      }
    })

    if (!task) {
      throw new Error('Task not found')
    }

    // If task has no assignee, nothing to do
    if (!task.assignedToId) {
      return { success: true }
    }

    // Check if assigned user exists
    const userExists = await db.user.findUnique({
      where: { id: task.assignedToId }
    })

    // If user doesn't exist, unassign the task
    if (!userExists) {
      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          assignedToId: null,
          status: 'PENDING' // Reset status since no one is assigned
        }
      })

      // Trigger real-time update
      await triggerTaskUpdate(updatedTask)

      // Revalidate paths
      revalidatePath('/manager/dashboard')
      revalidatePath('/employee/dashboard')
      if (task.projectId) {
        revalidatePath(`/projects/${task.projectId}`)
      }

      return { success: true, unassigned: true }
    }

    return { success: true, unassigned: false }
  } catch (error) {
    console.error('Error checking task assignment:', error)
    return { success: false, error: 'Failed to check task assignment' }
  }
} 