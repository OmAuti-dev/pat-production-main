'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

export async function startTimeTracking(taskId: string, description?: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if there's already an active time entry for this user
    const activeTimeEntry = await db.timeEntry.findFirst({
      where: {
        userId: user.id,
        endTime: null
      }
    })

    if (activeTimeEntry) {
      return { success: false, error: 'You already have an active time entry' }
    }

    // Create new time entry
    const timeEntry = await db.timeEntry.create({
      data: {
        startTime: new Date(),
        description,
        task: {
          connect: { id: taskId }
        },
        user: {
          connect: { clerkId: user.id }
        }
      }
    })

    // Revalidate paths
    revalidatePath('/dashboards/employee')

    return {
      success: true,
      timeEntry: {
        id: timeEntry.id,
        startTime: timeEntry.startTime.toISOString(),
        description: timeEntry.description
      }
    }
  } catch (error) {
    console.error('Error starting time tracking:', error)
    return { success: false, error: 'Failed to start time tracking' }
  }
}

export async function stopTimeTracking(timeEntryId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update time entry
    const timeEntry = await db.timeEntry.update({
      where: {
        id: timeEntryId,
        userId: user.id,
        endTime: null
      },
      data: {
        endTime: new Date()
      }
    })

    // Revalidate paths
    revalidatePath('/dashboards/employee')

    return { success: true }
  } catch (error) {
    console.error('Error stopping time tracking:', error)
    return { success: false, error: 'Failed to stop time tracking' }
  }
}

export async function getActiveTimeEntry(taskId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get active time entry
    const timeEntry = await db.timeEntry.findFirst({
      where: {
        userId: user.id,
        taskId,
        endTime: null
      }
    })

    if (!timeEntry) {
      return { success: true, timeEntry: null }
    }

    return {
      success: true,
      timeEntry: {
        id: timeEntry.id,
        startTime: timeEntry.startTime.toISOString(),
        description: timeEntry.description
      }
    }
  } catch (error) {
    console.error('Error getting active time entry:', error)
    return { success: false, error: 'Failed to get active time entry' }
  }
}

export async function getTaskTimeEntries(taskId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get all time entries for the task
    const timeEntries = await db.timeEntry.findMany({
      where: {
        userId: user.id,
        taskId
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return {
      success: true,
      timeEntries: timeEntries.map(entry => ({
        id: entry.id,
        startTime: entry.startTime.toISOString(),
        endTime: entry.endTime?.toISOString(),
        description: entry.description,
        duration: entry.endTime 
          ? Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000)
          : null
      }))
    }
  } catch (error) {
    console.error('Error getting task time entries:', error)
    return { success: false, error: 'Failed to get task time entries' }
  }
} 