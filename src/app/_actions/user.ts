'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'

export async function getCurrentUser() {
  try {
    const user = await currentUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get user's internal database ID and role
    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: {
        id: true,
        name: true,
        role: true,
        skills: true,
        experience: true
      }
    })

    if (!dbUser) {
      return { error: 'User not found in database' }
    }

    // Split name into first and last name
    const [firstName, ...lastNameParts] = dbUser.name.split(' ')
    const lastName = lastNameParts.join(' ')

    return {
      id: dbUser.id,
      firstName,
      lastName,
      role: dbUser.role,
      skills: dbUser.skills,
      experience: dbUser.experience
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { error: 'Failed to get user data' }
  }
} 