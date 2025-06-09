'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { triggerTaskUpdate } from './real-time'

interface EditTaskData {
  id: string
  title?: string
  status?: string
  priority?: string
  deadline?: Date | null
  assignedToId?: string | null
  projectId?: string | null
}

export async function editTask(data: EditTaskData) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's internal database ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      return { success: false, error: 'Not authorized to edit tasks' }
    }

    // Validate task exists
    const task = await db.task.findUnique({
      where: { id: data.id }
    })

    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // If changing project, validate project exists
    if (data.projectId) {
      const project = await db.project.findUnique({
        where: { id: data.projectId }
      })

      if (!project) {
        return { success: false, error: 'Project not found' }
      }
    }

    // If changing assignee, validate assignee exists
    let assigneeId: string | undefined | null = undefined
    if (data.assignedToId !== undefined) {
      if (data.assignedToId === null) {
        assigneeId = null
      } else {
        // We're now using the database ID directly since that's what we're passing from the frontend
        assigneeId = data.assignedToId
      }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: data.id },
      data: {
        title: data.title,
        status: data.status,
        priority: data.priority,
        deadline: data.deadline,
        assignedToId: assigneeId,
        projectId: data.projectId
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            profileImage: true,
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
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      deadline: updatedTask.deadline,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
      creatorId: updatedTask.creatorId,
      assignedToId: updatedTask.assignedToId,
      projectId: updatedTask.projectId,
      assignedTo: updatedTask.assignedTo ? {
        id: updatedTask.assignedTo.id,
        name: updatedTask.assignedTo.name,
        profileImage: updatedTask.assignedTo.profileImage,
        role: updatedTask.assignedTo.role
      } : undefined,
      project: updatedTask.project ? {
        id: updatedTask.project.id,
        name: updatedTask.project.name
      } : undefined
    }

    // Trigger real-time update
    await triggerTaskUpdate(data.id, transformedTask)

    // Revalidate paths
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

    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
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
            profileImage: true,
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
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      deadline: updatedTask.deadline,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
      creatorId: updatedTask.creatorId,
      assignedToId: updatedTask.assignedToId,
      projectId: updatedTask.projectId,
      assignedTo: updatedTask.assignedTo ? {
        id: updatedTask.assignedTo.id,
        name: updatedTask.assignedTo.name,
        profileImage: updatedTask.assignedTo.profileImage,
        role: updatedTask.assignedTo.role
      } : undefined,
      project: updatedTask.project ? {
        id: updatedTask.project.id,
        name: updatedTask.project.name
      } : undefined
    }

    // Trigger real-time update
    await triggerTaskUpdate(taskId, transformedTask)

    // Revalidate paths
    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    if (updatedTask.projectId) {
      revalidatePath(`/projects/${updatedTask.projectId}`)
    }

    return { success: true, task: transformedTask }
  } catch (error) {
    console.error('Error unassigning task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unassign task'
    }
  }
} 