'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getTasks() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    // Get user's role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'MANAGER') {
      throw new Error('Not authorized to view tasks')
    }

    const tasks = await db.task.findMany({
      include: {
        assignedTo: {
          select: {
            name: true,
            profileImage: true
          }
        },
        Project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return { success: true, tasks }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return { success: false, error: 'Failed to fetch tasks' }
  }
} 