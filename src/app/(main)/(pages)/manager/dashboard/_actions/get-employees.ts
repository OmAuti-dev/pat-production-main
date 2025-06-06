'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getEmployees() {
  try {
    const user = await currentUser()
    if (!user) throw new Error('Not authenticated')

    const employees = await db.user.findMany({
      where: {
        role: {
          in: ['EMPLOYEE', 'TEAM_LEADER']
        }
      },
      select: {
        clerkId: true,
        name: true,
        role: true,
        profileImage: true
      }
    })

    return { success: true, employees }
  } catch (error) {
    console.error('Error fetching employees:', error)
    return { success: false, error: 'Failed to fetch employees' }
  }
} 