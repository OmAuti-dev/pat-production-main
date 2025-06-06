'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

interface EditTaskData {
  id: string
  title?: string
  status?: string
  priority?: string
  deadline?: string
  assignedToId?: string
  projectId?: string
}

export async function editTask(data: EditTaskData) {
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
    if (data.assignedToId) {
      const assignee = await db.user.findUnique({
        where: { clerkId: data.assignedToId }
      })

      if (!assignee) {
        return { success: false, error: 'Assigned user not found' }
      }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: data.id },
      data: {
        title: data.title,
        status: data.status,
        priority: data.priority,
        dueDate: data.deadline,
        assignedToId: data.assignedToId,
        projectId: data.projectId
      },
      include: {
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
        }
      }
    })

    revalidatePath('/manager/dashboard')
    return { success: true, task: updatedTask }
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
        assignedToId: ''
      },
      include: {
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
        }
      }
    })

    revalidatePath('/manager/dashboard')
    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error unassigning task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unassign task'
    }
  }
} 