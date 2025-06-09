'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { triggerTaskCreate } from './real-time'

interface CreateTaskData {
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: Date | null
  assignedToId: string | null
  projectId: string | null
}

export async function createTask(data: CreateTaskData) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get the user's internal database ID
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser || (dbUser.role !== 'MANAGER' && dbUser.role !== 'TEAM_LEADER')) {
      return { success: false, error: 'Not authorized to create tasks' }
    }

    // Get the assignee's internal database ID if provided
    let assigneeId: string | null = null
    if (data.assignedToId) {
      const assignee = await db.user.findUnique({
        where: { clerkId: data.assignedToId },
        select: { id: true }
      })

      if (!assignee) {
        return { success: false, error: 'Assigned user not found' }
      }
      assigneeId = assignee.id
    }

    // Create the task
    const task = await db.task.create({
      data: {
        title: data.title,
        priority: data.priority,
        status: 'TODO',
        deadline: data.deadline,
        assignedToId: assigneeId,
        creatorId: dbUser.id,
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
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      creatorId: task.creatorId,
      assignedToId: task.assignedToId,
      projectId: task.projectId,
      assignedTo: task.assignedTo ? {
        id: task.assignedTo.id,
        name: task.assignedTo.name,
        profileImage: task.assignedTo.profileImage,
        role: task.assignedTo.role
      } : undefined,
      project: task.project ? {
        id: task.project.id,
        name: task.project.name
      } : undefined
    }

    // Trigger real-time update
    await triggerTaskCreate(transformedTask)

    // Revalidate relevant paths
    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    if (data.projectId) {
      revalidatePath(`/projects/${data.projectId}`)
    }
    
    return { success: true, task: transformedTask }
  } catch (error) {
    console.error('Error creating task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task'
    }
  }
} 