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
      }
    }
    project: {
      select: {
        id: true
        name: true
        comments: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }
  }
}>

const taskInclude = {
  assignedTo: {
    select: {
      name: true
    }
  },
  project: {
    select: {
      id: true,
      name: true,
      comments: {
        include: {
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc' as const
        }
      }
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
      select: {
        id: true,
        role: true,
      }
    })

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    // Base query conditions
    const whereConditions: Prisma.TaskWhereInput = {
      OR: [
        // Project-specific tasks
        {
          projectId: projectId || undefined,
        },
        // Tasks without project (only for managers)
        ...(dbUser.role === 'MANAGER' ? [{ projectId: null }] : [])
      ]
    }

    // Role-based filtering
    if (dbUser.role === 'EMPLOYEE') {
      whereConditions.assignedToId = dbUser.id
    } else if (dbUser.role === 'TEAM_LEADER') {
      // Team leaders can see their team members' tasks and their own tasks
      const teamMemberIds = await db.team.findMany({
        where: {
          leaderId: dbUser.id
        },
        select: {
          members: {
            select: {
              id: true
            }
          }
        }
      }).then(teams => teams.flatMap(team => team.members.map(member => member.id)))

      whereConditions.OR = [
        { assignedToId: dbUser.id },
        { assignedToId: { in: teamMemberIds } }
      ]
    }
    // Managers can see all tasks (no additional filtering needed)

    // Get tasks based on role and conditions
    const tasks = await db.task.findMany({
      where: whereConditions,
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
        select: {
          id: true,
          role: true,
        }
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
    if (dbUser.role !== 'MANAGER' && task.assignedToId !== dbUser.id) {
      return { success: false, error: 'Not authorized to update this task' }
    }

    // Update the task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: taskInclude
    })

    // Revalidate paths
    revalidatePath('/kanban')
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
        select: {
          id: true,
          role: true,
        }
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

    if (!task.projectId) {
      return { success: false, error: 'Task is not associated with a project' }
    }

    // Check authorization
    if (dbUser.role !== 'MANAGER' && task.assignedToId !== dbUser.id) {
      return { success: false, error: 'Not authorized to comment on this task' }
    }

    // Create the comment
    const comment = await db.projectComment.create({
      data: {
        content,
        rating,
        project: {
          connect: { id: task.projectId }
        },
        user: {
          connect: { id: dbUser.id }
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    // Revalidate paths
    revalidatePath('/kanban')
    revalidatePath(`/projects/${task.projectId}`)

    return { success: true, comment }
  } catch (error) {
    console.error('Error adding task comment:', error)
    return { success: false, error: 'Failed to add comment' }
  }
}

export async function updateTaskResourceUrl(taskId: string, url: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's role and the task
    const [dbUser, task] = await Promise.all([
      db.user.findUnique({
        where: { clerkId: user.id },
        select: {
          id: true,
          role: true,
        }
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
    if (dbUser.role !== 'MANAGER' && task.assignedToId !== dbUser.id) {
      return { success: false, error: 'Not authorized to update this task' }
    }

    // Update the task with the resource URL
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        description: url // Store the URL in the description field since there's no dedicated resourceUrl field
      },
      include: taskInclude
    })

    // Revalidate paths
    revalidatePath('/kanban')
    revalidatePath(`/projects/${task.projectId}`)

    return { success: true, task: updatedTask }
  } catch (error) {
    console.error('Error updating task resource URL:', error)
    return { success: false, error: 'Failed to update resource URL' }
  }
} 