'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

interface CreateTaskData {
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  deadline: Date
  assignedToId: string
  projectId: string
}

export async function createTask(data: CreateTaskData) {
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
      return { success: false, error: 'Not authorized to create tasks' }
    }

    // Validate project exists
    const project = await db.project.findUnique({
      where: { id: data.projectId }
    })

    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    // Validate assignee exists
    const assignee = await db.user.findUnique({
      where: { clerkId: data.assignedToId }
    })

    if (!assignee) {
      return { success: false, error: 'Assigned user not found' }
    }

    // Create the task
    const task = await db.task.create({
      data: {
        title: data.title,
        priority: data.priority,
        status: 'TODO',
        dueDate: data.deadline,
        assignedToId: data.assignedToId,
        createdById: user.id,
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

    // Revalidate relevant paths
    revalidatePath('/manager/dashboard')
    revalidatePath('/employee/dashboard')
    revalidatePath(`/projects/${data.projectId}`)
    
    return { success: true, task }
  } catch (error) {
    console.error('Error creating task:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task'
    }
  }
} 